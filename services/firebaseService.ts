// Firebase Database Service
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Company {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // superadmin uid
  totalAdmins?: number;
  totalUsers?: number;
}

export interface Collaborator {
  userId: string;
  fullName: string;
  email: string;
  blocksContributed: number; // Track how many blocks this user completed
  joinedAt?: Date;
}

export interface Project {
  id: string;
  name: string;
  blocks: number;
  estimatedTime: string;
  remainingTime?: number; // in seconds, for countdown timer
  pouringTime?: number; // in seconds, for pouring countdown (10 seconds)
  date: string;
  status: 'Queue' | 'Pouring' | 'Mixing' | 'Pouring2' | 'Completed';
  userId: string; // Project creator
  companyId?: string; // Company this project belongs to
  collaborators?: Collaborator[]; // Users collaborating on this project
  completedBlocks?: number; // Total blocks completed by all collaborators
  createdAt: Date;
  updatedAt: Date;
}

export interface TemperatureLog {
  id: string;
  temperature: number;
  timestamp: Date;
  projectId: string;
  location: string;
  deviceId?: string;
}

export interface RawMaterial {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  dateAdded: Date;
  projectId: string;
}

export interface RHBRecord {
  id: string;
  quantity: number;
  productionDate: Date;
  projectId: string;
  qualityGrade: string;
  weight: number;
}

export interface ChatSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  message: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  aiResponse?: string;
}

class FirebaseService {
  
  // ============= COMPANY OPERATIONS =============
  
  async createCompany(name: string, description: string = '', createdBy: string): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'companies'), {
        name: name.trim(),
        description: description.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: createdBy,
      });
      console.log('Company created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  }

  async getCompanies(): Promise<Company[]> {
    try {
      const q = query(collection(db, 'companies'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const companies: Company[] = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        let totalAdmins = 0;
        let totalUsers = 0;

        // Try to count admins and users - this may fail for unauthenticated users
        try {
          const usersQuery = query(
            collection(db, 'users'),
            where('company', '==', data.name)
          );
          const usersSnapshot = await getDocs(usersQuery);
          
          usersSnapshot.forEach((userDoc) => {
            const userData = userDoc.data();
            if (userData.role === 'admin') {
              totalAdmins++;
            } else if (userData.role === 'user') {
              totalUsers++;
            }
          });
        } catch (countError) {
          // If user counting fails (e.g., unauthenticated), just skip it
          // This allows signup form to still load companies list
          console.warn('Could not fetch user counts for companies:', countError);
        }
        
        companies.push({
          id: docSnap.id,
          name: data.name,
          description: data.description || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          createdBy: data.createdBy,
          totalAdmins,
          totalUsers,
        });
      }
      return companies;
    } catch (error) {
      console.error('Error getting companies:', error);
      throw error;
    }
  }

  async getCompanyUsers(companyId: string): Promise<any[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('company', '==', companyId)
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting company users:', error);
      throw error;
    }
  }

  async updateCompany(companyId: string, updates: Partial<Company>): Promise<void> {
    try {
      const companyRef = doc(db, 'companies', companyId);
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      };
      delete updateData.id;
      delete updateData.totalAdmins;
      delete updateData.totalUsers;
      
      await updateDoc(companyRef, updateData);
      console.log('Company updated successfully');
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }

  async deleteCompany(companyId: string): Promise<void> {
    try {
      // Delete all users in this company first
      const usersQuery = query(
        collection(db, 'users'),
        where('company', '==', companyId)
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      for (const userDoc of usersSnapshot.docs) {
        await deleteDoc(userDoc.ref);
      }
      
      // Then delete the company
      await deleteDoc(doc(db, 'companies', companyId));
      console.log('Company and associated users deleted successfully');
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  }
  
  // ============= PROJECT OPERATIONS =============
  
  async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        ...projectData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('Project created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  async getProjects(userId: string): Promise<Project[]> {
    try {
      // Query 1: Projects created by the user
      const createdQuery = query(
        collection(db, 'projects'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const createdSnapshot = await getDocs(createdQuery);
      const projects: Project[] = [];
      const projectIds = new Set<string>();

      // Add created projects
      createdSnapshot.forEach((doc) => {
        const data = doc.data();
        const project = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Project;
        projects.push(project);
        projectIds.add(doc.id);
      });

      // Query 2: Projects where user is a collaborator
      // Get all projects and filter client-side (Firestore doesn't support array-contains with compound queries)
      const allProjectsQuery = query(
        collection(db, 'projects'),
        orderBy('createdAt', 'desc')
      );

      const allSnapshot = await getDocs(allProjectsQuery);
      const collaboratorProjects: Project[] = [];

      allSnapshot.forEach((doc) => {
        // Skip if already added (user is creator)
        if (projectIds.has(doc.id)) return;

        const data = doc.data();
        const collaborators = data.collaborators || [];

        // Check if current user is a collaborator
        const isCollaborator = collaborators.some((collab: Collaborator) => collab.userId === userId);

        if (isCollaborator) {
          const project = {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          } as Project;
          collaboratorProjects.push(project);
        }
      });

      // Combine and sort by createdAt (newest first)
      const allProjects = [...projects, ...collaboratorProjects].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

      return allProjects;
    } catch (error) {
      console.error('Error getting projects:', error);
      // Fallback to AsyncStorage
      return await this.getProjectsFromLocal();
    }
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      console.log('Project updated successfully');
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      console.log('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  // Real-time project updates
  subscribeToProjects(userId: string, callback: (projects: Project[]) => void) {
    const q = query(
      collection(db, 'projects'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const projects: Project[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        projects.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Project);
      });
      callback(projects);
    });
  }

  // ============= COLLABORATOR OPERATIONS =============

  // Get projects where user is a collaborator or creator
  async getUserProjects(userId: string): Promise<Project[]> {
    try {
      // Get projects created by user
      const createdQuery = query(
        collection(db, 'projects'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const createdSnapshot = await getDocs(createdQuery);
      const projects: Project[] = [];
      
      createdSnapshot.forEach((doc) => {
        const data = doc.data();
        projects.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Project);
      });

      // Get projects where user is a collaborator
      const collaboratorQuery = query(
        collection(db, 'projects'),
        where('collaborators', 'array-contains', userId),
        orderBy('createdAt', 'desc')
      );
      
      const collaboratorSnapshot = await getDocs(collaboratorQuery);
      const projectIds = new Set(projects.map(p => p.id));
      
      collaboratorSnapshot.forEach((doc) => {
        if (!projectIds.has(doc.id)) {
          const data = doc.data();
          projects.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          } as Project);
        }
      });

      return projects.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error getting user projects:', error);
      // Fallback to only getting created projects
      return this.getProjects(userId);
    }
  }

  // Get company users to add as collaborators
  async getCompanyUsersList(companyId: string): Promise<Omit<Collaborator, 'blocksContributed' | 'joinedAt'>[]> {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('company', '==', companyId)
      );
      
      const snapshot = await getDocs(usersQuery);
      const users: Omit<Collaborator, 'blocksContributed' | 'joinedAt'>[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          userId: doc.id,
          fullName: data.fullName || 'Unknown',
          email: data.email || ''
        });
      });

      return users;
    } catch (error) {
      console.error('Error getting company users:', error);
      throw error;
    }
  }

  // Add collaborators to a project
  async addCollaboratorsToProject(projectId: string, userIds: string[], userDetails: {[key: string]: {fullName: string; email: string}}): Promise<void> {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDocs(query(collection(db, 'projects'), where('__name__', '==', projectId)));
      
      if (projectSnap.empty) {
        throw new Error('Project not found');
      }

      const projectData = projectSnap.docs[0].data();
      const existingCollaborators = projectData.collaborators || [];
      
      // Add new collaborators
      const newCollaborators = [...existingCollaborators];
      
      userIds.forEach(userId => {
        const exists = newCollaborators.some((c: Collaborator) => c.userId === userId);
        if (!exists && userDetails[userId]) {
          newCollaborators.push({
            userId,
            fullName: userDetails[userId].fullName,
            email: userDetails[userId].email,
            blocksContributed: 0,
            joinedAt: serverTimestamp()
          });
        }
      });

      await updateDoc(projectRef, {
        collaborators: newCollaborators,
        updatedAt: serverTimestamp()
      });

      console.log('Collaborators added to project');
    } catch (error) {
      console.error('Error adding collaborators:', error);
      throw error;
    }
  }

  // Update user's contribution (blocks) to a project
  async updateCollaboratorBlocks(projectId: string, userId: string, blocksAdded: number): Promise<void> {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) {
        throw new Error('Project not found');
      }

      const projectData = projectSnap.data() as Project;
      const collaborators = projectData.collaborators || [];
      
      // Update the specific collaborator's blocks
      const updatedCollaborators = collaborators.map((c: Collaborator) => {
        if (c.userId === userId) {
          return {
            ...c,
            blocksContributed: (c.blocksContributed || 0) + blocksAdded
          };
        }
        return c;
      });

      // Also update creator's contribution if they're the one working
      const totalBlocks = updatedCollaborators.reduce((sum: number, c: Collaborator) => sum + c.blocksContributed, 0);

      await updateDoc(projectRef, {
        collaborators: updatedCollaborators,
        completedBlocks: totalBlocks,
        updatedAt: serverTimestamp()
      });

      console.log(`Updated ${userId}'s contribution by ${blocksAdded} blocks`);
    } catch (error) {
      console.error('Error updating collaborator blocks:', error);
      throw error;
    }
  }

  // Remove a collaborator from a project
  async removeCollaborator(projectId: string, userId: string): Promise<void> {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) {
        throw new Error('Project not found');
      }

      const projectData = projectSnap.data() as Project;
      const collaborators = (projectData.collaborators || []).filter((c: Collaborator) => c.userId !== userId);

      await updateDoc(projectRef, {
        collaborators,
        updatedAt: serverTimestamp()
      });

      console.log('Collaborator removed from project');
    } catch (error) {
      console.error('Error removing collaborator:', error);
      throw error;
    }
  }

  // ============= TEMPERATURE LOG OPERATIONS =============

  async addTemperatureLog(tempData: Omit<TemperatureLog, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'temperatureLogs'), {
        ...tempData,
        timestamp: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding temperature log:', error);
      throw error;
    }
  }

  async getTemperatureLogs(projectId: string): Promise<TemperatureLog[]> {
    try {
      const q = query(
        collection(db, 'temperatureLogs'),
        where('projectId', '==', projectId),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const logs: TemperatureLog[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        logs.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as TemperatureLog);
      });

      return logs;
    } catch (error) {
      console.error('Error getting temperature logs:', error);
      return [];
    }
  }

  // ============= RAW MATERIALS OPERATIONS =============

  async addRawMaterial(materialData: Omit<RawMaterial, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'rawMaterials'), {
        ...materialData,
        dateAdded: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding raw material:', error);
      throw error;
    }
  }

  async getRawMaterials(projectId: string): Promise<RawMaterial[]> {
    try {
      const q = query(
        collection(db, 'rawMaterials'),
        where('projectId', '==', projectId),
        orderBy('dateAdded', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const materials: RawMaterial[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        materials.push({
          id: doc.id,
          ...data,
          dateAdded: data.dateAdded?.toDate() || new Date()
        } as RawMaterial);
      });

      return materials;
    } catch (error) {
      console.error('Error getting raw materials:', error);
      return [];
    }
  }

  // ============= RHB RECORDS OPERATIONS =============

  async addRHBRecord(rhbData: Omit<RHBRecord, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'rhbRecords'), {
        ...rhbData,
        productionDate: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding RHB record:', error);
      throw error;
    }
  }

  async getRHBRecords(projectId?: string): Promise<RHBRecord[]> {
    try {
      let q;
      if (projectId) {
        q = query(
          collection(db, 'rhbRecords'),
          where('projectId', '==', projectId),
          orderBy('productionDate', 'desc')
        );
      } else {
        q = query(
          collection(db, 'rhbRecords'),
          orderBy('productionDate', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const records: RHBRecord[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        records.push({
          id: doc.id,
          ...data,
          productionDate: data.productionDate?.toDate() || new Date()
        } as RHBRecord);
      });

      return records;
    } catch (error) {
      console.error('Error getting RHB records:', error);
      return [];
    }
  }

  // ============= CHAT OPERATIONS =============

  async createChatSession(userId: string): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'chatSessions'), {
        userId,
        startTime: serverTimestamp(),
        isActive: true
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw error;
    }
  }

  async addChatMessage(messageData: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'chatMessages'), {
        ...messageData,
        timestamp: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding chat message:', error);
      throw error;
    }
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      const q = query(
        collection(db, 'chatMessages'),
        where('sessionId', '==', sessionId),
        orderBy('timestamp', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const messages: ChatMessage[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as ChatMessage);
      });

      return messages;
    } catch (error) {
      console.error('Error getting chat messages:', error);
      return [];
    }
  }

  // ============= OFFLINE SUPPORT =============

  // Save data locally as backup
  async saveToLocal(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to local storage:', error);
    }
  }

  // Get data from local storage as fallback
  async getFromLocal(key: string): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting from local storage:', error);
      return null;
    }
  }

  // Fallback method for projects
  async getProjectsFromLocal(): Promise<Project[]> {
    try {
      const projects = await this.getFromLocal('projects');
      return projects || [];
    } catch (error) {
      console.error('Error getting projects from local:', error);
      return [];
    }
  }

  // Sync local data to Firebase when connection is restored
  async syncLocalToFirebase(): Promise<void> {
    try {
      // Sync projects
      const localProjects = await this.getFromLocal('projects');
      if (localProjects && Array.isArray(localProjects)) {
        for (const project of localProjects) {
          if (!project.id || project.id.includes('local_')) {
            // This is a local-only project, sync to Firebase
            const { id, ...projectData } = project;
            await this.createProject(projectData);
          }
        }
      }

      console.log('Local data synced to Firebase');
    } catch (error) {
      console.error('Error syncing local data to Firebase:', error);
    }
  }

  // ============= UTILITY METHODS =============

  // Check Firebase connection (basic connectivity test)
  async checkConnection(): Promise<boolean> {
    try {
      // Simple connectivity test - just check if Firebase app is initialized
      // This doesn't require Firestore rules or authentication
      const app = await import('../config/firebase');
      
      // Try to access Firebase app instance
      if (app.default && app.db) {
        console.log('✅ Firebase app initialized and reachable');
        return true;
      } else {
        console.log('❌ Firebase app not properly initialized');
        return false;
      }
    } catch (error) {
      console.log('❌ Firebase connection failed:', error);
      return false;
    }
  }

  // Check Firestore access (requires proper rules and auth)
  async checkFirestoreAccess(): Promise<boolean> {
    try {
      // Try to get a small document to test Firestore access
      const testQuery = query(collection(db, 'projects'), limit(1));
      await getDocs(testQuery);
      return true;
    } catch (error) {
      console.log('Firebase offline, using local storage');
      return false;
    }
  }

  // Add a tiny diagnostic document to verify authenticated writes
  async addDiagnostic(userId: string): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'diagnostics'), {
        userId,
        note: 'auth-write-test',
        createdAt: serverTimestamp()
      });
      console.log('Diagnostic doc created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating diagnostic doc:', error);
      throw error;
    }
  }

  // Batch operations for better performance
  async batchUpdateProjects(updates: { id: string; data: Partial<Project> }[]): Promise<void> {
    try {
      // Firebase batch operations would go here
      // For now, update individually
      for (const update of updates) {
        await this.updateProject(update.id, update.data);
      }
    } catch (error) {
      console.error('Error in batch update:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService();
export default firebaseService;