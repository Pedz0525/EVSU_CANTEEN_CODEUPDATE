import React, { useState, useEffect } from "react";
import {
  View,
  Button,
  Animated,
  PanResponder,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_URL } from "./config";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function Vendor_Dashboard({ navigation, route }) {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [numberOfOrders, setNumberOfOrders] = useState(0);
  const [filter, setFilter] = useState("All"); // Added filter state

  const navigateToAddItem = () => {
    navigation.navigate("AddItem", {
      email: vendor.email,
      vendor_id: vendor.vendor_id,
    });
  };
  const navigateToVendorProfile = () => {
    navigation.navigate("VendorProfile", {
      vendor_id: vendor.vendor_id,
      name: vendor.name,
      email: vendor.email,
      username: vendor.username,
      stallname: vendor.stallname,
      profileImage: vendor.profileImage,
    });
  };

  const pan = useState(new Animated.ValueXY({ x: 290, y: 580 }))[0];

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      pan.setOffset({
        x: pan.x._value,
        y: pan.y._value,
      });
      pan.setValue({ x: 0, y: 0 });
    },
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
      useNativeDriver: false,
    }),
    onPanResponderRelease: () => {
      pan.flattenOffset();
    },
  });

  useEffect(() => {
    loadProfileImage();
  }, []);

  useEffect(() => {
    if (route.params?.updatedProfileImage) {
      setProfileImage(route.params.updatedProfileImage);
      saveProfileImage(route.params.updatedProfileImage);
    }
  }, [route.params?.updatedProfileImage]);

  const loadProfileImage = async () => {
    try {
      const savedImage = await AsyncStorage.getItem("profileImage");
      if (savedImage) {
        setProfileImage(savedImage);
      }
    } catch (error) {
      console.error("Error loading profile image:", error);
    }
  };

  const saveProfileImage = async (imageUri) => {
    try {
      await AsyncStorage.setItem("profileImage", imageUri);
    } catch (error) {
      console.error("Error saving profile image:", error);
    }
  };

  const handlePress = (tab) => {
    console.log(`${tab} tab pressed`);
    if (tab === "Add") {
      navigateToAddItem();
    }
    if (tab === "Profile") {
      navigateToVendorProfile();
    }
  };

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        const userData = await AsyncStorage.getItem("userData");
        if (userData) {
          const parsedData = JSON.parse(userData);
          const email = parsedData.email;

          const response = await axios.get(
            `${API_URL}/vendor_information?email=${email}`
          );
          setVendor(response.data);

          const itemsResponse = await axios.get(
            `${API_URL}/vendor_items?vendor_id=${response.data.vendor_id}`
          );
          setItems(itemsResponse.data.items);
        }
      } catch (error) {
        console.error("Error fetching vendor data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Image
          style={styles.loadingImage}
          source={require("./assets/EvsuLOGO.png")}
        />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!vendor) {
    return <Text>No vendor data available</Text>;
  }

  const handleEdit = (item) => {
    navigation.navigate("EditItem", { item });
  };

  const handleDelete = (itemId) => {
    Alert.alert(
      "Are you sure?",
      "This item will be permanently deleted.",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Delete canceled"),
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const response = await axios.delete(`${API_URL}/delete_item`, {
                data: { id: itemId },
              });

              if (response.data.success) {
                Alert.alert("Success", "Item deleted successfully");
                navigation.replace("Vendor");
              } else {
                Alert.alert("Error", response.data.message);
              }
            } catch (error) {
              console.error("Error deleting item:", error);
              Alert.alert("Error", "Failed to delete item. Please try again.");
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  // Filtered items based on the selected filter
  const filteredItems = items.filter((item) => {
    if (filter === "All") return true;
    return item.status === filter;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.storeInfo}>
          <Image
            style={styles.profileImage}
            source={require("./assets/EvsuLOGO.png")}
          />
          <View style={styles.storeDetails}>
            <Text style={styles.storeName}>Evsu Canteen</Text>
          </View>
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === "All" && styles.activeFilterButton,
              ]}
              onPress={() => setFilter("All")}
            >
              <Text style={styles.filterButtonText}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === "Available" && styles.activeFilterButton,
              ]}
              onPress={() => setFilter("Available")}
            >
              <Text style={styles.filterButtonText}>Available</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === "Unavailable" && styles.activeFilterButton,
              ]}
              onPress={() => setFilter("Unavailable")}
            >
              <Text style={styles.filterButtonText}>Unavailable</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === "Out of Stock" && styles.activeFilterButton,
              ]}
              onPress={() => setFilter("Out of Stock")}
            >
              <Text style={styles.filterButtonText}>Out of Stock</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={styles.itemsContainer}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <View
                key={item.item_id || index}
                style={
                  item.status === "Available"
                    ? styles.itemCard
                    : styles.itemCard1
                }
              >
                <Image
                  style={styles.itemImage}
                  source={{ uri: `${API_URL}${item.item_image}` }}
                />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.item_name}</Text>
                  <Text style={styles.itemPrice}>Price: ₱{item.price}</Text>
                  <Text style={styles.itemCategory}>
                    Category: {item.category}
                  </Text>
                  <Text style={styles.itemStatus}>
                    <Text
                      style={
                        item.status === "Available"
                          ? styles.available
                          : styles.unavailable
                      }
                    >
                      {item.status}
                    </Text>
                  </Text>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    onPress={() => handleEdit(item)}
                    style={styles.editButton}
                  >
                    <Text style={styles.editButtonText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(item.item_id)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noItemsBox}>
              <Text style={styles.noItemsText}>No Food Display</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Animated.View
        style={[
          styles.floatingButton,
          {
            transform: [{ translateX: pan.x }, { translateY: pan.y }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          onPress={() =>
            navigation.replace("VendorOrder", {
              email: vendor.email,
              vendor_id: vendor.vendor_id,
            })
          }
        >
          <Ionicons name="fast-food-sharp" size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => handlePress("Home")}>
          <AntDesign name="home" size={35} color="black" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handlePress("Add")}>
          <AntDesign name="pluscircleo" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handlePress("Profile")}>
          <AntDesign name="user" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  filterWrapper: {
    marginVertical: 10,
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterButton: {
    padding: 10,
    marginHorizontal: 5,
    backgroundColor: "#ddd",
    borderRadius: 5,
  },
  activeFilterButton: {
    backgroundColor: "#007BFF",
  },
  filterButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },
  filterButton: {
    marginHorizontal: 10,
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderWidth: 1,

    borderColor: "#8B0000",
  },
  activeFilterButton: {
    backgroundColor: "#8B0000",
    color: "#faf9f7",
  },
  filterButtonText: {
    color: "#0f0c06",
  },

  floatingButton: {
    position: "absolute",
    zIndex: 10, // Ensure it appears above other components
    width: 60, // Adjust width for proper size
    height: 60, // Adjust height for proper size
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30, // Makes it circular
    backgroundColor: "#7a0000", // Background color for visibility
    shadowColor: "#000", // Add shadow for better visibility
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5, // Elevation for Android shadow
  },
  foodOrder: {
    position: "absolute",
    zIndex: 10,
    left: 10,
    top: -15,
    fontSize: 15,
    fontWeight: "bold",
    color: "white",
  },

  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7a0000",
    padding: 10,
  },
  backButton: {
    color: "#fff",
    fontSize: 24,
    marginRight: 16,
  },
  storeInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7a0000", // Background color similar to the image
    padding: 1,
    borderRadius: 8,
    marginBottom: 0,
    marginTop: 0,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 40,
    backgroundColor: "#ccc",
    marginRight: 10,
  },
  storeDetails: {
    flex: 1,
  },
  storeName: {
    color: "#fff",
    fontSize: 15, // Adjust font size for prominence
    fontWeight: "bold",
    fontFamily: "Cochin",
  },
  vendorEmail: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.8,
  },
  logoutButton: {
    position: "absolute",
    right: 16,
    top: 16,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  logoutText: {
    color: "#7a0000",
    fontWeight: "bold",
  },
  banner: {
    alignItems: "center",
    marginVertical: 20,
  },
  bannerImage: {
    width: "90%",
    height: 200,
    borderRadius: 10,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#8B0000", // Darker red for bottom nav
    paddingVertical: 10,
    height: 100,
  },
  tabText: {
    color: "#fff",
    fontSize: 16,
  },

  itemsContainer: {
    padding: 16,
  },
  itemCard: {
    flexDirection: "row",
    backgroundColor: "#d7d9de",
    borderRadius: 10,
    marginBottom: 20,
    padding: 15,
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemCard1: {
    flexDirection: "row",
    backgroundColor: "#f70c34",
    borderRadius: 10,
    marginBottom: 20,
    padding: 15,
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 15,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#5d3f35",
  },
  itemPrice: {
    fontSize: 14,
    color: "#333",
  },
  itemCategory: {
    fontSize: 14,
    color: "#6e4c3b",
  },
  itemStatus: {
    fontSize: 14,
    fontWeight: "bold",
  },
  available: {
    color: "#4caf50", // Green for available
  },
  unavailable: {
    color: "#f0e6e8", // Red for unavailable
  },
  unavailablebox: {
    backgroundColor: "#94031b",
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#f9b74e",
    padding: 5,
    borderRadius: 5,
    marginRight: 10,
  },
  editButtonText: {
    fontSize: 16,
    color: "#fff",
  },
  deleteButton: {
    backgroundColor: "#e57373",
    padding: 5,
    borderRadius: 5,
  },
  deleteButtonText: {
    fontSize: 16,
    color: "#fff",
  },
  noItemsBox: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginTop: 200,
  },
  noItemsText: {
    fontSize: 18,
    color: "#999",
    fontWeight: "bold",
  },

  loadingContainer: {
    flex: 1, // Full screen height
    justifyContent: "center", // Center horizontally
    alignItems: "center", // Center vertically
    backgroundColor: "#f5f5f5", // Optional: background color for loading screen
  },
  loadingImage: {
    width: 100, // Adjust width as needed
    height: 100, // Adjust height as needed
    marginBottom: 20, // Space between image and text
  },
  loadingText: {
    fontSize: 18,
    color: "#000",
    fontWeight: "bold",
  },
});
