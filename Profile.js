import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";

const Profile = ({ navigation, route }) => {
  const { username: initialUsername } = route.params;
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleAccountSettings = () => {
    setShowEditProfile(true);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleLogout = async () => {
    try {
      // Clear any stored data
      await AsyncStorage.clear();

      // Reset navigation and redirect to UserTypeSelection
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "UserTypeSelection" }],
        })
      );
    } catch (error) {
      console.error("Error during logout:", error);
      Alert.alert("Error", "Failed to logout. Please try again.");
    }
  };

  const selectImage = async (useLibrary = false) => {
    try {
      let result;
      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      };

      if (useLibrary) {
        result = await ImagePicker.launchImageLibraryAsync(options);
      } else {
        await ImagePicker.requestCameraPermissionsAsync();
        result = await ImagePicker.launchCameraAsync(options);
      }

      if (!result.canceled) {
        const source = { uri: result.assets[0].uri };
        setProfileImage(source);
        console.log("Image set successfully:", source);
      }
    } catch (error) {
      console.error("Error selecting image:", error);
      Alert.alert("Error", "Failed to select image");
    }
  };

  const fetchProfileImage = async () => {
    try {
      console.log("Fetching profile image for username:", username);
      const response = await fetch(
        `http://192.168.0.106:3000/customer/profile/${encodeURIComponent(
          username
        )}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Profile data received:", data);

      if (data.success && data.profile_image) {
        setProfileImage({
          uri: `data:image/jpeg;base64,${data.profile_image}`,
        });
      }
    } catch (error) {
      console.error("Error fetching profile image:", error);
      Alert.alert("Error", "Failed to fetch profile image. Please try again.");
    }
  };

  useEffect(() => {
    if (username) {
      fetchProfileImage();
    }
  }, [username]);

  const saveProfile = async () => {
    try {
      setIsLoading(true);
      console.log("Starting profile update...");

      // Create FormData object
      const formData = new FormData();
      formData.append("username", username);

      if (password) {
        formData.append("password", password);
      }

      // Handle image
      if (profileImage && profileImage.uri) {
        const uriParts = profileImage.uri.split(".");
        const fileType = uriParts[uriParts.length - 1];

        formData.append("profileImage", {
          uri: profileImage.uri,
          name: `profile.${fileType}`,
          type: `image/${fileType}`,
        });
      }

      console.log("Sending request with formData:", formData);

      const response = await fetch(
        "http://192.168.0.106:3000/customer/profile/update",
        {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const data = await response.json();
      console.log("Profile update response:", data);

      if (data.success) {
        Alert.alert("Success", "Profile updated successfully", [
          {
            text: "OK",
            onPress: () => {
              setShowEditProfile(false);
              fetchProfileImage(); // Refresh the profile image
            },
          },
        ]);
      } else {
        Alert.alert("Error", data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile details:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewOrders = () => {
    setShowOrdersModal(true);
    fetchOrders();
  };

  const fetchOrders = async () => {
    try {
      const username = await AsyncStorage.getItem("username");
      if (!username) {
        Alert.alert("Error", "User not found");
        return;
      }

      const response = await fetch(
        `http://192.168.0.106:3000/orders/${username}`
      );
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
      } else {
        Alert.alert("Error", data.message || "Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      Alert.alert("Error", "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>Order #{item.order_id}</Text>
        <Text
          style={[
            styles.orderStatus,
            {
              color:
                item.status === "pending"
                  ? "#FFA500"
                  : item.status === "completed"
                  ? "#008000"
                  : "#FF0000",
            },
          ]}
        >
          {item.status.toUpperCase()}
        </Text>
      </View>

      <Text style={styles.orderDate}>
        Ordered on: {formatDate(item.order_date)}
      </Text>

      <View style={styles.itemsContainer}>
        {item.items.map((orderItem, index) => (
          <View key={index} style={styles.orderItem}>
            <Text style={styles.itemName}>{orderItem.item_name}</Text>
            <View style={styles.itemDetails}>
              <Text style={styles.quantity}>x{orderItem.quantity}</Text>
              <Text style={styles.price}>₱{orderItem.price}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>Total Amount: ₱{item.total_price}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Profile</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Image
            source={require("./assets/icons8-back-30.png")}
            style={styles.backIcon}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.centerContent}>
        <View style={styles.iconContainer}>
          <TouchableOpacity
            onPress={handleViewOrders}
            style={styles.iconWrapper}
          >
            <Image
              source={require("./assets/icons8-bag-30.png")}
              style={styles.icon}
            />
            <Text style={styles.iconText}>Orders</Text>
          </TouchableOpacity>
          {/* <View style={styles.iconWrapper}>
            <Image
              source={require("./assets/icons8-food-basket-30.png")}
              style={styles.icon}
            />
            <Text style={styles.iconText}>Basket</Text>
          </View> */}
          <View style={styles.iconWrapper}>
            <Image
              source={require("./assets/icons8-star-30.png")}
              style={styles.icon}
            />
            <Text style={styles.iconText}>Favorites</Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {showEditProfile ? (
            <View>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>

              <View style={styles.profilePhotoContainer}>
                <Image
                  source={profileImage || require("./assets/placeholder.png")}
                  style={styles.profilePhoto}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => selectImage(true)}
                >
                  <Text style={styles.uploadButtonText}>
                    {profileImage ? "Change Photo" : "Upload Photo"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter username"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor="#666"
                  secureTextEntry={true}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, isLoading && styles.disabledButton]}
                disabled={isLoading}
                onPress={saveProfile}
              >
                <Text style={styles.saveButtonText}>Save Profile</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.profilePhotoContainer}>
                <Image
                  source={profileImage || require("./assets/placeholder.png")}
                  style={styles.profilePhoto}
                  resizeMode="cover"
                />
                <Text style={styles.profileName}>{username}</Text>
              </View>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleAccountSettings}
              >
                <Text style={styles.menuItemText}>Account Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <Text style={styles.menuItemText}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Modal
          visible={showOrdersModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowOrdersModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>My Orders</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowOrdersModal(false)}
                >
                  <Image
                    source={require("./assets/icons8-close-30.png")}
                    style={styles.closeIcon}
                  />
                </TouchableOpacity>
              </View>

              {loading ? (
                <ActivityIndicator size="large" color="#800000" />
              ) : orders.length > 0 ? (
                <FlatList
                  data={orders}
                  renderItem={renderOrderItem}
                  keyExtractor={(item) => item.order_id.toString()}
                  contentContainerStyle={styles.ordersList}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No orders found</Text>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D9D9D9",
  },
  header: {
    paddingTop: 38,
    padding: 20,
    backgroundColor: "#800000",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#800000",
    padding: 20,
    marginBottom: 20,
    borderRadius: 10,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconWrapper: {
    alignItems: "center",
  },
  icon: {
    width: 40,
    height: 40,
    marginBottom: 5,
  },
  iconText: {
    fontSize: 12,
    color: "#fff",
  },
  menuContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  menuItemText: {
    fontSize: 18,
    color: "#800000",
  },
  backButton: {
    padding: 5,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: "#fff",
  },
  profilePhotoContainer: {
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 20,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#800000",
    backgroundColor: "#fff",
    marginBottom: 15,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#800000",
    marginTop: 5,
  },
  uploadButton: {
    backgroundColor: "#800000",
    padding: 10,
    borderRadius: 5,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 5,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#800000",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.7,
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  roundProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  usernameText: {
    fontSize: 18,
    color: "#333",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    height: "90%",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#800000",
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#800000",
  },
  ordersList: {
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#800000",
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: "bold",
  },
  orderDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  itemsContainer: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  itemName: {
    fontSize: 16,
    flex: 1,
  },
  itemDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantity: {
    fontSize: 16,
    color: "#666",
    marginRight: 10,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
  },
  totalContainer: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
    marginTop: 10,
    alignItems: "flex-end",
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#800000",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#800000",
  },
  closeIcon: {
    width: 24,
    height: 24,
    tintColor: "#800000",
  },
});

export default Profile;
