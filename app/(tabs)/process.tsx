import { ProjectDetailsModal } from '@/components/ProjectDetailsModal';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { db, realtimeDb } from '@/config/firebase';
import { authService } from '@/services/authService';
import { firebaseService } from '@/services/firebaseService';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { off, onValue, ref } from 'firebase/database';
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

interface Collaborator {
  userId: string;
  fullName: string;
  email: string;
  blocksContributed: number;
  joinedAt?: Date;
}

interface Project {
  id: string;
  name: string;
  blocks: number;
  estimatedTime: string;
  remainingTime?: number; // in seconds, for countdown timer (1 minute per block)
  pouringTime?: number; // in seconds, for pouring countdown (10 seconds)
  completedBlocks?: number; // Number of blocks completed so far
  date: string;
  status: 'Queue' | 'Pouring' | 'Mixing' | 'Pouring2' | 'Paused' | 'Completed';
  userId: string;
  companyId?: string;
  collaborators?: Collaborator[];
  queuePosition?: number; // Position in queue
  pouringActive?: boolean; // Active during Pouring and Pouring2 phases
  pausedStatus?: 'Pouring' | 'Mixing' | 'Pouring2'; // Store the status before pausing
  up?: boolean; // True when pouringActive is true (pump going up)
  down?: boolean; // True when pouringActive is false (pump going down)
}

interface InventoryItem {
  id: string;
  projectName: string;
  quantity: number; // Number of blocks
  dateCompleted: string;
  projectId: string;
  userId: string;
  companyId?: string;
  notes?: string;
  createdAt: string;
}

interface LoadingRecord {
  id: string;
  contactName: string;
  address: string;
  blocks: number;
  loadingDate: string;
  userId: string;
  companyId?: string;
  createdAt: string;
  notes?: string;
  status: 'OPEN' | 'CLOSED';
  inventoryId: string; // Track which inventory this came from
}

interface BackloadingRecord {
  id: string;
  contactName: string;
  address: string;
  blocks: number;
  backloadingDate: string;
  userId: string;
  companyId?: string;
  createdAt: string;
  notes?: string;
  loadingRecordId: string; // Reference to the loading record being returned
  inventoryId: string; // The inventory to return blocks to
}

export default function ProcessScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingRecords, setLoadingRecords] = useState<LoadingRecord[]>([]);
  const [backloadingRecords, setBackloadingRecords] = useState<BackloadingRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'projects' | 'inventory'>('projects');
  const [inventorySubTab, setInventorySubTab] = useState<'stock' | 'loading' | 'backloading'>('stock');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRawMaterialsModalVisible, setIsRawMaterialsModalVisible] = useState(false);
  const [isLoadingModalVisible, setIsLoadingModalVisible] = useState(false);
  const [isBackloadingModalVisible, setIsBackloadingModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Loading form states
  const [loadingContactName, setLoadingContactName] = useState('');
  const [loadingAddress, setLoadingAddress] = useState('');
  const [loadingBlocks, setLoadingBlocks] = useState('');
  const [loadingNotes, setLoadingNotes] = useState('');

  // Backloading form states
  const [backloadingContactName, setBackloadingContactName] = useState('');
  const [backloadingAddress, setBackloadingAddress] = useState('');
  const [backloadingBlocks, setBackloadingBlocks] = useState('');
  const [backloadingNotes, setBackloadingNotes] = useState('');

  // Selected inventory for loading/backloading
  const [selectedLoadingInventoryId, setSelectedLoadingInventoryId] = useState('');
  const [selectedBackloadingInventoryId, setSelectedBackloadingInventoryId] = useState('');
  const [showLoadingInventoryDropdown, setShowLoadingInventoryDropdown] = useState(false);
  const [showBackloadingInventoryDropdown, setShowBackloadingInventoryDropdown] = useState(false);
  
  // Form states
  const [projectName, setProjectName] = useState('');
  const [blocks, setBlocks] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');

  // Collaborators state
  const [companyUsers, setCompanyUsers] = useState<Omit<Collaborator, 'blocksContributed' | 'joinedAt'>[]>([]);
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);
  const [showCollaboratorDropdown, setShowCollaboratorDropdown] = useState(false);
  const [currentUserCompany, setCurrentUserCompany] = useState<string | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Project details modal state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isProjectDetailsModalVisible, setIsProjectDetailsModalVisible] = useState(false);

  // Timer for countdown
  const [timer, setTimer] = useState<number | null>(null);

  // Raw materials state
  const [materialLevels, setMaterialLevels] = useState({
    rha: 90,
    sand: 40,
    cement: 85,
    water: 95
  });

  // Store original material levels
  const originalMaterialLevels = {
    rha: 90,
    sand: 40,
    cement: 85,
    water: 95
  };

  // Listen to realtime sensor data and map to material levels
  // sensor_1 = RHA, sensor_2 = Cement, sensor_3 = Sand, sensor_4 = Water
  React.useEffect(() => {
    try {
      const sensorRef = ref(realtimeDb, 'sensor_data/sensors');

      const unsubscribe = onValue(sensorRef, (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.val();

        setMaterialLevels((prev) => ({
          ...prev,
          rha: typeof data.sensor_1?.distance_percent === 'number' ? data.sensor_1.distance_percent : prev.rha,
          cement: typeof data.sensor_2?.distance_percent === 'number' ? data.sensor_2.distance_percent : prev.cement,
          sand: typeof data.sensor_3?.distance_percent === 'number' ? data.sensor_3.distance_percent : prev.sand,
          water: typeof data.sensor_4?.distance_percent === 'number' ? data.sensor_4.distance_percent : prev.water,
        }));
      }, (error) => {
        console.error('Realtime sensor listener error:', error);
      });

      return () => {
        // remove all listeners for this ref
        off(sensorRef);
        // also call unsubscribe if returned by onValue (not necessary with off but safe)
        try { if (typeof unsubscribe === 'function') unsubscribe(); } catch (e) {}
      };
    } catch (e) {
      console.error('Failed to set up realtime sensor listener:', e);
    }
  }, []);

  // Check if materials are currently low
  const areMaterialsLow = () => {
    return materialLevels.rha === 20 && 
           materialLevels.sand === 20 && 
           materialLevels.cement === 20 && 
           materialLevels.water === 20;
  };

  // Function to calculate estimated time based on blocks
  // Per block: 20s Pouring + 60s Mixing + 10s Pouring2 = 90 seconds per block
  const calculateEstimatedTime = (numberOfBlocks: number): string => {
    const secondsPerBlock = 90; // 20 + 60 + 10
    const totalSeconds = numberOfBlocks * secondsPerBlock;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Convert time string (HH:MM:SS) to seconds
  const timeStringToSeconds = (timeString: string): number => {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  };

  // Convert seconds to time string (HH:MM:SS)
  const secondsToTimeString = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Start countdown timer for pending projects
  const startCountdownTimer = () => {
    if (timer) {
      clearInterval(timer);
    }

    const newTimer = setInterval(() => {
      setProjects(prevProjects => {
        let hasChanged = false;
        let updatedProjects = prevProjects.map(project => {
          // Skip paused projects
          if (project.status === 'Paused') {
            return project;
          }
          
          // Handle Pouring (first pouring - 20 seconds)
          if (project.status === 'Pouring' && project.pouringTime !== undefined && project.pouringTime > 0) {
            hasChanged = true;
            const newPouringTime = project.pouringTime - 1;
            
            // Update Firebase with new pouring time every second
            firebaseService.updateProject(project.id, { pouringTime: newPouringTime } as any)
              .catch(error => console.error('Error updating pouring time in Firebase:', error));
            
            // If pouring time reaches 0, move to Mixing (60 seconds per block) - Activate hardware
            if (newPouringTime <= 0) {
              firebaseService.updateProject(project.id, { 
                status: 'Mixing',
                pouringTime: 0,
                remainingTime: 60, // 1 minute mixing per block
                timerActive: true, // Hardware activates during Mixing
                pouringActive: false // Deactivate pouring
              } as any)
                .then(() => console.log(`Project ${project.id} moved to Mixing in Firebase`))
                .catch(error => console.error('Error updating project status in Firebase:', error));
              
              return { 
                ...project, 
                pouringTime: 0, 
                status: 'Mixing' as const,
                remainingTime: 60 // 1 minute mixing per block
              };
            }
            
            return { ...project, pouringTime: newPouringTime };
          }
          
          // Handle Mixing (60 seconds per block)
          if (project.status === 'Mixing' && project.remainingTime !== undefined && project.remainingTime > 0) {
            hasChanged = true;
            const newRemainingTime = project.remainingTime - 1;
            
            // Update Firebase with new remaining time every second
            firebaseService.updateProject(project.id, { remainingTime: newRemainingTime } as any)
              .catch(error => console.error('Error updating remaining time in Firebase:', error));
            
            // If mixing time reaches 0, move to Pouring2 (second pouring) - Deactivate hardware
            if (newRemainingTime <= 0) {
              firebaseService.updateProject(project.id, { 
                status: 'Pouring2',
                remainingTime: 0,
                pouringTime: 10,
                timerActive: false, // Hardware deactivates after Mixing
                pouringActive: true, // Activate pouring for second pour
                up: false, // Set to false after mixing
                down: true
              } as any)
                .then(() => console.log(`Project ${project.id} moved to Pouring2 in Firebase`))
                .catch(error => console.error('Error updating project status in Firebase:', error));
              
              return { 
                ...project, 
                remainingTime: 0, 
                status: 'Pouring2' as const,
                pouringTime: 10 // 10 seconds for second pouring
              };
            }
            
            return { ...project, remainingTime: newRemainingTime };
          }
          
          // Handle Pouring2 (second pouring - 10 seconds)
          if (project.status === 'Pouring2' && project.pouringTime !== undefined && project.pouringTime > 0) {
            hasChanged = true;
            const newPouringTime = project.pouringTime - 1;
            
            // Update Firebase with new pouring time every second
            firebaseService.updateProject(project.id, { pouringTime: newPouringTime } as any)
              .catch(error => console.error('Error updating pouring time in Firebase:', error));
            
            // If second pouring time reaches 0, check if all blocks are completed
            if (newPouringTime <= 0) {
              const completedBlocks = (project.completedBlocks || 0) + 1;
              
              // Get current user and update their contribution
              authService.getCurrentUserAsync().then(currentUser => {
                if (currentUser) {
                  firebaseService.updateCollaboratorBlocks(project.id, currentUser.uid, 1)
                    .catch(error => console.error('Error updating collaborator blocks:', error));
                }
              });
              
              // Check if all blocks are done
              if (completedBlocks >= project.blocks) {
                // All blocks completed - mark as Completed and add to inventory
                firebaseService.updateProject(project.id, { 
                  status: 'Completed',
                  pouringTime: 0,
                  completedBlocks: completedBlocks,
                  pouringActive: false
                } as any)
                  .then(() => {
                    console.log(`Project ${project.id} completed all ${project.blocks} blocks`);
                    // Add completed blocks to inventory
                    addToInventory(project.name, completedBlocks, project.id);
                  })
                  .catch(error => console.error('Error updating project status in Firebase:', error));
                
                return { 
                  ...project, 
                  pouringTime: 0, 
                  status: 'Completed' as const,
                  completedBlocks: completedBlocks
                };
              } else {
                // More blocks to process - go back to Pouring for next block
                firebaseService.updateProject(project.id, { 
                  status: 'Pouring',
                  pouringTime: 10,
                  completedBlocks: completedBlocks,
                  timerActive: false, // Hardware stays inactive during Pouring
                  pouringActive: true // Activate pouring for next block
                } as any)
                  .then(() => console.log(`Project ${project.id} starting block ${completedBlocks + 1} of ${project.blocks}`))
                  .catch(error => console.error('Error updating project status in Firebase:', error));
                
                return { 
                  ...project, 
                  pouringTime: 10,
                  status: 'Pouring' as const,
                  completedBlocks: completedBlocks
                };
              }
            }
            
            return { ...project, pouringTime: newPouringTime };
          }
          
          return project;
        });
        
        // Check if we need to start the next project in queue
        const hasActiveProject = updatedProjects.some(p => 
          p.status === 'Pouring' || p.status === 'Mixing' || p.status === 'Pouring2'
        );
        
        if (!hasActiveProject) {
          // Find the first project in Queue and start it
          const nextInQueue = updatedProjects.find(p => p.status === 'Queue');
          if (nextInQueue) {
            updatedProjects = updatedProjects.map(p => {
              if (p.id === nextInQueue.id) {
                // Update Firebase to Pouring with initial timer values
                firebaseService.updateProject(p.id, { 
                  status: 'Pouring',
                  pouringTime: 10,
                  completedBlocks: 0,
                  timerActive: false, // Hardware inactive during Pouring
                  pouringActive: true // Activate pouring
                } as any)
                  .then(() => console.log(`Project ${p.id} started Pouring block 1 of ${p.blocks} in Firebase`))
                  .catch(error => console.error('Error updating project status in Firebase:', error));
                
                return { 
                  ...p, 
                  status: 'Pouring' as const,
                  pouringTime: 10, // 10 seconds for first pouring
                  completedBlocks: 0
                };
              }
              return p;
            });
            hasChanged = true;
          }
        }
        
        // Save to storage if there were changes
        if (hasChanged) {
          saveProjects(updatedProjects);
        }
        
        return updatedProjects;
      });
    }, 1000); // Update every second

    setTimer(newTimer);
  };

  // Handle blocks input change
  const handleBlocksChange = (value: string) => {
    setBlocks(value);
    // Time calculation will be handled by useEffect
  };

  useEffect(() => {
    loadProjects();
    loadInventory();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('currentUser');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  // Start timer when component mounts and cleanup on unmount
  useEffect(() => {
    startCountdownTimer();
    
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, []);

  // Restart timer whenever projects change (to handle new pending projects)
  useEffect(() => {
    const hasActiveProjects = projects.some(p => 
      (p.status === 'Pouring' && p.pouringTime && p.pouringTime > 0) ||
      (p.status === 'Mixing' && p.remainingTime && p.remainingTime > 0) ||
      (p.status === 'Pouring2' && p.pouringTime && p.pouringTime > 0) ||
      p.status === 'Queue'
    );
    if (hasActiveProjects) {
      startCountdownTimer();
    }
  }, [projects.length]);

  // Auto-calculate time whenever blocks value changes
  useEffect(() => {
    const numberOfBlocks = parseInt(blocks);
    
    if (!isNaN(numberOfBlocks) && numberOfBlocks > 0) {
      const calculatedTime = calculateEstimatedTime(numberOfBlocks);
      setEstimatedTime(calculatedTime);
    } else if (blocks === '' || numberOfBlocks === 0) {
      setEstimatedTime('00:00:00');
    }
  }, [blocks]);

  // Real-time Firebase listener for projects (syncs timer updates across devices)
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const setupListener = async () => {
      try {
        const currentUser = await authService.getCurrentUserAsync();
        if (!currentUser) {
          console.warn('No authenticated user — cannot listen to projects');
          return;
        }

        // Query for projects created by the user
        const createdQuery = query(
          collection(db, 'projects'),
          where('userId', '==', currentUser.uid)
        );

        // Set up listener for created projects
        unsubscribe = onSnapshot(createdQuery, (snapshot) => {
          const updatedProjects: Project[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            const project: Project = {
              id: doc.id,
              name: data.name || '',
              blocks: data.blocks || 0,
              estimatedTime: data.estimatedTime || '00:00:00',
              remainingTime: data.remainingTime,
              pouringTime: data.pouringTime,
              completedBlocks: data.completedBlocks,
              date: data.date || '',
              status: data.status || 'Queue',
              userId: data.userId || '',
              companyId: data.companyId,
              collaborators: data.collaborators || [],
              pausedStatus: data.pausedStatus,
              pouringActive: data.pouringActive,
              up: data.up !== undefined ? data.up : false,
              down: data.down !== undefined ? data.down : true,
            };
            
            // Initialize timer values if needed
            if (project.status === 'Mixing' && project.remainingTime === undefined) {
              project.remainingTime = 60; // 60 seconds per block
            }
            if ((project.status === 'Pouring' || project.status === 'Pouring2') && project.pouringTime === undefined) {
              project.pouringTime = 10;
            }
            if (project.completedBlocks === undefined) {
              project.completedBlocks = 0;
            }
            
            updatedProjects.push(project);
          });
          
          // Sort by date or creation order
          updatedProjects.sort((a, b) => {
            if (a.status === 'Queue' && b.status !== 'Queue') return -1;
            if (a.status !== 'Queue' && b.status === 'Queue') return 1;
            return 0;
          });
          
          setProjects(updatedProjects);
        }, (error) => {
          console.error('Error listening to created projects:', error);
        });
      } catch (error) {
        console.error('Error setting up listener:', error);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Real-time Firebase listener for inventory (syncs across devices)
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const setupInventoryListener = async () => {
      try {
        const currentUser = await authService.getCurrentUserAsync();
        if (!currentUser) {
          console.warn('No authenticated user — cannot listen to inventory');
          return;
        }

        // Query for inventory items created by the user
        const inventoryQuery = query(
          collection(db, 'inventory'),
          where('userId', '==', currentUser.uid)
        );

        // Set up listener for inventory items
        unsubscribe = onSnapshot(inventoryQuery, (snapshot) => {
          const inventoryItems: InventoryItem[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            inventoryItems.push({
              id: doc.id,
              projectName: data.projectName || '',
              quantity: data.quantity || 0,
              dateCompleted: data.dateCompleted || '',
              projectId: data.projectId || '',
              userId: data.userId || '',
              companyId: data.companyId,
              notes: data.notes,
              createdAt: data.createdAt || new Date().toISOString(),
            });
          });
          
          // Sort by date completed (newest first)
          inventoryItems.sort((a, b) => new Date(b.dateCompleted).getTime() - new Date(a.dateCompleted).getTime());
          
          setInventory(inventoryItems);
        }, (error) => {
          console.error('Error listening to inventory:', error);
        });
      } catch (error) {
        console.error('Error setting up inventory listener:', error);
      }
    };

    setupInventoryListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Real-time Firebase listener for loading records
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const setupLoadingListener = async () => {
      try {
        const currentUser = await authService.getCurrentUserAsync();
        if (!currentUser) return;

        const loadingQuery = query(
          collection(db, 'loadingRecords'),
          where('userId', '==', currentUser.uid)
        );

        unsubscribe = onSnapshot(loadingQuery, (snapshot) => {
          const records: LoadingRecord[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            records.push({
              id: doc.id,
              contactName: data.contactName || '',
              address: data.address || '',
              blocks: data.blocks || 0,
              loadingDate: data.loadingDate || '',
              userId: data.userId || '',
              companyId: data.companyId,
              createdAt: data.createdAt || new Date().toISOString(),
              notes: data.notes,
              status: data.status || 'OPEN',
              inventoryId: data.inventoryId || '',
            });
          });
          
          records.sort((a, b) => new Date(b.loadingDate).getTime() - new Date(a.loadingDate).getTime());
          setLoadingRecords(records);
        }, (error) => {
          console.error('Error listening to loading records:', error);
        });
      } catch (error) {
        console.error('Error setting up loading listener:', error);
      }
    };

    setupLoadingListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Real-time Firebase listener for backloading records
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const setupBackloadingListener = async () => {
      try {
        const currentUser = await authService.getCurrentUserAsync();
        if (!currentUser) return;

        const backloadingQuery = query(
          collection(db, 'backloadingRecords'),
          where('userId', '==', currentUser.uid)
        );

        unsubscribe = onSnapshot(backloadingQuery, (snapshot) => {
          const records: BackloadingRecord[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            records.push({
              id: doc.id,
              contactName: data.contactName || '',
              address: data.address || '',
              blocks: data.blocks || 0,
              backloadingDate: data.backloadingDate || '',
              userId: data.userId || '',
              companyId: data.companyId,
              createdAt: data.createdAt || new Date().toISOString(),
              notes: data.notes,
              loadingRecordId: data.loadingRecordId || '',
              inventoryId: data.inventoryId || '',
            });
          });
          
          records.sort((a, b) => new Date(b.backloadingDate).getTime() - new Date(a.backloadingDate).getTime());
          setBackloadingRecords(records);
        }, (error) => {
          console.error('Error listening to backloading records:', error);
        });
      } catch (error) {
        console.error('Error setting up backloading listener:', error);
      }
    };

    setupBackloadingListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const loadProjects = async () => {
    try {
      const currentUser = await authService.getCurrentUserAsync();
      if (!currentUser) {
        console.warn('No authenticated user — cannot load projects from Firestore');
        setProjects([]);
        return;
      }

      const projectsList = await firebaseService.getProjects(currentUser.uid);
      
      // Initialize remainingTime for processing projects if not already set
      // Cast to local Project type with remainingTime
      const updatedProjects: Project[] = projectsList.map(project => {
        const localProject = project as Project;
        let updatedProject = { ...localProject };
        
        // Initialize up/down if not set
        if (updatedProject.up === undefined) {
          updatedProject.up = false;
        }
        if (updatedProject.down === undefined) {
          updatedProject.down = true;
        }
        
        if (updatedProject.status === 'Mixing' && updatedProject.remainingTime === undefined) {
          updatedProject = { ...updatedProject, remainingTime: 60 };
        }
        if (updatedProject.status === 'Pouring' && updatedProject.pouringTime === undefined) {
          updatedProject = { ...updatedProject, pouringTime: 20 };
        }
        if (updatedProject.status === 'Pouring2' && updatedProject.pouringTime === undefined) {
          updatedProject = { ...updatedProject, pouringTime: 10 };
        }
        if (updatedProject.completedBlocks === undefined) {
          updatedProject = { ...updatedProject, completedBlocks: 0 };
        }
        
        return updatedProject;
      });
      
      setProjects(updatedProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      Alert.alert('Error', 'Failed to load projects. Please try again.');
    }
  };

  const saveProjects = async (projectsList: Project[]) => {
    try {
      // Note: Individual projects are saved via firebaseService create/update methods
      // This function is kept for compatibility but does nothing (projects auto-sync)
      console.log('Projects synced to Firestore via individual operations');
    } catch (error) {
      console.error('Error saving projects:', error);
    }
  };

  const loadInventory = async () => {
    try {
      const currentUser = await authService.getCurrentUserAsync();
      if (!currentUser) {
        console.warn('No authenticated user — cannot load inventory');
        setInventory([]);
        return;
      }

      // Query inventory items for the current user
      const inventoryQuery = query(
        collection(db, 'inventory'),
        where('userId', '==', currentUser.uid)
      );

      const snapshot = await getDocs(inventoryQuery);
      const inventoryItems: InventoryItem[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        inventoryItems.push({
          id: doc.id,
          projectName: data.projectName || '',
          quantity: data.quantity || 0,
          dateCompleted: data.dateCompleted || '',
          projectId: data.projectId || '',
          userId: data.userId || '',
          companyId: data.companyId,
          notes: data.notes,
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });

      // Sort by date completed (newest first)
      inventoryItems.sort((a, b) => new Date(b.dateCompleted).getTime() - new Date(a.dateCompleted).getTime());
      setInventory(inventoryItems);
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  const addToInventory = async (projectName: string, quantity: number, projectId: string) => {
    try {
      const currentUser = await authService.getCurrentUserAsync();
      if (!currentUser) {
        console.error('No authenticated user when trying to add to inventory');
        return;
      }

      console.log(`Adding to inventory: ${quantity} blocks from project "${projectName}"`);

      const userProfile = await authService.getCurrentUserProfile();
      const companyId = (userProfile as any)?.company;

      const inventoryItem: InventoryItem = {
        id: '', // Will be set by Firestore
        projectName,
        quantity,
        dateCompleted: new Date().toLocaleDateString('en-GB'),
        projectId,
        userId: currentUser.uid,
        companyId,
        createdAt: new Date().toISOString(),
      };

      console.log('Inventory item to add:', inventoryItem);

      // Add to Firestore
      const docRef = await addDoc(
        collection(db, 'inventory'),
        inventoryItem
      );

      console.log(`Successfully added inventory item with ID: ${docRef.id}`);
      inventoryItem.id = docRef.id;
      // Update local state immediately for UI feedback
      setInventory([inventoryItem, ...inventory]);
    } catch (error: any) {
      console.error('Error adding to inventory:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
    }
  };

  const deleteInventoryItem = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, 'inventory', itemId));
      setInventory(inventory.filter(item => item.id !== itemId));
      Alert.alert('Success', 'Inventory item deleted');
    } catch (error: any) {
      console.error('Error deleting inventory item:', error);
      Alert.alert('Error', 'Failed to delete inventory item');
    }
  };

  const loadLoadingRecords = async () => {
    try {
      const currentUser = await authService.getCurrentUserAsync();
      if (!currentUser) return;

      const loadingQuery = query(
        collection(db, 'loadingRecords'),
        where('userId', '==', currentUser.uid)
      );

      const snapshot = await getDocs(loadingQuery);
      const records: LoadingRecord[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        records.push({
          id: doc.id,
          contactName: data.contactName || '',
          address: data.address || '',
          blocks: data.blocks || 0,
          loadingDate: data.loadingDate || '',
          userId: data.userId || '',
          companyId: data.companyId,
          createdAt: data.createdAt || new Date().toISOString(),
          notes: data.notes,
          status: data.status || 'OPEN',
          inventoryId: data.inventoryId || '',
        });
      });

      records.sort((a, b) => new Date(b.loadingDate).getTime() - new Date(a.loadingDate).getTime());
      setLoadingRecords(records);
    } catch (error) {
      console.error('Error loading loading records:', error);
    }
  };

  const loadBackloadingRecords = async () => {
    try {
      const currentUser = await authService.getCurrentUserAsync();
      if (!currentUser) return;

      const backloadingQuery = query(
        collection(db, 'backloadingRecords'),
        where('userId', '==', currentUser.uid)
      );

      const snapshot = await getDocs(backloadingQuery);
      const records: BackloadingRecord[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        records.push({
          id: doc.id,
          contactName: data.contactName || '',
          address: data.address || '',
          blocks: data.blocks || 0,
          backloadingDate: data.backloadingDate || '',
          userId: data.userId || '',
          companyId: data.companyId,
          createdAt: data.createdAt || new Date().toISOString(),
          notes: data.notes,
          loadingRecordId: data.loadingRecordId || '',
          inventoryId: data.inventoryId || '',
        });
      });

      records.sort((a, b) => new Date(b.backloadingDate).getTime() - new Date(a.backloadingDate).getTime());
      setBackloadingRecords(records);
    } catch (error) {
      console.error('Error loading backloading records:', error);
    }
  };

  const addLoadingRecord = async () => {
    try {
      if (!loadingContactName.trim() || !loadingAddress.trim() || !loadingBlocks.trim() || !selectedLoadingInventoryId) {
        Alert.alert('Error', 'Please fill in all required fields and select an inventory');
        return;
      }

      const blocksQty = parseInt(loadingBlocks);
      const selectedInventory = inventory.find(item => item.id === selectedLoadingInventoryId);

      if (!selectedInventory) {
        Alert.alert('Error', 'Selected inventory not found');
        return;
      }
      
      if (blocksQty > selectedInventory.quantity) {
        Alert.alert('Error', `Cannot load ${blocksQty} blocks. Only ${selectedInventory.quantity} blocks available in "${selectedInventory.projectName}".`);
        return;
      }

      const currentUser = await authService.getCurrentUserAsync();
      if (!currentUser) return;

      const userProfile = await authService.getCurrentUserProfile();
      const companyId = (userProfile as any)?.company;

      // Create loading record
      const loadingRecord: LoadingRecord = {
        id: '',
        contactName: loadingContactName.trim(),
        address: loadingAddress.trim(),
        blocks: blocksQty,
        loadingDate: new Date().toLocaleDateString('en-GB'),
        userId: currentUser.uid,
        companyId,
        createdAt: new Date().toISOString(),
        notes: loadingNotes.trim(),
        status: 'OPEN',
        inventoryId: selectedLoadingInventoryId,
      };

      const docRef = await addDoc(collection(db, 'loadingRecords'), loadingRecord);
      loadingRecord.id = docRef.id;
      setLoadingRecords([loadingRecord, ...loadingRecords]);

      // Deduct from selected inventory
      const newQuantity = selectedInventory.quantity - blocksQty;
      await updateDoc(doc(db, 'inventory', selectedLoadingInventoryId), {
        quantity: newQuantity
      });

      setLoadingContactName('');
      setLoadingAddress('');
      setLoadingBlocks('');
      setLoadingNotes('');
      setSelectedLoadingInventoryId('');
      setShowLoadingInventoryDropdown(false);
      setIsLoadingModalVisible(false);

      Alert.alert('Success', `${blocksQty} blocks loaded out from "${selectedInventory.projectName}" successfully!`);
    } catch (error: any) {
      console.error('Error adding loading record:', error);
      Alert.alert('Error', 'Failed to add loading record');
    }
  };

  const toggleLoadingStatus = async (recordId: string, currentStatus: 'OPEN' | 'CLOSED') => {
    try {
      const newStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
      await updateDoc(doc(db, 'loadingRecords', recordId), {
        status: newStatus
      });

      // Update local state
      setLoadingRecords(loadingRecords.map(record =>
        record.id === recordId ? { ...record, status: newStatus } : record
      ));

      Alert.alert('Success', `Loading status updated to ${newStatus}`);
    } catch (error: any) {
      console.error('Error updating loading status:', error);
      Alert.alert('Error', 'Failed to update loading status');
    }
  };

  const addBackloadingRecord = async () => {
    try {
      if (!backloadingContactName.trim() || !backloadingAddress.trim() || !backloadingBlocks.trim() || !selectedBackloadingInventoryId) {
        Alert.alert('Error', 'Please fill in all required fields and select a loading record');
        return;
      }

      const blocksQty = parseInt(backloadingBlocks);
      const selectedLoadingRecord = loadingRecords.find(record => record.id === selectedBackloadingInventoryId);

      if (!selectedLoadingRecord) {
        Alert.alert('Error', 'Selected loading record not found');
        return;
      }

      // Check if loading record has a valid inventoryId
      if (!selectedLoadingRecord.inventoryId || selectedLoadingRecord.inventoryId === '') {
        Alert.alert('Error', 'This loading record has no linked inventory. It may have been created before the inventory system was updated.');
        return;
      }

      if (blocksQty > selectedLoadingRecord.blocks) {
        Alert.alert('Error', `Cannot return ${blocksQty} blocks. Only ${selectedLoadingRecord.blocks} blocks in this loading record.`);
        return;
      }

      const currentUser = await authService.getCurrentUserAsync();
      if (!currentUser) return;

      const userProfile = await authService.getCurrentUserProfile();
      const companyId = (userProfile as any)?.company;

      // Find the original inventory to return blocks to
      const originalInventory = inventory.find(item => item.id === selectedLoadingRecord.inventoryId);
      if (!originalInventory) {
        Alert.alert(
          'Error',
          `Original inventory item not found. This could mean:\n\n1. The inventory item was deleted\n2. It hasn't loaded yet\n\nPlease try refreshing or contact support if the issue persists.`,
          [{ text: 'OK', style: 'default' }]
        );
        console.error('Debug info:', {
          loadingRecordId: selectedLoadingRecord.id,
          inventoryIdLookedFor: selectedLoadingRecord.inventoryId,
          availableInventoryIds: inventory.map(inv => inv.id),
          totalInventoryItems: inventory.length
        });
        return;
      }

      // Create backloading record
      const backloadingRecord: BackloadingRecord = {
        id: '',
        contactName: backloadingContactName.trim(),
        address: backloadingAddress.trim(),
        blocks: blocksQty,
        backloadingDate: new Date().toLocaleDateString('en-GB'),
        userId: currentUser.uid,
        companyId,
        createdAt: new Date().toISOString(),
        notes: backloadingNotes.trim(),
        loadingRecordId: selectedLoadingRecord.id,
        inventoryId: selectedLoadingRecord.inventoryId,
      };

      const docRef = await addDoc(collection(db, 'backloadingRecords'), backloadingRecord);
      backloadingRecord.id = docRef.id;
      setBackloadingRecords([backloadingRecord, ...backloadingRecords]);

      // Add blocks back to the original inventory
      const newQuantity = originalInventory.quantity + blocksQty;
      await updateDoc(doc(db, 'inventory', selectedLoadingRecord.inventoryId), {
        quantity: newQuantity
      });

      setBackloadingContactName('');
      setBackloadingAddress('');
      setBackloadingBlocks('');
      setBackloadingNotes('');
      setSelectedBackloadingInventoryId('');
      setShowBackloadingInventoryDropdown(false);
      setIsBackloadingModalVisible(false);

      Alert.alert('Success', `${blocksQty} blocks returned to "${originalInventory.projectName}" successfully!`);
    } catch (error: any) {
      console.error('Error adding backloading record:', error);
      Alert.alert('Error', 'Failed to add backloading record');
    }
  };

  const deleteLoadingRecord = async (recordId: string) => {
    try {
      await deleteDoc(doc(db, 'loadingRecords', recordId));
      setLoadingRecords(loadingRecords.filter(record => record.id !== recordId));
      Alert.alert('Success', 'Loading record deleted');
    } catch (error: any) {
      console.error('Error deleting loading record:', error);
      Alert.alert('Error', 'Failed to delete loading record');
    }
  };

  const deleteBackloadingRecord = async (recordId: string) => {
    try {
      await deleteDoc(doc(db, 'backloadingRecords', recordId));
      setBackloadingRecords(backloadingRecords.filter(record => record.id !== recordId));
      Alert.alert('Success', 'Backloading record deleted');
    } catch (error: any) {
      console.error('Error deleting backloading record:', error);
      Alert.alert('Error', 'Failed to delete backloading record');
    }
  };

  const loadCompanyUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const currentUser = await authService.getCurrentUserAsync();
      
      if (!currentUser) {
        console.warn('No authenticated user');
        return;
      }

      // Get the user's company from their profile in Firestore
      const userProfile = await authService.getCurrentUserProfile();
      if (userProfile && (userProfile as any).company) {
        setCurrentUserCompany((userProfile as any).company);
        
        // Load company users, excluding the current user
        const users = await firebaseService.getCompanyUsersList((userProfile as any).company);
        const filteredUsers = users.filter(u => u.userId !== currentUser.uid);
        setCompanyUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Error loading company users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleAddProject = () => {
    setEditingProject(null);
    setProjectName('');
    setBlocks('');
    setEstimatedTime('00:00:00');
    setSelectedCollaborators([]);
    setIsModalVisible(true);
    loadCompanyUsers();
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectName(project.name);
    setBlocks(project.blocks.toString());
    // Auto-calculate time based on blocks when editing
    const calculatedTime = calculateEstimatedTime(project.blocks);
    setEstimatedTime(calculatedTime);
    // Set existing collaborators
    setSelectedCollaborators(project.collaborators?.map(c => c.userId) || []);
    setIsModalVisible(true);
    loadCompanyUsers();
  };

  const handleDeleteProject = (projectId: string) => {
    Alert.alert(
      'Burahin ang Proyekto',
      'Sigurado ka bang gusto mong burahin ang proyekto na ito?',
      [
        { text: 'Kanselahin', style: 'cancel' },
        {
          text: 'Burahin',
          style: 'destructive',
          onPress: async () => {
            try {
              await firebaseService.deleteProject(projectId);
              const updatedProjects = projects.filter(p => p.id !== projectId);
              setProjects(updatedProjects);
              Alert.alert('Success', 'Tagumpay na nabura ang proyekto');
            } catch (error: any) {
              console.error('Error deleting project:', error);
              Alert.alert('Error', error?.message || 'Failed to delete project');
            }
          }
        }
      ]
    );
  };

  const handleSaveProject = async () => {
    if (!projectName.trim() || !blocks.trim() || !estimatedTime.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Check if materials are low when adding a new project
    if (!editingProject && areMaterialsLow()) {
      Alert.alert(
        'Hindi magagawa ang proyekto',
        'Ang mga Raw materials ay kakaunti. Mag-lagay muli ng raw materials upang makapag-gawa ulit ng bagong proyekto',
        [
          { text: 'OK', style: 'default' }
        ]
      );
      return;
    }

    try {
      const currentUser = await authService.getCurrentUserAsync();
      if (!currentUser) {
        Alert.alert('Error', 'You must be signed in to create projects');
        return;
      }

      const projectData = {
        name: projectName.trim(),
        blocks: parseInt(blocks),
        estimatedTime: estimatedTime.trim(),
        date: editingProject?.date || new Date().toLocaleDateString('en-GB'),
        status: editingProject?.status || 'Queue' as const,
        userId: currentUser.uid,
        companyId: currentUserCompany || undefined
      };

      if (editingProject) {
        // Update existing project in Firestore
        await firebaseService.updateProject(editingProject.id, projectData as any);
        
        // Update collaborators if changed
        if (selectedCollaborators.length > 0) {
          const userDetails: {[key: string]: {fullName: string; email: string}} = {};
          selectedCollaborators.forEach(userId => {
            const user = companyUsers.find(u => u.userId === userId);
            if (user) {
              userDetails[userId] = {
                fullName: user.fullName,
                email: user.email
              };
            }
          });
          
          await firebaseService.addCollaboratorsToProject(
            editingProject.id,
            selectedCollaborators,
            userDetails
          );
        }
        
        // Update local state
        const updatedProjects = projects.map(p => 
          p.id === editingProject.id 
            ? { 
                ...projectData, 
                id: editingProject.id, 
                remainingTime: editingProject.remainingTime,
                collaborators: selectedCollaborators.map(userId => {
                  const user = companyUsers.find(u => u.userId === userId);
                  return {
                    userId,
                    fullName: user?.fullName || 'Unknown',
                    email: user?.email || '',
                    blocksContributed: 0
                  };
                })
              } as Project
            : p
        );
        setProjects(updatedProjects);
      } else {
        // Always start new projects in Queue
        const finalStatus = 'Queue';
        
        // Get current user profile to include them as a creator/collaborator
        const userProfile = await authService.getCurrentUserProfile();
        const creatorCollaborator = {
          userId: currentUser.uid,
          fullName: (userProfile as any)?.fullName || 'Unknown',
          email: currentUser.email || '',
          blocksContributed: 0,
          joinedAt: new Date()
        };
        
        // Combine creator with selected collaborators
        const allCollaborators = [creatorCollaborator];
        if (selectedCollaborators.length > 0) {
          selectedCollaborators.forEach(userId => {
            const user = companyUsers.find(u => u.userId === userId);
            if (user) {
              allCollaborators.push({
                userId,
                fullName: user.fullName,
                email: user.email,
                blocksContributed: 0,
                joinedAt: new Date()
              });
            }
          });
        }
        
        // Create new project in Firestore with collaborators
        const projectId = await firebaseService.createProject({ 
          ...projectData, 
          status: finalStatus,
          timerActive: false, // Hardware inactive by default
          pouringActive: false, // Pouring inactive by default
          collaborators: allCollaborators
        } as any);
        
        // Add to local state with the returned ID
        const newProject: Project = {
          ...projectData,
          id: projectId,
          status: finalStatus,
          completedBlocks: 0,
          collaborators: allCollaborators
        };
        setProjects([...projects, newProject]);
      }

      setIsModalVisible(false);
      
      Alert.alert(
        'Success',
        editingProject ? 'Tagumpay na nabago ang Proyekto!' : 'Tagumpay na naidagdag ang Proyekto!'
      );
    } catch (error: any) {
      console.error('Error saving project:', error);
      Alert.alert('Error', error?.message || 'Failed to save project. Please try again.');
    }
  };

  const togglePauseProject = async (projectId: string) => {
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      if (project.status === 'Paused') {
        // Resume the project
        const resumeStatus = project.pausedStatus || 'Pouring';
        
        // Use deleteField to remove pausedStatus instead of setting it to undefined
        const { deleteField } = await import('firebase/firestore');
        await firebaseService.updateProject(projectId, { 
          status: resumeStatus,
          pausedStatus: deleteField()
        } as any);

        const updatedProjects: Project[] = projects.map(p => {
          if (p.id === projectId) {
            return { 
              ...p, 
              status: resumeStatus as Project['status']
            };
          }
          return p;
        });
        
        setProjects(updatedProjects);
        Alert.alert('Success', 'Project resumed!');
      } else if (project.status !== 'Queue' && project.status !== 'Completed') {
        // Pause the project
        await firebaseService.updateProject(projectId, { 
          status: 'Paused',
          pausedStatus: project.status,
          timerActive: false,
          pouringActive: false
        } as any);

        const updatedProjects: Project[] = projects.map(p => {
          if (p.id === projectId) {
            return { 
              ...p, 
              status: 'Paused' as const, 
              pausedStatus: project.status as 'Pouring' | 'Mixing' | 'Pouring2' | 'Molding' | undefined
            } as Project;
          }
          return p;
        });
        
        setProjects(updatedProjects);
        Alert.alert('Success', 'Nahinto ang Proyekto!');
      }
    } catch (error: any) {
      console.error('Error toggling pause:', error);
      Alert.alert('Error', 'Failed to pause/resume project');
    }
  };

  // Manual UP/DOWN button function - toggles between up: true and down: true
  const handleManualUpDown = async (projectId: string) => {
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      // Toggle: if currently up, set to down; if down, set to up
      const isCurrentlyUp = project.up === true;
      const newUp = !isCurrentlyUp;
      const newDown = isCurrentlyUp;

      // Update Firebase
      await firebaseService.updateProject(projectId, { 
        up: newUp,
        down: newDown
      } as any);

      // Update local state
      const updatedProjects = projects.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            up: newUp,
            down: newDown
          };
        }
        return p;
      });

      setProjects(updatedProjects);
      Alert.alert('Success', `Tagumpay na nai-set ang pump sa ${newUp ? 'UP' : 'DOWN'}`);
    } catch (error: any) {
      console.error('Error toggling pump direction:', error);
      Alert.alert('Error', 'Hindi matagumpay ang pag-toggle ng pump direction');
    }
  };

  const toggleProjectStatus = async (projectId: string) => {
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      const statusOrder: Project['status'][] = ['Queue', 'Pouring', 'Mixing', 'Pouring2', 'Completed'];
      const currentIndex = statusOrder.indexOf(project.status);
      const nextIndex = (currentIndex + 1) % statusOrder.length;
      const newStatus = statusOrder[nextIndex];

      // Prevent manual start of Pouring if another project is already active
      if (newStatus === 'Pouring') {
        const hasActiveProject = projects.some(p => 
          p.id !== projectId && 
          (p.status === 'Pouring' || p.status === 'Mixing' || p.status === 'Pouring2')
        );
        if (hasActiveProject) {
          Alert.alert('Hindi Makakapag-Start', 'Mayroong ibang proyekto na kasalukuyang nasa proseso. Mangyaring maghintay hanggang matapos ito.');
          return;
        }
      }

      // Update in Firestore
      await firebaseService.updateProject(projectId, { status: newStatus } as any);

      // Update local state
      const updatedProjects = projects.map(p => {
        if (p.id === projectId) {
          // Initialize pouringTime when changing to Pouring status
          if (newStatus === 'Pouring') {
            // Update Firebase with timerActive and pouringActive
            firebaseService.updateProject(p.id, { 
              timerActive: false,
              pouringActive: true 
            } as any)
              .catch(err => console.error('Error updating flags:', err));
            
            return { 
              ...p, 
              status: newStatus,
              pouringTime: 10,
              completedBlocks: 0
            };
          }
          
          // Initialize remainingTime when changing to Mixing status
          if (newStatus === 'Mixing') {
            // Update Firebase with timerActive = true, pouringActive = false
            firebaseService.updateProject(p.id, { 
              timerActive: true,
              pouringActive: false 
            } as any)
              .catch(err => console.error('Error updating flags:', err));
            
            return {
              ...p,
              status: newStatus,
              remainingTime: 60, // 60 seconds per block
              pouringTime: undefined
            };
          }
          
          // Initialize pouringTime when changing to Pouring2 status
          if (newStatus === 'Pouring2') {
            // Update Firebase with timerActive = false, pouringActive = true
            firebaseService.updateProject(p.id, { 
              timerActive: false,
              pouringActive: true 
            } as any)
              .catch(err => console.error('Error updating flags:', err));
            
            return {
              ...p,
              status: newStatus,
              pouringTime: 10,
              remainingTime: undefined
            };
          }
          
          return { ...p, status: newStatus };
        }
        return p;
      });

      setProjects(updatedProjects);
    } catch (error: any) {
      console.error('Error toggling status:', error);
      Alert.alert('Error', 'Failed to update project status');
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.id.includes(searchQuery)
  );

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'Queue': return '#FF9900';
      case 'Pouring': return '#9B59B6'; // Purple for pouring
      case 'Mixing': return '#3498DB'; // Blue for mixing
      case 'Pouring2': return '#9B59B6'; // Purple for second pouring
      case 'Paused': return '#8E8E93'; // Gray for paused
      case 'Completed': return '#00CC66';
      default: return '#FF9900';
    }
  };

  const getMaterialColor = (level: number) => {
    if (level >= 70) return '#00CC66'; // Green - Good
    if (level >= 30) return '#FF9900'; // Orange - Medium
    return '#FF3333'; // Red - Low
  };

  const handleToggleMaterialLevels = () => {
    const isCurrentlyLow = areMaterialsLow();
    
    if (isCurrentlyLow) {
      // Restore to original levels
      Alert.alert(
        'Restore Materials',
        'Restore all raw materials to their normal levels?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            onPress: () => {
              setMaterialLevels(originalMaterialLevels);
              Alert.alert('Success', 'All materials have been restored to normal levels');
            }
          }
        ]
      );
    } else {
      // Set to low
      Alert.alert(
        'Set All Materials to Low',
        'Are you sure you want to set all raw materials to low levels (20%)?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            style: 'destructive',
            onPress: () => {
              setMaterialLevels({
                rha: 20,
                sand: 20,
                cement: 20,
                water: 20
              });
              Alert.alert('Success', 'All materials have been set to low levels');
            }
          }
        ]
      );
    }
  };

  return (
    <ThemedView style={styles.container}>

      <ThemedView style={styles.header}>
              <ThemedText style={styles.headerTitle}>Proyekto</ThemedText>
      </ThemedView>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'projects' && styles.activeTab]}
          onPress={() => setActiveTab('projects')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'projects' && styles.activeTabText]}>
            Proyekto
          </ThemedText>
        </Pressable>
        {currentUser?.role === 'admin' && (
          <Pressable
            style={[styles.tab, activeTab === 'inventory' && styles.activeTab]}
            onPress={() => setActiveTab('inventory')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'inventory' && styles.activeTabText]}>
              Inventory
            </ThemedText>
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.content} scrollEventThrottle={16}>
        {/* PROJECTS TAB */}
        {activeTab === 'projects' && (
          <>
            {/* Raw Materials Status Chart */}
            <Pressable 
              style={styles.chartContainer}
              onPress={() => setIsRawMaterialsModalVisible(true)}
            >
          <View style={styles.chartHeader}>
            <ThemedText style={styles.chartTitle}>Katayuan ng Raw Materials</ThemedText>
            <Ionicons name="expand-outline" size={20} color="#8E8E93" />
          </View>
          
          <View style={styles.materialRow}>
            <ThemedText style={styles.materialLabel}>RHA</ThemedText>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${materialLevels.rha}%`, backgroundColor: getMaterialColor(materialLevels.rha) }]} />
            </View>
          </View>
          
          <View style={styles.materialRow}>
            <ThemedText style={styles.materialLabel}>Buhangin</ThemedText>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${materialLevels.sand}%`, backgroundColor: getMaterialColor(materialLevels.sand) }]} />
            </View>
          </View>
          
          <View style={styles.materialRow}>
            <ThemedText style={styles.materialLabel}>Semento</ThemedText>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${materialLevels.cement}%`, backgroundColor: getMaterialColor(materialLevels.cement) }]} />
            </View>
          </View>
          
          <View style={styles.materialRow}>
            <ThemedText style={styles.materialLabel}>Tubig</ThemedText>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${materialLevels.water}%`, backgroundColor: getMaterialColor(materialLevels.water) }]} />
            </View>
          </View>
        </Pressable>

        {/* Search and Add Section */}
        <View style={styles.actionSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Mag-search ng projects..."
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={setSearchQuery}
              selectionColor="#007AFF"
              multiline={false}
              autoCorrect={false}
            />
          </View>
          
          <Pressable style={styles.addButton} onPress={handleAddProject}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <ThemedText style={styles.addButtonText}>Dagdag</ThemedText>
          </Pressable>
        </View>

        {/* Projects Library */}
        <View style={styles.projectsContainer}>
          <View style={styles.projectsHeader}>
            <ThemedText style={styles.projectsTitle}>Nagawang Proyekto</ThemedText>
            <ThemedText style={styles.projectsCount}>
              {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
            </ThemedText>
          </View>
          
          {filteredProjects.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={48} color="#C7C7CC" style={styles.emptyIcon} />
              <ThemedText style={styles.emptyText}>
                {searchQuery ? 'Walang nakitang proyekto na tumutugma sa iyong search.' : 'Walang pang proyekto. Dagdagan mo ang iyong unang proyekto!'}
              </ThemedText>
            </View>
          ) : (
            filteredProjects.map((project, index) => (
              <Pressable 
                key={project.id} 
                style={styles.projectCard}
                onPress={() => {
                  const currentBlock = (project.completedBlocks || 0) + 1;
                  const blockProgress = project.status !== 'Queue' && project.status !== 'Completed' 
                    ? `Block ${currentBlock} of ${project.blocks}` 
                    : '';
                  
                  const timeDisplay = project.status === 'Pouring' && project.pouringTime !== undefined
                    ? `${project.pouringTime}s pouring remaining`
                    : project.status === 'Mixing' && project.remainingTime !== undefined
                    ? `${project.remainingTime}s mixing remaining`
                    : project.status === 'Pouring2' && project.pouringTime !== undefined
                    ? `${project.pouringTime}s final pouring remaining`
                    : project.status === 'Queue'
                    ? 'Waiting in queue...'
                    : project.status === 'Completed'
                    ? `All ${project.blocks} blocks completed!`
                    : `${project.estimatedTime} estimated`;
                  
                  Alert.alert(
                    project.name,
                    `📦 Kabuuang RHB: ${project.blocks}\n${blockProgress ? `🔄 Progress: ${blockProgress}\n` : ''}📅 Petsa: ${project.date}\n⏱️ Oras: ${timeDisplay}\n📊 Status: ${project.status}`,
                    [
                      { text: 'Isara', style: 'cancel' },
                      { 
                        text: 'Baguhin', 
                        onPress: () => handleEditProject(project)
                      },
                      { 
                        text: 'Burahin', 
                        style: 'destructive',
                        onPress: () => handleDeleteProject(project.id)
                      }
                    ]
                  );
                }}
              >
                <View style={styles.projectCardHeader}>
                  <View style={styles.projectInfo}>
                    <ThemedText style={styles.projectName} numberOfLines={1}>
                      {project.name}
                    </ThemedText>
                    <View style={styles.projectMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="cube-outline" size={12} color="#8E8E93" />
                        <ThemedText style={styles.metaText}>
                          {project.status !== 'Queue' && project.status !== 'Completed' 
                            ? `Block ${(project.completedBlocks || 0) + 1}/${project.blocks}`
                            : `${project.blocks} blocks`
                          }
                        </ThemedText>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={12} color="#8E8E93" />
                        <ThemedText style={styles.metaText}>{project.date}</ThemedText>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={12} color="#8E8E93" />
                        <ThemedText style={styles.metaText}>
                          {project.status === 'Pouring' && project.pouringTime !== undefined 
                            ? `${project.pouringTime}s pouring`
                            : project.status === 'Mixing' && project.remainingTime !== undefined
                            ? `${project.remainingTime}s mixing`
                            : project.status === 'Pouring2' && project.pouringTime !== undefined
                            ? `${project.pouringTime}s pouring`
                            : project.status === 'Queue'
                            ? 'Nakapila'
                            : project.status === 'Completed'
                            ? 'Tapos na!'
                            : project.estimatedTime
                          }
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.projectActions}>
                    <Pressable 
                      style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        if (project.status !== 'Paused') {
                          toggleProjectStatus(project.id);
                        }
                      }}
                    >
                      <ThemedText style={styles.statusBadgeText}>
                        {project.status}
                      </ThemedText>
                    </Pressable>
                    
                    {project.status !== 'Queue' && project.status !== 'Completed' && (
                      <Pressable 
                        style={[styles.pauseButton, project.status === 'Paused' && styles.resumeButton]}
                        onPress={(e) => {
                          e.stopPropagation();
                          togglePauseProject(project.id);
                        }}
                      >
                        <Ionicons 
                          name={project.status === 'Paused' ? 'play-outline' : 'pause-outline'} 
                          size={16} 
                          color="#FFFFFF" 
                        />
                      </Pressable>
                    )}
                    
                    <Pressable 
                      style={[
                        styles.moreButton, 
                        project.up ? { backgroundColor: '#4CAF50' } : { backgroundColor: '#FF6B6B' }
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleManualUpDown(project.id);
                      }}
                    >
                      <Ionicons 
                        name={project.up ? "arrow-up-outline" : "arrow-down-outline"} 
                        size={16} 
                        color="#FFFFFF" 
                      />
                    </Pressable>
                    
                    <Pressable 
                      style={styles.moreButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        setSelectedProject(project);
                        setIsProjectDetailsModalVisible(true);
                      }}
                    >
                      <Ionicons name="information-circle-outline" size={16} color="#8E8E93" />
                    </Pressable>
                    
                    <Pressable 
                      style={styles.moreButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        Alert.alert(
                          'Project Actions',
                          `Ano ang Gusto mong gawin sa "${project.name}"?`,
                          [
                            { text: 'Isara', style: 'cancel' },
                            { 
                              text: 'Baguhin', 
                              onPress: () => handleEditProject(project)
                            },
                            { 
                              text: 'Burahin', 
                              style: 'destructive',
                              onPress: () => handleDeleteProject(project.id)
                            }
                          ]
                        );
                      }}
                    >
                      <Ionicons name="ellipsis-horizontal" size={16} color="#8E8E93" />
                    </Pressable>
                  </View>
                </View>
                
                {(project.status === 'Pouring' || project.status === 'Pouring2') && project.pouringTime !== undefined && project.pouringTime > 0 && (
                  <View style={styles.progressSection}>
                    <View style={styles.progressBarBg}>
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { 
                            width: `${Math.max(0, Math.min(100, ((10 - project.pouringTime) / 10) * 100))}%`,
                            backgroundColor: '#9B59B6' 
                          }
                        ]} 
                      />
                    </View>
                    <ThemedText style={styles.progressText}>
                      {project.status === 'Pouring' ? 'Pagbuhos ng materyales...' : 'Huling paglalagay...'} ({project.pouringTime}s)
                    </ThemedText>
                  </View>
                )}
                
                {project.status === 'Mixing' && project.remainingTime !== undefined && project.remainingTime > 0 && (
                  <View style={styles.progressSection}>
                    <View style={styles.progressBarBg}>
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { 
                            width: `${Math.max(0, Math.min(100, ((60 - project.remainingTime) / 60) * 100))}%` 
                          }
                        ]} 
                      />
                    </View>
                    <ThemedText style={styles.progressText}>
                      Mixing block {(project.completedBlocks || 0) + 1}... {Math.round(((60 - project.remainingTime) / 60) * 100)}% complete
                    </ThemedText>
                  </View>
                )}
                

                
                {project.status === 'Queue' && (
                  <View style={styles.progressSection}>
                    <View style={styles.queueBadge}>
                      <Ionicons name="hourglass-outline" size={14} color="#FF9900" />
                      <ThemedText style={styles.queueText}>
                        Naghihintay sa pila..
                      </ThemedText>
                    </View>
                  </View>
                )}
                
                {project.status === 'Paused' && (
                  <View style={styles.pausedSection}>
                    <Ionicons name="pause-circle-outline" size={16} color="#8E8E93" />
                    <ThemedText style={styles.pausedText}>
                      Hininto habang {project.pausedStatus} ang phase
                    </ThemedText>
                  </View>
                )}
              </Pressable>
            ))
          )}
        </View>
          </>
        )}

        {/* INVENTORY TAB */}
        {activeTab === 'inventory' && currentUser?.role === 'admin' && (
          <>
            {/* Inventory Sub-Tabs */}
            <View style={styles.subTabContainer}>
              <Pressable
                onPress={() => setInventorySubTab('stock')}
                style={[styles.subTab, inventorySubTab === 'stock' && styles.activeSubTab]}
              >
                <ThemedText style={[styles.subTabText, inventorySubTab === 'stock' && styles.activeSubTabText]}>
                  Stock
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setInventorySubTab('loading')}
                style={[styles.subTab, inventorySubTab === 'loading' && styles.activeSubTab]}
              >
                <ThemedText style={[styles.subTabText, inventorySubTab === 'loading' && styles.activeSubTabText]}>
                  Loading
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setInventorySubTab('backloading')}
                style={[styles.subTab, inventorySubTab === 'backloading' && styles.activeSubTab]}
              >
                <ThemedText style={[styles.subTabText, inventorySubTab === 'backloading' && styles.activeSubTabText]}>
                  Backload
                </ThemedText>
              </Pressable>
            </View>

            {/* STOCK SUB-TAB */}
            {inventorySubTab === 'stock' && (
              <>
                {/* Search and Add Section for Inventory */}
                <View style={styles.actionSection}>
                  <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Maghanap sa inventory..."
                      placeholderTextColor="#8E8E93"
                      value={inventorySearchQuery}
                      onChangeText={setInventorySearchQuery}
                      selectionColor="#007AFF"
                      multiline={false}
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Inventory Stats */}
                <View style={styles.statsContainer}>
                  <View style={styles.statCard}>
                    <ThemedText style={styles.statValue}>
                      {inventory.reduce((sum, item) => sum + item.quantity, 0)}
                    </ThemedText>
                    <ThemedText style={styles.statLabel}>Kabuuhang RHB</ThemedText>
                  </View>
                  <View style={styles.statCard}>
                    <ThemedText style={styles.statValue}>{inventory.length}</ThemedText>
                    <ThemedText style={styles.statLabel}>Mga Ginawa</ThemedText>
                  </View>
                </View>

                {/* Inventory List */}
                <View style={styles.projectsContainer}>
                  <View style={styles.projectsHeader}>
                    <ThemedText style={styles.projectsTitle}>Nagawang RHB</ThemedText>
                    <ThemedText style={styles.projectsCount}>
                      {inventory.filter(item =>
                        item.projectName.toLowerCase().includes(inventorySearchQuery.toLowerCase())
                      ).length} batch{inventory.filter(item =>
                        item.projectName.toLowerCase().includes(inventorySearchQuery.toLowerCase())
                      ).length !== 1 ? 'es' : ''}
                    </ThemedText>
                  </View>

                  {inventory.filter(item =>
                    item.projectName.toLowerCase().includes(inventorySearchQuery.toLowerCase())
                  ).length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="archive-outline" size={48} color="#C7C7CC" style={styles.emptyIcon} />
                      <ThemedText style={styles.emptyText}>
                        {inventorySearchQuery ? 'Walang katulad ang hinahanap mo sa inventory.' : 'Wala pang Inventory, gumawa ng proyekto para makita ang inventory'}
                      </ThemedText>
                    </View>
                  ) : (
                    inventory.filter(item =>
                      item.projectName.toLowerCase().includes(inventorySearchQuery.toLowerCase())
                    ).map((item) => (
                      <View key={item.id} style={styles.inventoryCard}>
                        <View style={styles.inventoryCardContent}>
                          <View style={styles.inventoryInfo}>
                            <ThemedText style={styles.inventoryProjectName}>{item.projectName}</ThemedText>
                            <View style={styles.inventoryMeta}>
                              <View style={styles.metaItem}>
                                <Ionicons name="cube-outline" size={12} color="#8E8E93" />
                                <ThemedText style={styles.metaText}>{item.quantity} RHB</ThemedText>
                              </View>
                              <View style={styles.metaItem}>
                                <Ionicons name="calendar-outline" size={12} color="#8E8E93" />
                                <ThemedText style={styles.metaText}>{item.dateCompleted}</ThemedText>
                              </View>
                            </View>
                          </View>
                          <Pressable
                            onPress={() => {
                              Alert.alert(
                                'Delete Inventory',
                                `Remove ${item.quantity} RHB from "${item.projectName}"?`,
                                [
                                  { text: 'Isara', style: 'cancel' },
                                  {
                                    text: 'Burahin',
                                    style: 'destructive',
                                    onPress: () => deleteInventoryItem(item.id)
                                  }
                                ]
                              );
                            }}
                            style={styles.deleteInventoryButton}
                          >
                            <Ionicons name="trash" size={18} color="#FF3B30" />
                          </Pressable>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </>
            )}

            {/* LOADING SUB-TAB */}
            {inventorySubTab === 'loading' && (
              <>
                <View style={styles.actionSection}>
                  <Pressable
                    onPress={() => setIsLoadingModalVisible(true)}
                    style={styles.addButton}
                  >
                    <Ionicons name="add" size={24} color="#FFFFFF" />
                    <ThemedText style={styles.addButtonText}>Mga Record ng Loading</ThemedText>
                  </Pressable>
                </View>

                <View style={styles.projectsContainer}>
                  <View style={styles.projectsHeader}>
                    <ThemedText style={styles.projectsTitle}>Loading Records</ThemedText>
                    <ThemedText style={styles.projectsCount}>{loadingRecords.length} record{loadingRecords.length !== 1 ? 's' : ''}</ThemedText>
                  </View>

                  {loadingRecords.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="document-text-outline" size={48} color="#C7C7CC" style={styles.emptyIcon} />
                      <ThemedText style={styles.emptyText}>Wala pang loading records.</ThemedText>
                    </View>
                  ) : (
                    loadingRecords.map((record) => (
                      <View key={record.id} style={styles.auditCard}>
                        <View style={styles.auditCardContent}>
                          <View style={styles.auditInfo}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <ThemedText style={styles.auditTitle}>{record.contactName}</ThemedText>
                              <View style={[
                                styles.statusBadge,
                                { backgroundColor: record.status === 'OPEN' ? '#FF9900' : '#00CC66' }
                              ]}>
                                <ThemedText style={styles.statusBadgeText}>{record.status}</ThemedText>
                              </View>
                            </View>
                            <ThemedText style={styles.auditAddress}>{record.address}</ThemedText>
                            <View style={styles.auditMeta}>
                              <View style={styles.metaItem}>
                                <Ionicons name="cube-outline" size={12} color="#8E8E93" />
                                <ThemedText style={styles.metaText}>{record.blocks} RHB</ThemedText>
                              </View>
                              <View style={styles.metaItem}>
                                <Ionicons name="calendar-outline" size={12} color="#8E8E93" />
                                <ThemedText style={styles.metaText}>{record.loadingDate}</ThemedText>
                              </View>
                            </View>
                            {record.notes && <ThemedText style={styles.auditNotes}>Remarks: {record.notes}</ThemedText>}
                          </View>
                          <View style={{ gap: 8 }}>
                            <Pressable
                              onPress={() => toggleLoadingStatus(record.id, record.status)}
                              style={[
                                styles.deleteButton,
                                { backgroundColor: record.status === 'OPEN' ? '#E3F2FD' : '#F0FFF4' }
                              ]}
                            >
                              <Ionicons 
                                name={record.status === 'OPEN' ? 'checkmark-done-outline' : 'lock-open-outline'} 
                                size={18} 
                                color={record.status === 'OPEN' ? '#007AFF' : '#00CC66'} 
                              />
                            </Pressable>
                            <Pressable
                              onPress={() => {
                                Alert.alert(
                                  'Burahin ang Loading Record',
                                  'Sigurado ka bang buburahin ang Record?',
                                  [
                                    { text: 'Isara', style: 'cancel' },
                                    {
                                      text: 'Burahin',
                                      style: 'destructive',
                                      onPress: () => deleteLoadingRecord(record.id)
                                    }
                                  ]
                                );
                              }}
                              style={styles.deleteButton}
                            >
                              <Ionicons name="trash" size={18} color="#FF3B30" />
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </>
            )}

            {/* BACKLOADING SUB-TAB */}
            {inventorySubTab === 'backloading' && (
              <>
                <View style={styles.actionSection}>
                  <Pressable
                    onPress={() => setIsBackloadingModalVisible(true)}
                    style={styles.addButton}
                  >
                    <Ionicons name="add" size={24} color="#FFFFFF" />
                    <ThemedText style={styles.addButtonText}>Record Backloading</ThemedText>
                  </Pressable>
                </View>

                <View style={styles.projectsContainer}>
                  <View style={styles.projectsHeader}>
                    <ThemedText style={styles.projectsTitle}>Backloading Records</ThemedText>
                    <ThemedText style={styles.projectsCount}>{backloadingRecords.length} record{backloadingRecords.length !== 1 ? 's' : ''}</ThemedText>
                  </View>

                  {backloadingRecords.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="document-text-outline" size={48} color="#C7C7CC" style={styles.emptyIcon} />
                      <ThemedText style={styles.emptyText}>No backloading records yet.</ThemedText>
                    </View>
                  ) : (
                    backloadingRecords.map((record) => (
                      <View key={record.id} style={styles.auditCard}>
                        <View style={styles.auditCardContent}>
                          <View style={styles.auditInfo}>
                            <ThemedText style={styles.auditTitle}>{record.contactName}</ThemedText>
                            <ThemedText style={styles.auditAddress}>{record.address}</ThemedText>
                            <View style={styles.auditMeta}>
                              <View style={styles.metaItem}>
                                <Ionicons name="cube-outline" size={12} color="#8E8E93" />
                                <ThemedText style={styles.metaText}>{record.blocks} RHB</ThemedText>
                              </View>
                              <View style={styles.metaItem}>
                                <Ionicons name="calendar-outline" size={12} color="#8E8E93" />
                                <ThemedText style={styles.metaText}>{record.backloadingDate}</ThemedText>
                              </View>
                            </View>
                            {record.notes && <ThemedText style={styles.auditNotes}>Notes: {record.notes}</ThemedText>}
                          </View>
                          <Pressable
                            onPress={() => {
                              Alert.alert(
                                'Burahin ang Backloading Record',
                                'Sigurado ka bang buburahin ang Backloading Record?',
                                [
                                  { text: 'Isara', style: 'cancel' },
                                  {
                                    text: 'Burahin',
                                    style: 'destructive',
                                    onPress: () => deleteBackloadingRecord(record.id)
                                  }
                                ]
                              );
                            }}
                            style={styles.deleteButton}
                          >
                            <Ionicons name="trash" size={18} color="#FF3B30" />
                          </Pressable>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </>
            )}
          </>
        )}

        {/* Add/Edit Project Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>
                  {editingProject ? 'Edit Project' : 'Add Project'}
                </ThemedText>
                <Pressable 
                  onPress={() => setIsModalVisible(false)}
                  style={{
                    backgroundColor: '#F2F2F7',
                    borderRadius: 20,
                    padding: 8,
                  }}
                >
                  <Ionicons name="close" size={20} color="#8E8E93" />
                </Pressable>
              </View>
              
              <View style={styles.modalBody}>
                <View style={styles.inputSection}>
                  <ThemedText style={styles.inputLabel}>Pangalan ng Proyekto:</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    value={projectName}
                    onChangeText={setProjectName}
                    placeholder="Ilagay ang pangalan ng proyekto"
                    placeholderTextColor="#8E8E93"
                    selectionColor="#007AFF"
                    autoCorrect={false}
                    multiline={false}
                    returnKeyType="done"
                    blurOnSubmit={true}
                  />
                </View>

                <View style={styles.inputSection}>
                  <ThemedText style={styles.inputLabel}>Ilan ang RHB na gusto mong gawin?</ThemedText>
                  <TextInput
                    style={styles.largeTextInput}
                    value={blocks}
                    onChangeText={handleBlocksChange}
                    placeholder="0"
                    placeholderTextColor="#8E8E93"
                    keyboardType="numeric"
                    selectionColor="#007AFF"
                    autoCorrect={false}
                    multiline={false}
                    returnKeyType="done"
                    blurOnSubmit={true}
                  />
                </View>

                <View style={styles.inputSection}>
                  <ThemedText style={styles.inputLabel}>Estimated na oras para matapos (Auto-calculated):</ThemedText>
                  <TextInput
                    style={[styles.largeTextInput, styles.readOnlyInput]}
                    value={estimatedTime}
                    placeholder="00:00:00"
                    placeholderTextColor="#C7C7CC"
                    editable={false}
                    selectTextOnFocus={false}
                  />
                </View>

                {/* Collaborators Section */}
                {currentUserCompany && (
                  <View style={styles.inputSection}>
                    <ThemedText style={styles.inputLabel}>Mag-add ng employee</ThemedText>
                    <Pressable
                      style={styles.collaboratorDropdown}
                      onPress={() => setShowCollaboratorDropdown(!showCollaboratorDropdown)}
                    >
                      <ThemedText style={styles.collaboratorDropdownText}>
                        {selectedCollaborators.length === 0 
                          ? '+ Select team members' 
                          : `${selectedCollaborators.length} member${selectedCollaborators.length !== 1 ? 's' : ''} selected`}
                      </ThemedText>
                      <Ionicons 
                        name={showCollaboratorDropdown ? 'chevron-up' : 'chevron-down'} 
                        size={20} 
                        color="#007AFF" 
                      />
                    </Pressable>

                    {showCollaboratorDropdown && (
                      <View style={styles.collaboratorDropdownMenu}>
                        {isLoadingUsers ? (
                          <ActivityIndicator size="small" color="#007AFF" style={{ padding: 16 }} />
                        ) : companyUsers.length === 0 ? (
                          <ThemedText style={styles.noCollaboratorsText}>Walang ibang employee</ThemedText>
                        ) : (
                          <ScrollView style={styles.collaboratorsList} scrollEnabled={true}>
                            {companyUsers.map((user) => (
                              <Pressable
                                key={user.userId}
                                style={[
                                  styles.collaboratorItem,
                                  selectedCollaborators.includes(user.userId) && styles.collaboratorItemSelected
                                ]}
                                onPress={() => {
                                  setSelectedCollaborators(prev =>
                                    prev.includes(user.userId)
                                      ? prev.filter(id => id !== user.userId)
                                      : [...prev, user.userId]
                                  );
                                }}
                              >
                                <View style={styles.collaboratorCheckbox}>
                                  {selectedCollaborators.includes(user.userId) && (
                                    <Ionicons name="checkmark" size={16} color="#007AFF" />
                                  )}
                                </View>
                                <View style={styles.collaboratorInfo}>
                                  <ThemedText style={styles.collaboratorName}>{user.fullName}</ThemedText>
                                  <ThemedText style={styles.collaboratorEmail}>{user.email}</ThemedText>
                                </View>
                              </Pressable>
                            ))}
                          </ScrollView>
                        )}
                      </View>
                    )}

                    {selectedCollaborators.length > 0 && (
                      <View style={styles.selectedCollaboratorsList}>
                        {selectedCollaborators.map((userId) => {
                          const user = companyUsers.find(u => u.userId === userId);
                          return user ? (
                            <View key={userId} style={styles.selectedCollaboratorTag}>
                              <ThemedText style={styles.selectedCollaboratorText}>{user.fullName}</ThemedText>
                              <Pressable
                                onPress={() => {
                                  setSelectedCollaborators(prev => prev.filter(id => id !== userId));
                                }}
                              >
                                <Ionicons name="close-circle" size={18} color="#FF3B30" />
                              </Pressable>
                            </View>
                          ) : null;
                        })}
                      </View>
                    )}
                  </View>
                )}

                <Pressable 
                  style={styles.addProjectButton} 
                  onPress={handleSaveProject}
                >
                  <ThemedText style={styles.addProjectButtonText}>
                    {editingProject ? 'Update Project' : 'Add Project'}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Raw Materials Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isRawMaterialsModalVisible}
          onRequestClose={() => setIsRawMaterialsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.rawMaterialsModalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Raw Materials Status</ThemedText>
                <Pressable 
                  onPress={() => setIsRawMaterialsModalVisible(false)}
                  style={{
                    backgroundColor: '#F2F2F7',
                    borderRadius: 20,
                    padding: 8,
                  }}
                >
                  <Ionicons name="close" size={20} color="#8E8E93" />
                </Pressable>
              </View>
              
              <View style={styles.rawMaterialsBody}>
                <View style={styles.materialRowLarge}>
                  <View style={styles.materialHeaderRow}>
                    <View style={styles.materialIconContainer}>
                      <Ionicons name="leaf-outline" size={24} color={getMaterialColor(materialLevels.rha)} />
                    </View>
                    <View style={styles.materialInfo}>
                      <ThemedText style={styles.materialLabelLarge}>RHA</ThemedText>
                      <ThemedText style={[styles.materialPercentage, { color: getMaterialColor(materialLevels.rha) }]}>
                        {materialLevels.rha}%
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.progressBarContainerLarge}>
                    <View style={[styles.progressBarLarge, { width: `${materialLevels.rha}%`, backgroundColor: getMaterialColor(materialLevels.rha) }]} />
                  </View>
                </View>
                
                <View style={styles.materialRowLarge}>
                  <View style={styles.materialHeaderRow}>
                    <View style={styles.materialIconContainer}>
                      <Ionicons name="fitness-outline" size={24} color={getMaterialColor(materialLevels.sand)} />
                    </View>
                    <View style={styles.materialInfo}>
                      <ThemedText style={styles.materialLabelLarge}>Buhangin</ThemedText>
                      <ThemedText style={[styles.materialPercentage, { color: getMaterialColor(materialLevels.sand) }]}>
                        {materialLevels.sand}%
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.progressBarContainerLarge}>
                    <View style={[styles.progressBarLarge, { width: `${materialLevels.sand}%`, backgroundColor: getMaterialColor(materialLevels.sand) }]} />
                  </View>
                </View>
                
                <View style={styles.materialRowLarge}>
                  <View style={styles.materialHeaderRow}>
                    <View style={styles.materialIconContainer}>
                      <Ionicons name="cube-outline" size={24} color={getMaterialColor(materialLevels.cement)} />
                    </View>
                    <View style={styles.materialInfo}>
                      <ThemedText style={styles.materialLabelLarge}>Semento</ThemedText>
                      <ThemedText style={[styles.materialPercentage, { color: getMaterialColor(materialLevels.cement) }]}>
                        {materialLevels.cement}%
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.progressBarContainerLarge}>
                    <View style={[styles.progressBarLarge, { width: `${materialLevels.cement}%`, backgroundColor: getMaterialColor(materialLevels.cement) }]} />
                  </View>
                </View>
                
                <View style={styles.materialRowLarge}>
                  <View style={styles.materialHeaderRow}>
                    <View style={styles.materialIconContainer}>
                      <Ionicons name="water-outline" size={24} color={getMaterialColor(materialLevels.water)} />
                    </View>
                    <View style={styles.materialInfo}>
                      <ThemedText style={styles.materialLabelLarge}>Tubig</ThemedText>
                      <ThemedText style={[styles.materialPercentage, { color: getMaterialColor(materialLevels.water) }]}>
                        {materialLevels.water}%
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.progressBarContainerLarge}>
                    <View style={[styles.progressBarLarge, { width: `${materialLevels.water}%`, backgroundColor: getMaterialColor(materialLevels.water) }]} />
                  </View>
                </View>

                {/* Toggle Button */}
                <Pressable 
                  style={[
                    styles.toggleButton,
                    areMaterialsLow() ? styles.restoreButton : styles.setLowButton
                  ]}
                  onPress={handleToggleMaterialLevels}
                >
                  <Ionicons 
                    name={areMaterialsLow() ? "checkmark-circle-outline" : "warning-outline"} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                  <ThemedText style={styles.toggleButtonText}>
                    {areMaterialsLow() ? 'Restore to Normal Levels' : 'Set All Materials to Low'}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Project Details Modal */}
        <ProjectDetailsModal
          visible={isProjectDetailsModalVisible}
          project={selectedProject}
          onClose={() => {
            setIsProjectDetailsModalVisible(false);
            setSelectedProject(null);
          }}
        />

        {/* Loading Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isLoadingModalVisible}
          onRequestClose={() => setIsLoadingModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Record Loading (Out)</ThemedText>
                <Pressable 
                  onPress={() => setIsLoadingModalVisible(false)}
                  style={{
                    backgroundColor: '#F2F2F7',
                    borderRadius: 20,
                    padding: 8,
                  }}
                >
                  <Ionicons name="close" size={20} color="#8E8E93" />
                </Pressable>
              </View>
              
              <View style={styles.modalBody}>
                <View style={styles.inputSection}>
                  <ThemedText style={styles.inputLabel}>Mamili ng Proyekto:</ThemedText>
                  <Pressable
                    style={styles.collaboratorDropdown}
                    onPress={() => setShowLoadingInventoryDropdown(!showLoadingInventoryDropdown)}
                  >
                    <ThemedText style={styles.collaboratorDropdownText}>
                      {selectedLoadingInventoryId 
                        ? inventory.find(item => item.id === selectedLoadingInventoryId)?.projectName 
                        : 'Choose inventory batch'}
                    </ThemedText>
                    <Ionicons name={showLoadingInventoryDropdown ? "chevron-up" : "chevron-down"} size={20} color="#007AFF" />
                  </Pressable>
                  {showLoadingInventoryDropdown && (
                    <View style={styles.collaboratorDropdownMenu}>
                      <ScrollView style={styles.collaboratorsList}>
                        {inventory.length === 0 ? (
                          <ThemedText style={styles.noCollaboratorsText}>Walang available na proyekto</ThemedText>
                        ) : (
                          inventory.map((item) => (
                            <Pressable
                              key={item.id}
                              style={[
                                styles.collaboratorItem,
                                selectedLoadingInventoryId === item.id && styles.collaboratorItemSelected
                              ]}
                              onPress={() => {
                                setSelectedLoadingInventoryId(item.id);
                                setShowLoadingInventoryDropdown(false);
                              }}
                            >
                              <View style={[styles.collaboratorCheckbox, selectedLoadingInventoryId === item.id && { backgroundColor: '#007AFF' }]}>
                                {selectedLoadingInventoryId === item.id && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                              </View>
                              <View style={styles.collaboratorInfo}>
                                <ThemedText style={styles.collaboratorName}>{item.projectName}</ThemedText>
                                <ThemedText style={styles.collaboratorEmail}>{item.quantity} RHB Available</ThemedText>
                              </View>
                            </Pressable>
                          ))
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <View style={styles.inputSection}>
                  <ThemedText style={styles.inputLabel}>Pangalan ng Customer:</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    value={loadingContactName}
                    onChangeText={setLoadingContactName}
                    placeholder="Ilagay ang pangalan ng customer"
                    placeholderTextColor="#8E8E93"
                    selectionColor="#007AFF"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputSection}>
                  <ThemedText style={styles.inputLabel}>Address/Location:</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    value={loadingAddress}
                    onChangeText={setLoadingAddress}
                    placeholder="Ilagay ang delivery address"
                    placeholderTextColor="#8E8E93"
                    selectionColor="#007AFF"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputSection}>
                  <ThemedText style={styles.inputLabel}>Bilang ng RHB:</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    value={loadingBlocks}
                    onChangeText={setLoadingBlocks}
                    placeholder="Enter number of blocks"
                    placeholderTextColor="#8E8E93"
                    selectionColor="#007AFF"
                    keyboardType="numeric"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputSection}>
                  <ThemedText style={styles.inputLabel}>Notes (Optional):</ThemedText>
                  <TextInput
                    style={[styles.textInput, { height: 80 }]}
                    value={loadingNotes}
                    onChangeText={setLoadingNotes}
                    placeholder="Mag-lagay ng notes"
                    placeholderTextColor="#8E8E93"
                    selectionColor="#007AFF"
                    multiline={true}
                    autoCorrect={false}
                  />
                </View>

                <Pressable
                  style={styles.addProjectButton}
                  onPress={addLoadingRecord}
                >
                  <ThemedText style={styles.addProjectButtonText}>Record Loading</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Backloading Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isBackloadingModalVisible}
          onRequestClose={() => setIsBackloadingModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Record Backloading (Return)</ThemedText>
                <Pressable 
                  onPress={() => setIsBackloadingModalVisible(false)}
                  style={{
                    backgroundColor: '#F2F2F7',
                    borderRadius: 20,
                    padding: 8,
                  }}
                >
                  <Ionicons name="close" size={20} color="#8E8E93" />
                </Pressable>
              </View>
              
              <View style={styles.modalBody}>
                <View style={styles.inputSection}>
                  <ThemedText style={styles.inputLabel}>Mag-select Loading Record (CLOSED):</ThemedText>
                  <Pressable
                    style={styles.collaboratorDropdown}
                    onPress={() => setShowBackloadingInventoryDropdown(!showBackloadingInventoryDropdown)}
                  >
                    <ThemedText style={styles.collaboratorDropdownText}>
                      {selectedBackloadingInventoryId 
                        ? (() => {
                            const record = loadingRecords.find(r => r.id === selectedBackloadingInventoryId);
                            return record ? `${record.contactName} (${record.blocks} blocks)` : 'Mag-select loading record';
                          })()
                        : 'Mamili ng Saradong loading record'}
                    </ThemedText>
                    <Ionicons name={showBackloadingInventoryDropdown ? "chevron-up" : "chevron-down"} size={20} color="#007AFF" />
                  </Pressable>
                  {showBackloadingInventoryDropdown && (
                    <View style={styles.collaboratorDropdownMenu}>
                      <ScrollView style={styles.collaboratorsList}>
                        {loadingRecords.filter(r => r.status === 'CLOSED').length === 0 ? (
                          <ThemedText style={styles.noCollaboratorsText}>No closed loading records available</ThemedText>
                        ) : (
                          loadingRecords.filter(r => r.status === 'CLOSED').map((record) => (
                            <Pressable
                              key={record.id}
                              style={[
                                styles.collaboratorItem,
                                selectedBackloadingInventoryId === record.id && styles.collaboratorItemSelected
                              ]}
                              onPress={() => {
                                setSelectedBackloadingInventoryId(record.id);
                                setShowBackloadingInventoryDropdown(false);
                              }}
                            >
                              <View style={[styles.collaboratorCheckbox, selectedBackloadingInventoryId === record.id && { backgroundColor: '#007AFF' }]}>
                                {selectedBackloadingInventoryId === record.id && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                              </View>
                              <View style={styles.collaboratorInfo}>
                                <ThemedText style={styles.collaboratorName}>{record.contactName}</ThemedText>
                                <ThemedText style={styles.collaboratorEmail}>{record.blocks} RHB - {record.loadingDate}</ThemedText>
                              </View>
                            </Pressable>
                          ))
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <View style={styles.inputSection}>
                  <ThemedText style={styles.inputLabel}>Pangalan ng Customer:</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    value={backloadingContactName}
                    onChangeText={setBackloadingContactName}
                    placeholder="Ilagay ang pangalan ng customer"
                    placeholderTextColor="#8E8E93"
                    selectionColor="#007AFF"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputSection}>
                  <ThemedText style={styles.inputLabel}>Address/Location:</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    value={backloadingAddress}
                    onChangeText={setBackloadingAddress}
                    placeholder="Enter pickup address"
                    placeholderTextColor="#8E8E93"
                    selectionColor="#007AFF"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputSection}>
                  <ThemedText style={styles.inputLabel}>Bilang ng RHB:</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    value={backloadingBlocks}
                    onChangeText={setBackloadingBlocks}
                    placeholder="Ilan ang ibabalik na RHB"
                    placeholderTextColor="#8E8E93"
                    selectionColor="#007AFF"
                    keyboardType="numeric"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputSection}>
                  <ThemedText style={styles.inputLabel}>Notes (Optional):</ThemedText>
                  <TextInput
                    style={[styles.textInput, { height: 80 }]}
                    value={backloadingNotes}
                    onChangeText={setBackloadingNotes}
                    placeholder="Mag lagay ng additional notes"
                    placeholderTextColor="#8E8E93"
                    selectionColor="#007AFF"
                    multiline={true}
                    autoCorrect={false}
                  />
                </View>

                <Pressable
                  style={styles.addProjectButton}
                  onPress={addBackloadingRecord}
                >
                  <ThemedText style={styles.addProjectButtonText}>Record Backloading</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#F2F2F7',
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    cursor: 'pointer',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  materialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  materialLabel: {
    fontSize: 14,
    color: '#1C1C1E',
    width: 70,
    fontWeight: '500',
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    marginLeft: 16,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flex: 1,
    marginRight: 12,
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    color: '#7F8C8D',
    fontSize: 14,
  },
  searchInput: {
    color: '#1C1C1E',
    fontSize: 17,
    flex: 1,
    fontWeight: '400',
    minHeight: 20,
    paddingVertical: 0,
    paddingHorizontal: 0,
    margin: 0,
    backgroundColor: 'transparent',
  },
  addButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
    height: 44,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  projectsContainer: {
    marginBottom: 20,
  },
  projectsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  projectsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  projectsCount: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  projectCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  projectInfo: {
    flex: 1,
    marginRight: 12,
  },
  projectName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  projectMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  projectActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  moreButton: {
    padding: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 6,
  },
  pauseButton: {
    padding: 6,
    backgroundColor: '#FF9500',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resumeButton: {
    backgroundColor: '#00CC66',
  },
  progressSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  queueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  queueText: {
    fontSize: 12,
    color: '#FF9900',
    fontWeight: '500',
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  modalBody: {
    paddingVertical: 0,
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: '#34495E',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 5,
    minHeight: 48,
    justifyContent: 'center',
  },
  inputValue: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  largeInputContainer: {
    backgroundColor: '#34495E',
    borderRadius: 15,
    paddingHorizontal: 5,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  largeInputValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  addProjectButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addProjectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  textInput: {
    color: '#1C1C1E',
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '400',
    backgroundColor: '#F2F2F7',
    width: '100%',
    height: 42,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 0,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
  },
  largeTextInput: {
    color: '#1C1C1E',
    fontSize: 28,
    fontFamily: 'System',
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#F2F2F7',
    width: '100%',
    height: 70,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginVertical: 0,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
  },
  readOnlyInput: {
    backgroundColor: '#F8F9FA',
    borderColor: '#E5E5EA',
    opacity: 0.7,
  },
  rawMaterialsModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    width: '100%',
    maxWidth: 450,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
  },
  rawMaterialsBody: {
    paddingVertical: 4,
  },
  materialRowLarge: {
    marginBottom: 18,
  },
  materialHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  materialIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  materialInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  materialLabelLarge: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  materialPercentage: {
    fontSize: 20,
    fontWeight: '700',
  },
  progressBarContainerLarge: {
    height: 12,
    backgroundColor: '#E5E5EA',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarLarge: {
    height: '100%',
    borderRadius: 6,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 6,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 6,
  },
  setLowButton: {
    backgroundColor: '#FF3333',
    shadowColor: '#FF3333',
  },
  restoreButton: {
    backgroundColor: '#00CC66',
    shadowColor: '#00CC66',
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  pausedSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pausedText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  // Collaborators styles
  collaboratorDropdown: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  collaboratorDropdownText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    flex: 1,
  },
  collaboratorDropdownMenu: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    maxHeight: 250,
    overflow: 'hidden',
  },
  collaboratorsList: {
    maxHeight: 250,
  },
  collaboratorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  collaboratorItemSelected: {
    backgroundColor: '#F0F8FF',
  },
  collaboratorCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  collaboratorInfo: {
    flex: 1,
  },
  collaboratorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  collaboratorEmail: {
    fontSize: 11,
    color: '#8E8E93',
  },
  selectedCollaboratorsList: {
    marginTop: 8,
    gap: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectedCollaboratorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  selectedCollaboratorText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
  },
  noCollaboratorsText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 16,
  },
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  // Inventory Styles
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  inventoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  inventoryCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inventoryInfo: {
    flex: 1,
    marginRight: 12,
  },
  inventoryProjectName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  inventoryMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  deleteInventoryButton: {
    padding: 8,
    backgroundColor: '#fff0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subTabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingBottom: 0,
  },
  subTab: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    backgroundColor: 'transparent',
  },
  activeSubTab: {
    backgroundColor: 'transparent',
    borderBottomColor: '#007AFF',
  },
  subTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  activeSubTabText: {
    color: '#007AFF',
  },
  auditCard: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  auditCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
  },
  auditInfo: {
    flex: 1,
    marginRight: 12,
  },
  auditTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  auditAddress: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 8,
  },
  auditMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  auditNotes: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
    marginTop: 4,
  },
    headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
    paddingVertical: 8,
  },

  deleteButton: {
    padding: 8,
    backgroundColor: '#fff0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

});
