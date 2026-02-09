import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { auth, db } from '@/config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

interface ControllerState {
  dispense_rha: boolean;
  dispense_cement: boolean;
  dispense_sand: boolean;
  dispense_water: boolean;
  mix: boolean;
  mixer_up: boolean;
  mixer_down: boolean;
  updatedAt: string;
}

export default function ControllerScreen() {
  const [controllerState, setControllerState] = useState<ControllerState>({
    dispense_rha: false,
    dispense_cement: false,
    dispense_sand: false,
    dispense_water: false,
    mix: false,
    mixer_up: false,
    mixer_down: false,
    updatedAt: new Date().toISOString(),
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Load controller state from Firestore
  const loadControllerState = useCallback(() => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setIsLoading(false);
        return;
      }

      const unsub = onSnapshot(doc(db, 'manual_controller', user.uid), async (docSnap) => {
        if (docSnap.exists()) {
          setControllerState(docSnap.data() as ControllerState);
        } else {
          // Initialize with default state if document doesn't exist
          const defaultState: ControllerState = {
            dispense_rha: false,
            dispense_cement: false,
            dispense_sand: false,
            dispense_water: false,
            mix: false,
            mixer_up: false,
            mixer_down: false,
            updatedAt: new Date().toISOString(),
          };
          
          // Write default state to Firestore
          try {
            await setDoc(doc(db, 'manual_controller', user.uid), defaultState);
            console.log('Controller initialized in Firestore');
          } catch (error) {
            console.error('Error initializing controller in Firestore:', error);
          }
          
          setControllerState(defaultState);
        }
        setIsLoading(false);
      });

      return () => unsub();
    } catch (error) {
      console.error('Error loading controller state:', error);
      setIsLoading(false);
    }
  }, []);

  // Load state when screen focuses
  useFocusEffect(loadControllerState);

  // Toggle command button
  const toggleCommand = async (commandKey: keyof ControllerState) => {
    if (commandKey === 'updatedAt') return;

    try {
      setIsUpdating(true);
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be signed in');
        return;
      }

      const newState = {
        ...controllerState,
        [commandKey]: !controllerState[commandKey],
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'manual_controller', user.uid), newState, { merge: true });

      // Show haptic feedback - toggle confirmation
      console.log(`${commandKey} toggled to ${!controllerState[commandKey]}`);
    } catch (error) {
      console.error('Error updating controller state:', error);
      Alert.alert('Error', 'Failed to update command. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <ThemedText style={styles.loadingText}>Loading controller...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>Machine Controller</ThemedText>
        <ThemedText style={styles.headerSubtitle}>Real-time Command Control</ThemedText>
      </ThemedView>

      <ThemedView style={styles.content} lightColor="transparent" darkColor="transparent">
        {/* Dispense Commands Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="water" size={24} color="#007AFF" />
            <ThemedText style={styles.sectionTitle}>Dispense Commands</ThemedText>
          </View>

          <View style={styles.commandGrid}>
            <ControlButton
              label="RHA"
              isActive={controllerState.dispense_rha}
              onPress={() => toggleCommand('dispense_rha')}
              isUpdating={isUpdating}
              icon="layers"
              color="#FF9500"
            />
            <ControlButton
              label="CEMENT"
              isActive={controllerState.dispense_cement}
              onPress={() => toggleCommand('dispense_cement')}
              isUpdating={isUpdating}
              icon="cube"
              color="#00CC96"
            />
            <ControlButton
              label="SAND"
              isActive={controllerState.dispense_sand}
              onPress={() => toggleCommand('dispense_sand')}
              isUpdating={isUpdating}
              icon="square"
              color="#AB63FA"
            />
            <ControlButton
              label="WATER"
              isActive={controllerState.dispense_water}
              onPress={() => toggleCommand('dispense_water')}
              isUpdating={isUpdating}
              icon="water"
              color="#00B4D8"
            />
          </View>
        </View>

        {/* Mix Commands Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings" size={24} color="#007AFF" />
            <ThemedText style={styles.sectionTitle}>Mix Commands</ThemedText>
          </View>

          <View style={styles.mixControlsContainer}>
            <ControlButton
              label="MIX"
              isActive={controllerState.mix}
              onPress={() => toggleCommand('mix')}
              isUpdating={isUpdating}
              icon="git-merge"
              color="#34C759"
              size="large"
            />

            <View style={styles.mixAdjustmentRow}>
              <ControlButton
                label="UP"
                isActive={controllerState.mixer_up}
                onPress={() => toggleCommand('mixer_up')}
                isUpdating={isUpdating}
                icon="arrow-up"
                color="#5AC8FA"
                size="small"
              />
              <ControlButton
                label="DOWN"
                isActive={controllerState.mixer_down}
                onPress={() => toggleCommand('mixer_down')}
                isUpdating={isUpdating}
                icon="arrow-down"
                color="#FF3B30"
                size="small"
              />
            </View>
          </View>
        </View>

        {/* Status Indicator */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusDot} />
            <ThemedText style={styles.statusText}>Live Control Active</ThemedText>
          </View>
          <ThemedText style={styles.statusTime}>
            Last updated: {new Date(controllerState.updatedAt).toLocaleTimeString()}
          </ThemedText>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

interface ControlButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  isUpdating: boolean;
  icon: string;
  color: string;
  size?: 'small' | 'medium' | 'large';
}

function ControlButton({
  label,
  isActive,
  onPress,
  isUpdating,
  icon,
  color,
  size = 'medium',
}: ControlButtonProps) {
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  return (
    <Pressable
      style={({ pressed }) => [
        isSmall ? styles.controlButtonSmall : isLarge ? styles.controlButtonLarge : styles.controlButton,
        isActive && (isSmall ? styles.controlButtonSmallActive : isLarge ? styles.controlButtonLargeActive : styles.controlButtonActive),
        pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
      ]}
      onPress={onPress}
      disabled={isUpdating}
    >
      <Ionicons
        name={icon as any}
        size={isSmall ? 16 : isLarge ? 28 : 20}
        color={isActive ? '#FFFFFF' : color}
        style={{ marginBottom: 6 }}
      />
      <ThemedText
        style={[
          isSmall ? styles.controlButtonTextSmall : isLarge ? styles.controlButtonTextLarge : styles.controlButtonText,
          isActive && styles.controlButtonTextActive,
        ]}
      >
        {label}
      </ThemedText>
      {isActive && (
        <View style={styles.activeBadge}>
          <Ionicons name="checkmark-circle" size={12} color="#34C759" />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#F2F2F7',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  commandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  controlButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 120,
  },
  controlButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
    shadowOpacity: 0.3,
  },
  controlButtonSmall: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 100,
  },
  controlButtonSmallActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
    shadowOpacity: 0.3,
  },
  controlButtonLarge: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 140,
    marginBottom: 12,
  },
  controlButtonLargeActive: {
    borderColor: '#34C759',
    backgroundColor: '#34C759',
    shadowOpacity: 0.3,
  },
  controlButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  controlButtonTextSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  controlButtonTextLarge: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  controlButtonTextActive: {
    color: '#FFFFFF',
  },
  mixControlsContainer: {
    gap: 12,
  },
  mixAdjustmentRow: {
    flexDirection: 'row',
    gap: 12,
  },
  activeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 2,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34C759',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  statusTime: {
    fontSize: 12,
    color: '#666',
    marginLeft: 18,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
});
