// Model3DViewer removed - expo-three was causing Firebase Image.getSize conflicts
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { auth, db } from '@/config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { addDoc, collection, doc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

interface Project {
  id: string;
  name: string;
  blocks: number;
  estimatedTime: string;
  remainingTime?: number; // in seconds, for mixing countdown timer (60s per block)
  pouringTime?: number; // in seconds, for pouring countdown (10 seconds)
  dispenseTime?: number; // in seconds, for molding countdown (20 seconds)
  completedBlocks?: number; // Number of blocks completed so far
  date: string;
  status: 'Queue' | 'Pouring' | 'Mixing' | 'Pouring2' | 'Molding' | 'Completed';
  pouringActive?: boolean; // Active during Pouring and Pouring2 phases
}

interface SensorData {
  distance_cm: number;
  distance_percent: number;
  max_distance: number;
}

interface RawMaterialsData {
  rha: number;      // sensor_1
  cement: number;   // sensor_2
  sand: number;     // sensor_3
  water: number;    // sensor_4
}

export default function DashboardScreen() {
  const [isTempModalVisible, setIsTempModalVisible] = useState(false);
  const [isRawMaterialsModalVisible, setIsRawMaterialsModalVisible] = useState(false);
  const [isRHBModalVisible, setIsRHBModalVisible] = useState(false);
  // 3D Model viewer removed - expo-three was causing Firebase conflicts
  const [chatInput, setChatInput] = useState('');
  const [totalRHBToday, setTotalRHBToday] = useState(0);
  const [totalRHBWeek, setTotalRHBWeek] = useState(0);
  const [totalRHBMonth, setTotalRHBMonth] = useState(0);

  // Raw Materials sensor data state
  const [rawMaterials, setRawMaterials] = useState<RawMaterialsData>({
    rha: 0,
    cement: 0,
    sand: 0,
    water: 0,
  });
  const [isLoadingSensors, setIsLoadingSensors] = useState(true);

  // Helper function to determine color based on percentage
  const getColorForPercentage = (percent: number): string => {
    if (percent >= 70) return '#34C759'; // Green - Good
    if (percent >= 40) return '#FF9500'; // Orange - Medium
    return '#FF3B30'; // Red - Low
  };

  // Manual Project Modal state
  const [isManualProjectModalVisible, setIsManualProjectModalVisible] = useState(false);
  const [manualProjectName, setManualProjectName] = useState('');
  const [manualProjectBlocks, setManualProjectBlocks] = useState('');
  const [manualProjectTime, setManualProjectTime] = useState('00:00:00');
  const [isCreatingManualProject, setIsCreatingManualProject] = useState(false);

  // Active Manual Project Timer
  const [activeManualProject, setActiveManualProject] = useState<any>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const timerRef = useRef<any>(null);

  // Date filter states for RHB modal
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filteredRHBData, setFilteredRHBData] = useState(0);
  const [isDateFilterActive, setIsDateFilterActive] = useState(false);

  // Load projects data and calculate RHB totals
  const loadRHBData = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Query completed projects from Firebase
      const q = query(
        collection(db, 'projects'),
        where('userId', '==', user.uid),
        where('status', '==', 'Completed')
      );
      
      const querySnapshot = await getDocs(q);
      const projects: any[] = [];
      querySnapshot.forEach((doc) => {
        projects.push({ id: doc.id, ...doc.data() });
      });

      // Also get completed manual projects
      const manualQ = query(
        collection(db, 'manual_projects'),
        where('userId', '==', user.uid),
        where('status', '==', 'Completed')
      );
      
      const manualSnapshot = await getDocs(manualQ);
      manualSnapshot.forEach((doc) => {
        projects.push({ id: doc.id, ...doc.data() });
      });
      
      const today = new Date();
      const todayStr = today.toLocaleDateString('en-GB');
      
      // Calculate week start (Monday)
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
      weekStart.setHours(0, 0, 0, 0);
      
      // Calculate month start
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      monthStart.setHours(0, 0, 0, 0);
      
      let todayBlocks = 0;
      let weekBlocks = 0;
      let monthBlocks = 0;
      
      projects.forEach(project => {
        const projectDate = new Date(project.date.split('/').reverse().join('-'));
        
        // Today's blocks
        if (project.date === todayStr) {
          todayBlocks += project.blocks;
        }
        
        // This week's blocks
        if (projectDate >= weekStart) {
          weekBlocks += project.blocks;
        }
        
        // This month's blocks
        if (projectDate >= monthStart) {
          monthBlocks += project.blocks;
        }
      });
      
      setTotalRHBToday(todayBlocks);
      setTotalRHBWeek(weekBlocks);
      setTotalRHBMonth(monthBlocks);
    } catch (error) {
      console.error('Error loading RHB data:', error);
    }
  }, []);

  // Filter RHB data by date range
  const filterRHBDataByDate = useCallback(async (from: string, to: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Query completed projects from Firebase
      const q = query(
        collection(db, 'projects'),
        where('userId', '==', user.uid),
        where('status', '==', 'Completed')
      );
      
      const querySnapshot = await getDocs(q);
      const projects: any[] = [];
      querySnapshot.forEach((doc) => {
        projects.push({ id: doc.id, ...doc.data() });
      });

      // Also get completed manual projects
      const manualQ = query(
        collection(db, 'manual_projects'),
        where('userId', '==', user.uid),
        where('status', '==', 'Completed')
      );
      
      const manualSnapshot = await getDocs(manualQ);
      manualSnapshot.forEach((doc) => {
        projects.push({ id: doc.id, ...doc.data() });
      });
      
      const fromDate = new Date(from.split('/').reverse().join('-'));
      const toDate = new Date(to.split('/').reverse().join('-'));
      
      // Set time to start and end of day for proper comparison
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(23, 59, 59, 999);
      
      let filteredBlocks = 0;
      
      projects.forEach(project => {
        const projectDate = new Date(project.date.split('/').reverse().join('-'));
        
        if (projectDate >= fromDate && projectDate <= toDate) {
          filteredBlocks += project.blocks;
        }
      });
      
      setFilteredRHBData(filteredBlocks);
      setIsDateFilterActive(true);
    } catch (error) {
      console.error('Error filtering RHB data:', error);
      Alert.alert('Error', 'Failed to filter data. Please check your date format.');
    }
  }, []);

  // Reset date filter
  const resetDateFilter = () => {
    setFromDate('');
    setToDate('');
    setFilteredRHBData(0);
    setIsDateFilterActive(false);
  };

  // Format date input (auto-add slashes)
  const formatDateInput = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // Add slashes automatically
    if (cleaned.length >= 5) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    } else if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    } else {
      return cleaned;
    }
  };

  // Handle from date change
  const handleFromDateChange = (text: string) => {
    const formatted = formatDateInput(text);
    setFromDate(formatted);
  };

  // Handle to date change
  const handleToDateChange = (text: string) => {
    const formatted = formatDateInput(text);
    setToDate(formatted);
  };

  // Function to calculate estimated time based on blocks
  // Per block: 10s Pouring + 60s Mixing + 10s Pouring2 + 20s Molding = 100 seconds per block
  const calculateEstimatedTime = (numberOfBlocks: number): string => {
    const secondsPerBlock = 100; // 10 + 60 + 10 + 20
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

  // Handle blocks input change
  const handleManualBlocksChange = (value: string) => {
    setManualProjectBlocks(value);
    // Auto-calculate time based on blocks
    const numberOfBlocks = parseInt(value);
    if (!isNaN(numberOfBlocks) && numberOfBlocks > 0) {
      const calculatedTime = calculateEstimatedTime(numberOfBlocks);
      setManualProjectTime(calculatedTime);
    } else if (value === '' || numberOfBlocks === 0) {
      setManualProjectTime('00:00:00');
    }
  };

  // Handle date filter application
  const applyDateFilter = () => {
    if (!fromDate || !toDate) {
      Alert.alert('Error', 'Please select both From and To dates');
      return;
    }
    
    // Validate date format (DD/MM/YYYY)
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!dateRegex.test(fromDate) || !dateRegex.test(toDate)) {
      Alert.alert('Error', 'Gamitin ang DD/MM/YYYY format para sa dates');
      return;
    }

    // Validate that from date is not after to date
    const fromDateObj = new Date(fromDate.split('/').reverse().join('-'));
    const toDateObj = new Date(toDate.split('/').reverse().join('-'));
    
    if (fromDateObj > toDateObj) {
      Alert.alert('Error', 'From date cannot be after To date');
      return;
    }
    
    filterRHBDataByDate(fromDate, toDate);
  };

  // Handle Start Process button click - Open manual project modal
  const handleStartProcess = () => {
    // Reset form
    setManualProjectName('');
    setManualProjectBlocks('');
    setManualProjectTime('00:00:00');
    setIsManualProjectModalVisible(true);
  };

  // Handle Manual Project Creation
  const handleCreateManualProject = async () => {
    if (!manualProjectName.trim() || !manualProjectBlocks.trim() || !manualProjectTime.trim()) {
      Alert.alert('Error', 'Lagyan lahat ng fields');
      return;
    }

    const blocks = parseInt(manualProjectBlocks);
    if (isNaN(blocks) || blocks <= 0) {
      Alert.alert('Error', 'Please enter a valid number of blocks');
      return;
    }

    // Check if there's already an active manual project
    if (activeManualProject) {
      Alert.alert(
        'Active Project Running',
        `Mayroon nang active na project "${activeManualProject.name}" on-process. Maaaring maghintay munang matapos ito.`
      );
      return;
    }

    setIsCreatingManualProject(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be signed in to create manual projects');
        setIsCreatingManualProject(false);
        return;
      }

      const currentDate = new Date().toLocaleDateString('en-GB');
      const now = new Date();
      const totalSeconds = timeStringToSeconds(manualProjectTime.trim());

      const manualProjectData = {
        name: manualProjectName.trim(),
        blocks: blocks,
        estimatedTime: manualProjectTime.trim(),
        pouringTime: 10, // Start with pouring phase (10 seconds)
        completedBlocks: 0,
        date: currentDate,
        status: 'Pouring',
        userId: user.uid,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        isManual: true,
        timerActive: false, // Will be set to true only during Mixing
        pouringActive: true, // Active during Pouring phase
      };

      await addDoc(collection(db, 'manual_projects'), manualProjectData);

      // Close modal and reset form
      setIsManualProjectModalVisible(false);
      setManualProjectName('');
      setManualProjectBlocks('');
      setManualProjectTime('00:00:00');

      Alert.alert('Success', 'Ang manual project ay nag-sisimula na, Ang timer ay guamgana na.');
    } catch (error: any) {
      console.error('Error creating manual project:', error);
      Alert.alert('Error', `Failed to create manual project: ${error.message}`);
    } finally {
      setIsCreatingManualProject(false);
    }
  };

  //  Reload data when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadRHBData();
    }, [loadRHBData])
  );

  // Listen for active manual project and start timer
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Listen to all non-completed manual projects (not just timerActive ones)
    const q = query(
      collection(db, 'manual_projects'),
      where('userId', '==', user.uid),
      where('status', 'in', ['Pouring', 'Mixing', 'Pouring2', 'Molding'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const projectData = snapshot.docs[0];
        const project: any = { id: projectData.id, ...projectData.data() };
        setActiveManualProject(project);
        
        // Set the appropriate timer based on current status
        if (project.status === 'Pouring' || project.status === 'Pouring2') {
          setRemainingTime(project.pouringTime || 0);
        } else if (project.status === 'Mixing') {
          setRemainingTime(project.remainingTime || 0);
        } else if (project.status === 'Molding') {
          setRemainingTime(project.dispenseTime || 0);
        } else {
          setRemainingTime(0);
        }
      } else {
        setActiveManualProject(null);
        setRemainingTime(0);
      }
    });

    return () => unsubscribe();
  }, []);

  // Countdown timer for active manual project (per-block process)
  useEffect(() => {
    if (activeManualProject && remainingTime > 0) {
      timerRef.current = setInterval(async () => {
        setRemainingTime((prev) => {
          const newTime = prev - 1;
          
          // Update Firebase based on current status
          if (activeManualProject.id) {
            if (activeManualProject.status === 'Pouring' || activeManualProject.status === 'Pouring2') {
              updateDoc(doc(db, 'manual_projects', activeManualProject.id), {
                pouringTime: newTime
              }).catch(err => console.error('Error updating pouring timer:', err));
            } else if (activeManualProject.status === 'Mixing') {
              updateDoc(doc(db, 'manual_projects', activeManualProject.id), {
                remainingTime: newTime
              }).catch(err => console.error('Error updating mixing timer:', err));
            } else if (activeManualProject.status === 'Molding') {
              updateDoc(doc(db, 'manual_projects', activeManualProject.id), {
                dispenseTime: newTime
              }).catch(err => console.error('Error updating molding timer:', err));
            }
          }

          // Timer completed for current phase
          if (newTime <= 0) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            
            // Handle phase transitions
            if (activeManualProject.id) {
              if (activeManualProject.status === 'Pouring') {
                // Move to Mixing (60 seconds per block) - Activate hardware timer
                updateDoc(doc(db, 'manual_projects', activeManualProject.id), {
                  status: 'Mixing',
                  pouringTime: 0,
                  remainingTime: 60,
                  timerActive: true, // Hardware activates during Mixing
                  pouringActive: false // Deactivate pouring
                }).catch(err => console.error('Error moving to Mixing:', err));
              } else if (activeManualProject.status === 'Mixing') {
                // Move to Pouring2 (10 seconds) - Deactivate hardware timer
                updateDoc(doc(db, 'manual_projects', activeManualProject.id), {
                  status: 'Pouring2',
                  remainingTime: 0,
                  pouringTime: 10,
                  timerActive: false, // Hardware deactivates after Mixing
                  pouringActive: true // Activate pouring for second pour
                }).catch(err => console.error('Error moving to Pouring2:', err));
              } else if (activeManualProject.status === 'Pouring2') {
                // Move to Molding (20 seconds)
                updateDoc(doc(db, 'manual_projects', activeManualProject.id), {
                  status: 'Molding',
                  pouringTime: 0,
                  dispenseTime: 20,
                  pouringActive: false // Deactivate pouring
                }).catch(err => console.error('Error moving to Molding:', err));
              } else if (activeManualProject.status === 'Molding') {
                // Check if all blocks are completed
                const completedBlocks = (activeManualProject.completedBlocks || 0) + 1;
                
                if (completedBlocks >= activeManualProject.blocks) {
                  // All blocks completed
                  updateDoc(doc(db, 'manual_projects', activeManualProject.id), {
                    timerActive: false,
                    pouringActive: false,
                    status: 'Completed',
                    dispenseTime: 0,
                    completedBlocks: completedBlocks,
                    completedAt: new Date().toISOString()
                  }).then(() => {
                    Alert.alert('Process Complete', `Manual project "${activeManualProject.name}" has finished all ${activeManualProject.blocks} blocks!`);
                  }).catch(err => console.error('Error completing project:', err));
                } else {
                  // More blocks to process - go back to Pouring for next block
                  updateDoc(doc(db, 'manual_projects', activeManualProject.id), {
                    status: 'Pouring',
                    dispenseTime: 0,
                    pouringTime: 10,
                    completedBlocks: completedBlocks,
                    timerActive: false, // Hardware stays inactive during Pouring
                    pouringActive: true // Activate pouring for next block
                  }).then(() => {
                    console.log(`Starting block ${completedBlocks + 1} of ${activeManualProject.blocks}`);
                  }).catch(err => console.error('Error starting next block:', err));
                }
              }
            }
            
            return 0;
          }
          
          return newTime;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [activeManualProject, remainingTime]);
  
  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>RiCement</ThemedText>
      </ThemedView>

      <ThemedView style={styles.content} lightColor='transparent' darkColor='transparent'>
       

        {/* Active Manual Project Timer */}
        {activeManualProject && (
          <View style={styles.activeTimerCard}>
            <View style={styles.timerHeader}>
              <View style={styles.timerTitleContainer}>
                <Ionicons name="time" size={24} color="#FFFFFF" />
                <ThemedText style={styles.timerTitle}>Active: {activeManualProject.name}</ThemedText>
              </View>
              <View style={styles.statusIndicator}>
                <View style={styles.statusDot} />
                <ThemedText style={styles.statusText}>RUNNING</ThemedText>
              </View>
            </View>
            <ThemedText style={styles.timerValue}>{remainingTime}s</ThemedText>
            <View style={styles.timerDetails}>
              <View style={styles.timerDetailItem}>
                <Ionicons name="cube" size={16} color="#B8B5FF" />
                <ThemedText style={styles.timerDetailText}>
                  Block {(activeManualProject.completedBlocks || 0) + 1}/{activeManualProject.blocks}
                </ThemedText>
              </View>
              <View style={styles.timerDetailItem}>
                <Ionicons name="git-commit" size={16} color="#FFD700" />
                <ThemedText style={styles.timerDetailText}>
                  {activeManualProject.status === 'Pouring' ? 'Pouring Materials' :
                   activeManualProject.status === 'Mixing' ? 'Mixing' :
                   activeManualProject.status === 'Pouring2' ? 'Final Pouring' :
                   activeManualProject.status === 'Molding' ? 'Molding Block' : 'Processing'}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Raw Materials Status Card */}
        <Pressable style={styles.rawMaterialsCard} onPress={() => setIsRawMaterialsModalVisible(true)}>
          <View style={styles.cardTitleContainer}>
            <ThemedText style={styles.cardTitle}>Katayuan ng Raw Materials</ThemedText>
            {isLoadingSensors && <ActivityIndicator size="small" color="#007AFF" style={{ marginLeft: 10 }} />}
          </View>
          
          <View style={styles.materialItem}>
            <ThemedText style={styles.materialLabel}>RHA</ThemedText>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${rawMaterials.rha}%`, backgroundColor: getColorForPercentage(rawMaterials.rha) }]} />
            </View>
            <ThemedText style={styles.materialPercent}>{rawMaterials.rha}%</ThemedText>
          </View>
          <View style={styles.materialItem}>
            <ThemedText style={styles.materialLabel}>Semento</ThemedText>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${rawMaterials.cement}%`, backgroundColor: getColorForPercentage(rawMaterials.cement) }]} />
            </View>
            <ThemedText style={styles.materialPercent}>{rawMaterials.cement}%</ThemedText>
          </View>

          <View style={styles.materialItem}>
            <ThemedText style={styles.materialLabel}>Water</ThemedText>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${rawMaterials.water}%`, backgroundColor: getColorForPercentage(rawMaterials.water) }]} />
            </View>
            <ThemedText style={styles.materialPercent}>{rawMaterials.water}%</ThemedText>
          </View>
        </Pressable>
          {/* Action Buttons */}
        <ThemedView style={styles.actionsContainer} lightColor='transparent' darkColor='transparent'>
          <Pressable 
            style={styles.startButton} 
            onPress={handleStartProcess}
          >
            <ThemedText style={styles.startButtonText}>
              MAG-MANUAL PROCESS
            </ThemedText>
          </Pressable>
        </ThemedView>
        {/* Status Rows */}
        <View style={styles.statusContainer}>
          {/* Temperature Display */}
          <Pressable style={styles.statusBox} onPress={() => setIsTempModalVisible(true)}>
            <View style={styles.temperatureBackground}>
              <View style={styles.temperatureWrapper}>
                <View style={styles.temperatureValueRow}>
                  <ThemedText style={styles.temperatureValue}>30</ThemedText>
                  <ThemedText style={styles.temperatureUnit}>°C</ThemedText>
                </View>
                <ThemedText style={styles.temperatureLabel}>Temperatura ng Makina</ThemedText>
              </View>
            </View>
          </Pressable>

          {/* Total RHB Today Display */}
          <Pressable style={styles.statusBox} onPress={() => setIsRHBModalVisible(true)}>
            <View style={styles.rhbBackground}>
              <View style={styles.rhbWrapper}>
                <ThemedText style={styles.rhbValue}>{totalRHBToday}</ThemedText>
                <ThemedText style={styles.rhbLabel}>Total RHB Today</ThemedText>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Machine Status Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isManualProjectModalVisible}
          onRequestClose={() => setIsManualProjectModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Mag-manual Process</ThemedText>
                <Pressable 
                  onPress={() => setIsManualProjectModalVisible(false)}
                  style={{
                    backgroundColor: '#F2F2F7',
                    borderRadius: 20,
                    padding: 8,
                  }}
                >
                  <Ionicons name="close" size={20} color="#8E8E93" />
                </Pressable>
              </View>
              
              <ScrollView style={styles.manualProjectForm}>
                <View style={styles.formGroup}>
                  <ThemedText style={styles.formLabel}>Pangalan ng Proyekto</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter project name"
                    placeholderTextColor="#8E8E93"
                    value={manualProjectName}
                    onChangeText={setManualProjectName}
                    editable={!isCreatingManualProject}
                  />
                </View>

                <View style={styles.formGroup}>
                  <ThemedText style={styles.formLabel}>Dami ng Hollow Blocks</ThemedText>
                  <TextInput
                    style={styles.largeTextInput}
                    placeholder="0"
                    placeholderTextColor="#8E8E93"
                    value={manualProjectBlocks}
                    onChangeText={handleManualBlocksChange}
                    keyboardType="numeric"
                    editable={!isCreatingManualProject}
                  />
                </View>

                <View style={styles.formGroup}>
                  <ThemedText style={styles.formLabel}>Estimated na Oras (Auto-calculated)</ThemedText>
                  <TextInput
                    style={[styles.textInput, styles.readOnlyInput]}
                    placeholder="00:00:00"
                    placeholderTextColor="#8E8E93"
                    value={manualProjectTime}
                    editable={false}
                  />
                </View>

                <Pressable 
                  style={[styles.createProjectButton, isCreatingManualProject && styles.createProjectButtonDisabled]} 
                  onPress={handleCreateManualProject}
                  disabled={isCreatingManualProject}
                >
                  {isCreatingManualProject ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <ThemedText style={styles.createProjectButtonText}>Simulan ang Process</ThemedText>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Raw Materials Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isRawMaterialsModalVisible}
          onRequestClose={() => setIsRawMaterialsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Status ng Raw Materials</ThemedText>
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
              
              <ScrollView style={styles.materialsDetailsContainer}>
                <View style={styles.materialsCard}>
                  <View style={styles.materialDetailItem}>
                    <ThemedText style={styles.materialDetailLabel}>RHA</ThemedText>
                    <View style={styles.materialDetailBar}>
                      <View style={[styles.materialDetailProgress, { width: `${rawMaterials.rha}%`, backgroundColor: getColorForPercentage(rawMaterials.rha) }]} />
                    </View>
                    <ThemedText style={styles.materialDetailPercent}>{rawMaterials.rha}%</ThemedText>
                  </View>

                  <View style={styles.materialDetailItem}>
                    <ThemedText style={styles.materialDetailLabel}>Semento</ThemedText>
                    <View style={styles.materialDetailBar}>
                      <View style={[styles.materialDetailProgress, { width: `${rawMaterials.cement}%`, backgroundColor: getColorForPercentage(rawMaterials.cement) }]} />
                    </View>
                    <ThemedText style={styles.materialDetailPercent}>{rawMaterials.cement}%</ThemedText>
                  </View>

                  <View style={styles.materialDetailItem}>
                    <ThemedText style={styles.materialDetailLabel}>Water</ThemedText>
                    <View style={styles.materialDetailBar}>
                      <View style={[styles.materialDetailProgress, { width: `${rawMaterials.water}%`, backgroundColor: getColorForPercentage(rawMaterials.water) }]} />
                    </View>
                    <ThemedText style={styles.materialDetailPercent}>{rawMaterials.water}%</ThemedText>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Total RHB Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isRHBModalVisible}
          onRequestClose={() => {
            setIsRHBModalVisible(false);
            resetDateFilter();
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.rhbModalContent}>
              <View style={styles.rhbModalHeader}>
                <View style={{ flex: 1 }} />
                <ThemedText style={styles.rhbModalTitle}>RHA Hollow Blocks</ThemedText>
                <Pressable 
                  onPress={() => {
                    setIsRHBModalVisible(false);
                    resetDateFilter();
                  }}
                  style={{ flex: 1, alignItems: 'flex-end' }}
                >
                  <Ionicons name="close" size={24} color="#007AFF" />
                </Pressable>
              </View>
              
              <ScrollView style={styles.rhbDetailsContainer} showsVerticalScrollIndicator={false}>
                {/* Quick Stats Tabs */}
                <View style={styles.rhbQuickStatsContainer}>
                  <Pressable 
                    style={[styles.rhbQuickStatItem, !isDateFilterActive && styles.rhbQuickStatActive]}
                    onPress={() => resetDateFilter()}
                  >
                    <ThemedText style={[styles.rhbQuickStatValue, !isDateFilterActive && styles.rhbQuickStatValueActive]}>
                      {totalRHBMonth}
                    </ThemedText>
                    <ThemedText style={[styles.rhbQuickStatLabel, !isDateFilterActive && styles.rhbQuickStatLabelActive]}>
                      Ngayong Buwan
                    </ThemedText>
                  </Pressable>
                  
                  <Pressable 
                    style={[styles.rhbQuickStatItem, !isDateFilterActive && styles.rhbQuickStatActive]}
                    onPress={() => {
                      const today = new Date();
                      const todayStr = today.toLocaleDateString('en-GB');
                      setFromDate(todayStr);
                      setToDate(todayStr);
                      filterRHBDataByDate(todayStr, todayStr);
                    }}
                  >
                    <ThemedText style={[styles.rhbQuickStatValue]}>
                      {totalRHBToday}
                    </ThemedText>
                    <ThemedText style={[styles.rhbQuickStatLabel]}>
                      Ngayong Araw 
                    </ThemedText>
                  </Pressable>
                  
                  <Pressable 
                    style={[styles.rhbQuickStatItem]}
                    onPress={() => {
                      const today = new Date();
                      const weekStart = new Date(today);
                      weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
                      const from = weekStart.toLocaleDateString('en-GB');
                      const to = today.toLocaleDateString('en-GB');
                      setFromDate(from);
                      setToDate(to);
                      filterRHBDataByDate(from, to);
                    }}
                  >
                    <ThemedText style={[styles.rhbQuickStatValue]}>
                      {totalRHBWeek}
                    </ThemedText>
                    <ThemedText style={[styles.rhbQuickStatLabel]}>
                      Ngayong Linggo
                    </ThemedText>
                  </Pressable>
                </View>

                {/* Custom Date Filter Section */}
                <View style={styles.rhbFilterSection}>
                  <ThemedText style={styles.rhbFilterSectionTitle}>Custom na Petsa</ThemedText>
                  
                  <View style={styles.rhbDateInputsRow}>
                    <View style={styles.rhbDateInputField}>
                      <ThemedText style={styles.rhbDateLabel}>Mula</ThemedText>
                      <TextInput
                        style={styles.rhbDateInputCompact}
                        placeholder="DD/MM/YYYY"
                        placeholderTextColor="#8E8E93"
                        value={fromDate}
                        onChangeText={handleFromDateChange}
                        keyboardType="numeric"
                        maxLength={10}
                      />
                    </View>
                    
                    <View style={{ justifyContent: 'center', alignItems: 'center', paddingTop: 16 }}>
                      <Ionicons name="arrow-forward" size={16} color="#8E8E93" />
                    </View>
                    
                    <View style={styles.rhbDateInputField}>
                      <ThemedText style={styles.rhbDateLabel}>Hanggang</ThemedText>
                      <TextInput
                        style={styles.rhbDateInputCompact}
                        placeholder="DD/MM/YYYY"
                        placeholderTextColor="#8E8E93"
                        value={toDate}
                        onChangeText={handleToDateChange}
                        keyboardType="numeric"
                        maxLength={10}
                      />
                    </View>
                  </View>
                  
                  <View style={styles.rhbFilterActionsRow}>
                    <Pressable style={styles.rhbFilterButtonCompact} onPress={applyDateFilter}>
                      <ThemedText style={styles.rhbFilterButtonCompactText}>I-Apply</ThemedText>
                    </Pressable>
                    
                    <Pressable style={styles.rhbResetButtonCompact} onPress={resetDateFilter}>
                      <ThemedText style={styles.rhbResetButtonCompactText}>Burahin</ThemedText>
                    </Pressable>
                  </View>
                </View>

                {/* Result Card */}
                {isDateFilterActive ? (
                  <View style={styles.rhbResultCard}>
                    <View style={styles.rhbResultHeader}>
                      <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
                      <ThemedText style={styles.rhbResultDateRange}>
                        {fromDate} to {toDate}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.rhbResultValue}>{filteredRHBData}</ThemedText>
                    <ThemedText style={styles.rhbResultLabel}>Nagawang RHB</ThemedText>
                  </View>
                ) : (
                  <View style={styles.rhbResultCard}>
                    <View style={styles.rhbResultHeader}>
                      <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
                      <ThemedText style={styles.rhbResultDateRange}>Kasalukuyang Buwan</ThemedText>
                    </View>
                    <ThemedText style={styles.rhbResultValue}>{totalRHBMonth}</ThemedText>
                    <ThemedText style={styles.rhbResultLabel}>Nagawang RHB</ThemedText>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

          {/* Temperature Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={isTempModalVisible}
            onRequestClose={() => setIsTempModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>Status ng Temperatura</ThemedText>
                  <Pressable 
                    onPress={() => setIsTempModalVisible(false)}
                    style={{
                      backgroundColor: '#F2F2F7',
                      borderRadius: 20,
                      padding: 8,
                    }}
                  >
                    <Ionicons name="close" size={20} color="#8E8E93" />
                  </Pressable>
                </View>
                
                <ScrollView style={styles.tempDetailsContainer}>
                  <View style={styles.tempInfoCard}>
                    <ThemedText style={styles.tempInfoTitle}>
                      Ang Temperatura ng makina ay:
                    </ThemedText>
                    <View style={styles.tempValueContainer}>
                      <ThemedText style={styles.tempModalValue}>30°C</ThemedText>
                    </View>
                    <View style={styles.tempStatusContainer}>
                      <Ionicons name="thermometer" size={24} color="#3498DB" />
                      <ThemedText style={styles.tempStatusText}>Normal pa ang temperatura</ThemedText>
                    </View>
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>

        {/* 3D Model Viewer removed - expo-three was causing Firebase Image.getSize errors */}
    </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F2F2F7',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '85%',
    padding: 28,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  chatContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  messagesList: {
    flex: 1,
  },
  chatInputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 24,
    marginTop: 16,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chatInput: {
    flex: 1,
    color: '#1C1C1E',
    fontSize: 17,
    padding: 12,
    maxHeight: 120,
    fontWeight: '400',
  },
  sendButton: {
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  messageContainer: {
    marginBottom: 15,
  },
  aiMessageBubble: {
    backgroundColor: '#E5E5EA',
    padding: 16,
    borderRadius: 20,
    borderTopLeftRadius: 8,
    maxWidth: '85%',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    color: '#1C1C1E',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '400',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    width: '100%',
  },
  statusBox: {
    width: '48%',
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  rawMaterialsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  materialLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
    width: 60,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    marginLeft: 15,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  materialPercent: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
    width: 45,
    textAlign: 'right',
    marginLeft: 10,
  },
  rhbBackground: {
    padding: 15,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  rhbWrapper: {
    alignItems: 'center',
  },
  rhbValue: {
    fontSize: 36,
    color: '#1C1C1E',
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 42,
  },
  rhbLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#F2F2F7',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
    paddingVertical: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modelContainer: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  modelIcon: {
    marginTop: 8,
    opacity: 0.7,
  },
  placeholderText: {
    fontSize: 20,
    color: '#1C1C1E',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 4,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '500',
  },
  temperatureBackground: {
    padding: 15,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  temperatureWrapper: {
    alignItems: 'center',
  },
  temperatureValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  temperatureValue: {
    fontSize: 36,
    color: '#1C1C1E',
    fontWeight: '600',
    lineHeight: 42,
  },
  temperatureUnit: {
    fontSize: 18,
    color: '#1C1C1E',
    fontWeight: '600',
    marginLeft: 4,
    marginTop: 4,
  },
  temperatureLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 10,
  },
  actionsContainer: {
    marginBottom: 32,
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  activeTimerCard: {
    backgroundColor: '#483D8B',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00CC66',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  timerValue: {
    fontSize: 52,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginVertical: 12,
    letterSpacing: 1,
    lineHeight: 62,
  },
  timerDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  timerDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerDetailText: {
    fontSize: 14,
    color: '#B8B5FF',
    fontWeight: '500',
  },
  manualProjectForm: {
    flex: 1,
    padding: 8,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
    marginBottom: 12,
  },
  textInput: {
    color: '#1C1C1E',
    fontSize: 17,
    fontFamily: 'System',
    fontWeight: '400',
    backgroundColor: '#F2F2F7',
    width: '100%',
    height: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 0,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
  },
  largeTextInput: {
    color: '#1C1C1E',
    fontSize: 32,
    fontFamily: 'System',
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#F2F2F7',
    width: '100%',
    height: 80,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginVertical: 0,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 16,
  },
  readOnlyInput: {
    backgroundColor: '#F8F9FA',
    borderColor: '#E5E5EA',
    opacity: 0.7,
  },
  createProjectButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createProjectButtonDisabled: {
    backgroundColor: '#8E8E93',
    shadowOpacity: 0.1,
  },
  createProjectButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  tempDetailsContainer: {
    flex: 1,
    padding: 8,
  },
  tempInfoCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    padding: 32,
    paddingVertical: 40,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tempInfoTitle: {
    fontSize: 20,
    color: '#1C1C1E',
    marginBottom: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  tempValueContainer: {
    alignItems: 'center',
    marginVertical: 30,
    minHeight: 100,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  tempModalValue: {
    fontSize: 64,
    color: '#007AFF',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 72,
  },
  tempStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tempStatusText: {
    fontSize: 17,
    color: '#1C1C1E',
    fontWeight: '500',
    marginLeft: 8,
  },
  materialsDetailsContainer: {
    flex: 1,
    padding: 8,
  },
  materialsCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    padding: 32,
    paddingVertical: 40,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  materialDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  materialDetailLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    width: 80,
  },
  materialDetailBar: {
    flex: 1,
    height: 12,
    backgroundColor: '#E5E5EA',
    borderRadius: 6,
    marginHorizontal: 15,
    overflow: 'hidden',
  },
  materialDetailProgress: {
    height: '100%',
    borderRadius: 6,
  },
  materialDetailPercent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    width: 45,
    textAlign: 'right',
  },
  // RHB Modal iOS Styles
  rhbModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '88%',
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  rhbModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  rhbModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    flex: 1,
  },
  rhbDetailsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rhbQuickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  rhbQuickStatItem: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  rhbQuickStatActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  rhbQuickStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  rhbQuickStatValueActive: {
    color: '#007AFF',
  },
  rhbQuickStatLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666',
  },
  rhbQuickStatLabelActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  rhbFilterSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  rhbFilterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  rhbDateInputsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  rhbDateInputField: {
    flex: 1,
  },
  rhbDateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  rhbDateInputCompact: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    textAlign: 'center',
  },
  rhbFilterActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rhbFilterButtonCompact: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  rhbFilterButtonCompactText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  rhbResetButtonCompact: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  rhbResetButtonCompactText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
  },
  rhbResultCard: {
    backgroundColor: '#483D8B',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#483D8B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    alignItems: 'center',
  },
  rhbResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  rhbResultDateRange: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  rhbResultValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 54,
  },
  rhbResultLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#B8B5FF',
  },
});
