import { auth, db } from "@/config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
} from "firebase/firestore";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

interface ManualProject {
  id: string;
  name: string;
  blocks: number;
  estimatedTime: string;
  remainingTime?: number;
  completedBlocks?: number;
  date: string;
  status: "Queue" | "Pouring" | "Mixing" | "Pouring2" | "Completed";
  userId: string;
  createdAt?: string;
}

export default function ProjectScreen() {
  const [projects, setProjects] = useState<ManualProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<
    "All" | "Queue" | "Active" | "Completed"
  >("All");
  const [searchText, setSearchText] = useState("");
  const router = useRouter();

  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      const q = query(
        collection(db, "manual_projects"),
        where("userId", "==", user.uid),
      );

      const querySnapshot = await getDocs(q);
      const projectsData: ManualProject[] = [];

      querySnapshot.forEach((doc) => {
        projectsData.push({
          id: doc.id,
          ...doc.data(),
        } as ManualProject);
      });

      projectsData.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date).getTime();
        const dateB = new Date(b.createdAt || b.date).getTime();
        return dateB - dateA;
      });

      setProjects(projectsData);
    } catch (error) {
      console.error("Error loading projects:", error);
      Alert.alert("Error", "Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getFilteredProjects = (): ManualProject[] => {
    let filtered = projects;

    // Filter by status
    if (selectedFilter === "All") {
      filtered = projects;
    } else if (selectedFilter === "Active") {
      filtered = projects.filter((p) =>
        ["Queue", "Pouring", "Mixing", "Pouring2"].includes(p.status),
      );
    } else {
      filtered = projects.filter((p) => p.status === selectedFilter);
    }

    // Filter by search text
    if (searchText.trim()) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchText.toLowerCase()),
      );
    }

    return filtered;
  };

  const handleDeleteProject = async (projectId: string) => {
    Alert.alert(
      "Delete Project",
      "Are you sure you want to delete this project?",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (!user) return;
              await deleteDoc(doc(db, "manual_projects", projectId));
              setProjects(projects.filter((p) => p.id !== projectId));
              Alert.alert("Success", "Project deleted successfully");
            } catch (error) {
              console.error("Error deleting project:", error);
              Alert.alert("Error", "Failed to delete project");
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "Queue":
        return "#FF9500";
      case "Pouring":
        return "#FF3B30";
      case "Mixing":
        return "#AF52DE";
      case "Pouring2":
        return "#FF3B30";
      case "Completed":
        return "#34C759";
      default:
        return "#8E8E93";
    }
  };

  const getStatusLabel = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [loadProjects]),
  );

  const filteredProjects = getFilteredProjects();

  const renderProjectCard = ({ item }: { item: ManualProject }) => (
    <Pressable
      onPress={() => {}}
      style={({ pressed }) => [
        styles.projectCard,
        pressed && styles.projectCardPressed,
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.name}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusBadgeText}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => handleDeleteProject(item.id)}
          style={styles.deleteButton}
        >
          <Ionicons name="close-circle-outline" size={24} color="#FF3B30" />
        </Pressable>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="cube-outline" size={18} color="#007AFF" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Blocks</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {item.blocks}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="stopwatch-outline" size={18} color="#007AFF" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Est. Time</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {item.estimatedTime}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={18} color="#007AFF" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {item.date}
              </Text>
            </View>
          </View>
        </View>

        {item.status !== "Queue" && item.completedBlocks !== undefined && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressValue}>
                {item.completedBlocks}/{item.blocks} completed
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(item.completedBlocks / item.blocks) * 100}%` },
                ]}
              />
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );

  return (
    // ✅ FIX: Outer View holds the background, inner ScrollView handles all content
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Projects</Text>
          <Text style={styles.headerSubtitle}>Manage your manual projects</Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={18}
            color="#8E8E93"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by project name..."
            placeholderTextColor="#8E8E93"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <Pressable
              onPress={() => setSearchText("")}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={18} color="#8E8E93" />
            </Pressable>
          )}
        </View>

        {/* Filter Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          scrollEventThrottle={16}
          style={styles.filterScrollContainer}
          contentContainerStyle={styles.filterContentContainer}
        >
          {["All", "Queue", "Active", "Completed"].map((filter) => (
            <Pressable
              key={filter}
              onPress={() => setSelectedFilter(filter as any)}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.filterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === filter && styles.filterButtonTextActive,
                ]}
              >
                {filter}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Projects List */}
        <View style={styles.listContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading projects...</Text>
            </View>
          ) : filteredProjects.length > 0 ? (
            <FlatList
              data={filteredProjects}
              renderItem={renderProjectCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="inbox-outline"
                size={64}
                color="#8E8E93"
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyTitle}>No Projects</Text>
              <Text style={styles.emptySubtitle}>
                {selectedFilter === "All"
                  ? "Create a new project to get started"
                  : `No ${selectedFilter.toLowerCase()} projects found`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  // ✅ NEW: drives padding for the entire scrollable area
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 8,
    backgroundColor: "#F2F2F7",
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "700",
    color: "#000000",
    letterSpacing: -0.5,
    paddingVertical: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "500",
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  searchIcon: {
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 14,
    color: "#1C1C1E",
  },
  clearButton: {
    padding: 10,
  },
  filterScrollContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  filterContentContainer: {
    paddingRight: 0,
    gap: 1,
  },
  filterButton: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 0,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    height: 28,
    justifyContent: "center",
  },
  filterButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  filterButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
  },
  listContainer: {
    // ✅ REMOVED flex: 1 — no longer needed inside ScrollView
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  listContent: {
    paddingBottom: 20,
  },
  projectCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  projectCardPressed: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  cardTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 10,
  },
  cardContent: {
    gap: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  infoItem: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
  },
  infoTextContainer: {
    flex: 1,
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 11,
    color: "#8E8E93",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 13,
    color: "#1C1C1E",
    fontWeight: "600",
    marginTop: 2,
  },
  progressContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 12,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "600",
  },
  progressValue: {
    fontSize: 12,
    color: "#1C1C1E",
    fontWeight: "600",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E5EA",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 4,
  },
  loadingContainer: {
    paddingTop: 60,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "500",
  },
  emptyContainer: {
    paddingTop: 60,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  emptyIcon: {
    marginBottom: 8,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "500",
    textAlign: "center",
  },
});
