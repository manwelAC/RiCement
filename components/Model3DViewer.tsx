import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, PinchGestureHandler, State } from 'react-native-gesture-handler';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ThemedText } from './ThemedText';

interface Model3DViewerProps {
  visible: boolean;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Model3DViewer({ visible, onClose }: Model3DViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // 3D Scene refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Touch interaction states
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const lastPan = useRef({ x: 0, y: 0 });
  const lastScale = useRef(1);

  const startAnimationLoop = (renderer: Renderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, gl: any) => {
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      // Apply rotations to the model
      if (modelRef.current) {
        modelRef.current.rotation.x = rotation.x;
        modelRef.current.rotation.y = rotation.y;
        modelRef.current.scale.set(scale, scale, scale);
      }
      
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();
  };

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (modelRef.current && sceneRef.current) {
      sceneRef.current.remove(modelRef.current);
      modelRef.current = null;
    }

    if (rendererRef.current) {
      rendererRef.current = null;
    }

    sceneRef.current = null;
    cameraRef.current = null;
  };

  const setupScene = async (gl: any) => {
    try {
      setIsLoading(true);
      setHasError(false);
      setErrorMessage('');

      // Clean up any existing scene first
      cleanup();

      // Initialize renderer
      const renderer = new Renderer({ gl });
      rendererRef.current = renderer;
      renderer.setSize(screenWidth, screenHeight - 200);
      renderer.setClearColor(0xf2f2f7, 1);

      // Create scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        75,
        (screenWidth) / (screenHeight - 200),
        0.1,
        1000
      );
      camera.position.z = 5;
      cameraRef.current = camera;

      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);

      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
      directionalLight2.position.set(-5, -5, -5);
      scene.add(directionalLight2);

      // Load the GLB model
      const loader = new GLTFLoader();
      
      // Load the model from assets
      const asset = Asset.fromModule(require('@/assets/intro-asset/3DMODEL.glb'));
      await asset.downloadAsync();
      
      if (!asset.localUri) {
        throw new Error('Failed to load model asset');
      }

      loader.load(
        asset.localUri,
        (gltf) => {
          const model = gltf.scene;
          modelRef.current = model;

          // Center the model
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          model.position.sub(center);

          // Scale the model to fit the view
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scaleFactor = 3 / maxDim;
          model.scale.set(scaleFactor, scaleFactor, scaleFactor);

          scene.add(model);
          setIsLoading(false);
        },
        (progress) => {
          console.log('Loading progress:', (progress.loaded / progress.total) * 100 + '%');
        },
        (error) => {
          console.error('Error loading model:', error);
          setHasError(true);
          setErrorMessage('Failed to load 3D model');
          setIsLoading(false);
        }
      );

      // Start animation loop
      startAnimationLoop(renderer, scene, camera, gl);
    } catch (error) {
      console.error('Setup error:', error);
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to setup 3D viewer');
      setIsLoading(false);
    }
  };

  const handlePan = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      const { translationX, translationY } = event.nativeEvent;
      const sensitivity = 0.01;
      setRotation({
        y: lastPan.current.y + translationX * sensitivity,
        x: lastPan.current.x - translationY * sensitivity,
      });
    } else if (event.nativeEvent.state === State.END) {
      lastPan.current = rotation;
    }
  };

  const handlePinch = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      const newScale = Math.max(0.5, Math.min(3, lastScale.current * event.nativeEvent.scale));
      setScale(newScale);
    } else if (event.nativeEvent.state === State.END) {
      lastScale.current = scale;
    }
  };

  const resetView = () => {
    setRotation({ x: 0, y: 0 });
    setScale(1);
    lastPan.current = { x: 0, y: 0 };
    lastScale.current = 1;
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      cleanup();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
    >
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>3D Model Viewer</ThemedText>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#1C1C1E" />
          </Pressable>
        </View>

        {hasError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
            <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
            <Pressable style={styles.retryButton} onPress={onClose}>
              <ThemedText style={styles.retryButtonText}>Close</ThemedText>
            </Pressable>
          </View>
        ) : (
          <>
            <PinchGestureHandler onGestureEvent={handlePinch} onHandlerStateChange={handlePinch}>
              <PanGestureHandler onGestureEvent={handlePan} onHandlerStateChange={handlePan}>
                <View style={styles.glContainer}>
                  <GLView
                    style={styles.glView}
                    onContextCreate={setupScene}
                  />
                  {isLoading && (
                    <View style={styles.loadingOverlay}>
                      <ActivityIndicator size="large" color="#007AFF" />
                      <ThemedText style={styles.loadingText}>Loading 3D Model...</ThemedText>
                    </View>
                  )}
                </View>
              </PanGestureHandler>
            </PinchGestureHandler>

            <View style={styles.controls}>
              <View style={styles.controlsRow}>
                <ThemedText style={styles.instructionText}>
                  👆 Drag to rotate • 🤏 Pinch to zoom
                </ThemedText>
              </View>
              <Pressable style={styles.resetButton} onPress={resetView}>
                <Ionicons name="refresh" size={20} color="#007AFF" />
                <ThemedText style={styles.resetButtonText}>Reset View</ThemedText>
              </Pressable>
            </View>
          </>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  glContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  glView: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(242, 242, 247, 0.9)',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  controls: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  controlsRow: {
    marginBottom: 16,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
    textAlign: 'center',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  resetButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
