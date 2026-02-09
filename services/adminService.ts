// Firebase Authentication Service
import {
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { authService } from './authService';
import { firebaseService } from './firebaseService';

export interface AdminUser {
  uid: string;
  email: string;
  role: 'admin';
  fullName: string;
  createdAt: Date;
}

export interface DashboardStats {
  totalUsers: number;
  totalProjects: number;
  completedProjects: number;
  totalRHBBlocks: number;
  pendingProjects: number;
  processingProjects: number;
}

export interface SuperadminAnalytics {
  totalCompanies: number;
  totalUsers: number;
  totalRHBBlocks: number;
  completedProjects: number;
  pendingProjects: number;
}

class AdminService {
  
  // Admin login - checks if user has admin role
  async adminLogin(email: string, password: string): Promise<AdminUser> {
    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if user has admin role in Firestore
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      
      if (!adminDoc.exists()) {
        // Not an admin, sign out
        await signOut(auth);
        throw new Error('Unauthorized: You do not have admin access');
      }

      const adminData = adminDoc.data();
      
      return {
        uid: user.uid,
        email: user.email || '',
        role: 'admin',
        fullName: adminData.fullName || 'Admin',
        createdAt: adminData.createdAt?.toDate() || new Date()
      };
    } catch (error: any) {
      console.error('Admin login error:', error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        throw new Error('Invalid email or password');
      }
      throw error;
    }
  }

  // Admin logout
  async adminLogout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Admin logout error:', error);
      throw error;
    }
  }

  // Check if current user is admin or superadmin
  async isAdmin(userId: string): Promise<boolean> {
    try {
      // Check the users collection for role = 'admin' or 'superadmin'
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.role === 'admin' || userData.role === 'superadmin';
      }
      
      // Fallback: check the admins collection for backward compatibility
      const adminDoc = await getDoc(doc(db, 'admins', userId));
      return adminDoc.exists();
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  // Get dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Get total users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;

      // Get all projects
      const projectsSnapshot = await getDocs(collection(db, 'projects'));
      const totalProjects = projectsSnapshot.size;

      // Count projects by status
      let completedProjects = 0;
      let pendingProjects = 0;
      let processingProjects = 0;

      projectsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'Completed') completedProjects++;
        if (data.status === 'Queue') pendingProjects++;
        if (data.status === 'Processing') processingProjects++;
      });

      // Get all RHB records and sum up quantities
      const rhbSnapshot = await getDocs(collection(db, 'rhbRecords'));
      let totalRHBBlocks = 0;

      rhbSnapshot.forEach((doc) => {
        const data = doc.data();
        totalRHBBlocks += data.quantity || 0;
      });

      return {
        totalUsers,
        totalProjects,
        completedProjects,
        totalRHBBlocks,
        pendingProjects,
        processingProjects
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  // Get superadmin analytics - system-wide metrics
  async getSuperadminAnalytics(): Promise<SuperadminAnalytics> {
    try {
      // Get all companies
      const companies = await firebaseService.getCompanies();

      // Get all users from users collection
      const usersSnapshot = await getDocs(collection(db, 'users'));
      let totalUsers = usersSnapshot.size;

      // Get all completed projects
      const projectsSnapshot = await getDocs(collection(db, 'projects'));
      const allProjects: any[] = [];
      let completedProjects = 0;
      let pendingProjects = 0;

      projectsSnapshot.forEach((doc) => {
        const data = doc.data();
        allProjects.push({ id: doc.id, ...data });
        if (data.status === 'Completed') completedProjects++;
        if (data.status === 'Queue') pendingProjects++;
      });

      // Calculate total RHB blocks from ALL projects
      let totalRHBBlocks = 0;
      allProjects.forEach((project) => {
        // Count blocks - prefer completedBlocks if available, otherwise count planned blocks
        totalRHBBlocks += (project.completedBlocks ?? project.blocks) || 0;
      });

      return {
        totalCompanies: companies.length,
        totalUsers,
        totalRHBBlocks,
        completedProjects,
        pendingProjects
      };
    } catch (error) {
      console.error('Error getting superadmin analytics:', error);
      throw error;
    }
  }

  // Get all users
  async getAllUsers() {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users: any[] = [];

      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLogin: data.lastLogin?.toDate() || new Date()
        });
      });

      return users;
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }

  // Get all projects
  async getAllProjects() {
    try {
      const projectsSnapshot = await getDocs(collection(db, 'projects'));
      const projects: any[] = [];

      projectsSnapshot.forEach((doc) => {
        const data = doc.data();
        projects.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });

      return projects;
    } catch (error) {
      console.error('Error getting projects:', error);
      throw error;
    }
  }

  // Get all RHB records
  async getAllRHBRecords() {
    try {
      const rhbSnapshot = await getDocs(collection(db, 'rhbRecords'));
      const records: any[] = [];

      rhbSnapshot.forEach((doc) => {
        const data = doc.data();
        records.push({
          id: doc.id,
          ...data,
          productionDate: data.productionDate?.toDate() || new Date()
        });
      });

      return records;
    } catch (error) {
      console.error('Error getting RHB records:', error);
      throw error;
    }
  }

  // Create a new user (admin only feature)
  async createUser(email: string, password: string, fullName: string, username: string, role: 'user' | 'employee' | 'admin' | 'superadmin' = 'user', company: string = ''): Promise<any> {
    try {
      // Use authService to create the user
      const userProfile = await authService.createUserAsAdmin(email, password, fullName, username, role, company);
      
      // If role is admin or superadmin, also add to admins collection
      if (role === 'admin' || role === 'superadmin') {
        try {
          await setDoc(doc(db, 'admins', userProfile.uid), {
            email: userProfile.email,
            fullName: userProfile.fullName,
            company: company || '',
            role: role,
            createdAt: new Date(),
            createdBy: auth.currentUser?.uid || 'system'
          });
        } catch (adminErr: any) {
          console.warn('Failed to create admin record:', adminErr);
        }
      }

      return userProfile;
    } catch (error: any) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
