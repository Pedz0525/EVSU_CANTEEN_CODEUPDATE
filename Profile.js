import React, { useState, useEffect, useContext, useCallback } from "react";
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
  Platform,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";
import { API_URL } from "./config";
import { useBasket } from "./BasketContext";
import { BasketContext } from "./BasketContext";
import axios from "axios";

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
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const { addToBasket } = useBasket();
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { clearBasket } = useContext(BasketContext);
  const [name, setName] = useState("");
  const [displayUsername, setDisplayUsername] = useState(initialUsername);
  const [initialName, setInitialName] = useState("");
  const [isProfileImageChanged, setIsProfileImageChanged] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);

  const handleAccountSettings = () => {
    setShowEditProfile(true);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleLogout = async () => {
    try {
      // Clear the basket
      clearBasket();

      // Clear AsyncStorage 
      await AsyncStorage.multiRemove([
        "username",
        "userType",
        // Add any other keys you want to clear
      ]);

      // Navigate to Login
      navigation.reset({
        index: 0,
        routes: [{ name: "UserTypeSelection" }],
      });
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to logout");
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
        setIsProfileImageChanged(true);
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
        `${API_URL}/customer/profile/${encodeURIComponent(username)}`
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

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/customer/profile/${encodeURIComponent(username)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setName(data.name || "");
        setInitialName(data.name || "");
        setDisplayUsername(data.username || initialUsername);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  useEffect(() => {
    if (username) {
      fetchUserProfile();
      fetchProfileImage();
    }
  }, [username]);

  const saveProfile = async () => {
    try {
      setIsLoading(true);
      console.log("Starting profile update...");

      if (isProfileImageChanged && profileImage) {
        const formData = new FormData();
        formData.append("username", username);

        // Create file object from image uri
        const uriParts = profileImage.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];

        formData.append("profileImage", {
          uri: profileImage.uri,
          type: `image/${fileType}`,
          name: `profile.${fileType}`,
        });

        const response = await fetch(`${API_URL}/customer/profile/update-photo`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          Alert.alert("Success", "Profile photo updated successfully");
          setIsProfileImageChanged(false);
        } else {
          Alert.alert("Error", data.message || "Failed to update profile photo");
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
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

      const response = await fetch(`${API_URL}/orders/${username}`);
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

  const renderOrderItem = ({ item }) => {
    if (item.status === "Order Received") {
      return null;
    }

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>Order #{item.order_id}</Text>
          <Text
            style={[
              styles.orderStatus,
              {
                color:
                  item.status.toLowerCase() === "pending"
                    ? "#666666"
                    : item.status.toLowerCase() === "confirmed"
                    ? "#008000"
                    : "#FF0000",
              },
            ]}
          >
            {item.status}
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
          <Text style={styles.totalText}>
            Total Amount: ₱{item.total_price.toFixed(2)}
          </Text>

          <View style={styles.totalRow}>
            <View style={styles.spacer} />
            {item.status.toLowerCase() === "pending" && (
              <TouchableOpacity
                style={styles.orderCancelButton}
                onPress={() => handleCancelOrder(item.order_id)}
              >
                <Text style={styles.orderCancelButtonText}>Cancel Order</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const fetchFavorites = async (page = 1) => {
    try {
      setLoadingFavorites(true);
      const username = await AsyncStorage.getItem("username");
      if (!username) {
        console.error("No username found");
        return;
      }

      const response = await fetch(
        `${API_URL}/favorites/${username}?page=${page}`
      );
      const data = await response.json();

      if (data.success) {
        if (page === 1) {
          setFavorites(data.favorites);
        } else {
          setFavorites((prev) => [...prev, ...data.favorites]);
        }
        setHasMore(data.pagination.hasMore);
        setCurrentPage(data.pagination.currentPage);
      } else {
        Alert.alert("Error", data.message || "Failed to fetch favorites");
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
      Alert.alert("Error", "Failed to fetch favorites");
    } finally {
      setLoadingFavorites(false);
      setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchFavorites(currentPage + 1);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    fetchFavorites(1);
  };

  const handleAddToBasket = (item) => {
    if (item.status === "Out of Stock") {
      Alert.alert("Out of Stock", "This item is currently being restocked.");
      return;
    }

    setSelectedItem({
      id: item.item_id,
      item_name: item.item_name,
      Price: item.Price,
      item_image: item.item_image,
      vendor_id: item.vendor_id,
      stall_name: item.stall_name,
      Category: item.Category,
      status: item.status,
    });
    setQuantity("1"); // Reset quantity when opening modal
    setShowQuantityModal(true);
  };

  const confirmAddToBasket = () => {
    if (selectedItem) {
      const basketItem = {
        id: selectedItem.id,
        item_name: selectedItem.item_name,
        Price: selectedItem.Price,
        item_image: selectedItem.item_image,
        quantity: parseInt(quantity),
        vendor_id: selectedItem.vendor_id,
        stall_name: selectedItem.stall_name,
        Category: selectedItem.Category,
        subtotal: selectedItem.Price * parseInt(quantity),
      };

      console.log("Adding to basket:", basketItem);
      addToBasket(basketItem);
      setShowQuantityModal(false);
      setSelectedItem(null);
      setQuantity("1");
      Alert.alert("Success", "Item added to basket!");
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      // Show confirmation dialog
      Alert.alert(
        "Cancel Order",
        "Are you sure you want to cancel this order?",
        [
          {
            text: "No",
            style: "cancel",
          },
          {
            text: "Yes",
            onPress: async () => {
              const response = await fetch(
                `${API_URL}/orders/cancel/${orderId}`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );

              const data = await response.json();

              if (data.success) {
                Alert.alert("Success", "Order cancelled successfully");
                // Refresh orders list
                fetchOrders();
              } else {
                Alert.alert("Error", data.message || "Failed to cancel order");
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error cancelling order:", error);
      Alert.alert("Error", "Failed to cancel order");
    }
  };

  const removeFavorite = async (favoriteItemId) => {
    Alert.alert(
      "Remove Favorite",
      "Are you sure you want to remove this item from favorites?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(
                `${API_URL}/favorites/${favoriteItemId}`,
                {
                  method: "DELETE",
                }
              );
              const data = await response.json();

              if (data.success) {
                setFavorites((prevFavorites) =>
                  prevFavorites.filter(
                    (fav) => fav.favorite_item_id !== favoriteItemId
                  )
                );
                Alert.alert("Success", "Favorite removed successfully");
              } else {
                Alert.alert(
                  "Error",
                  data.message || "Failed to remove favorite"
                );
              }
            } catch (error) {
              console.error("Error removing favorite:", error);
              Alert.alert("Error", "An error occurred while removing favorite");
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.favoriteCard}>
      <Image
        source={
          item.item_image
            ? { uri: item.item_image }
            : require("./assets/placeholder.png")
        }
        style={styles.favoriteImage}
        defaultSource={require("./assets/placeholder.png")}
      />
      <View style={styles.favoriteDetails}>
        <View style={styles.favoriteItemHeader}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.item_name}
          </Text>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeFavorite(item.favorite_item_id)}
          >
            <Text style={styles.removeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.vendorName} numberOfLines={1}>
          Vendor: {item.stall_name}
        </Text>
        <Text style={styles.price}>₱{item.Price}</Text>

        {item.status === "Out of Stock" && (
          <Text style={styles.outOfStockText}>Out of Stock</Text>
        )}

        <TouchableOpacity
          style={[
            styles.addToBasketButton,
            item.status === "Out of Stock" && styles.addToBasketButtonDisabled,
          ]}
          onPress={() => handleAddToBasket(item)}
          disabled={item.status === "Out of Stock"}
        >
          <Text
            style={[
              styles.addToBasketButtonText,
              item.status === "Out of Stock" &&
                styles.addToBasketButtonTextDisabled,
            ]}
          >
            {item.status === "Out of Stock" ? "Out of Stock" : "Add to Basket"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleUpdateUsername = async () => {
    try {
      setIsLoading(true);
      console.log("Updating username from:", username, "to:", newUsername);

      const response = await fetch(`${API_URL}/customer/profile/update-username`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentUsername: username,
          newUsername: newUsername
        })
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert("Success", "Username updated successfully");
        // Update the stored username in AsyncStorage
        await AsyncStorage.setItem("username", newUsername);
        setUsername(newUsername);
        setDisplayUsername(newUsername);
      } else {
        Alert.alert("Error", data.message || "Failed to update username");
      }
    } catch (error) {
      console.error("Error updating username:", error);
      Alert.alert("Error", "Failed to update username. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    try {
      setIsLoading(true);
      console.log("Updating password for user:", username);

      if (!password || password.trim() === "") {
        Alert.alert("Error", "Please enter a new password");
        return;
      }

      const response = await fetch(`${API_URL}/customer/profile/update-password`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username,
          password: password
        })
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert("Success", "Password updated successfully");
        setPassword(""); // Clear the password field
      } else {
        Alert.alert("Error", data.message || "Failed to update password");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      Alert.alert("Error", "Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
          <TouchableOpacity
            style={styles.iconWrapper}
            onPress={() => {
              setShowFavoritesModal(true);
              fetchFavorites();
            }}
          >
            <Image
              source={require("./assets/icons8-star-30.png")}
              style={styles.icon}
            />
            <Text style={styles.iconText}>Favorites</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuContainer}>
          {showEditProfile ? (
            <ScrollView showsVerticalScrollIndicator={false}>
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
                  <Text style={styles.inputLabel}>Name</Text>
                  <TextInput
                    style={styles.input}
                    value={displayUsername}
                    editable={false}
                    placeholder="Username"
                    placeholderTextColor="#666"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Username</Text>
                  <TextInput
                    style={styles.input}
                    value={newUsername}
                    onChangeText={setNewUsername}
                    placeholder="Enter new username"
                    placeholderTextColor="#666"
                  />
                  <TouchableOpacity
                    style={[styles.saveButton, isLoading && styles.disabledButton]}
                    onPress={handleUpdateUsername}
                    disabled={isLoading}
                  >
                    <Text style={styles.saveButtonText}>
                      {isLoading ? "Updating..." : "Update Username"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>New Password</Text>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter new password"
                    placeholderTextColor="#666"
                    secureTextEntry={true}
                  />
                  <TouchableOpacity
                    style={[styles.saveButton, isLoading && styles.disabledButton]}
                    onPress={handleUpdatePassword}
                    disabled={isLoading}
                  >
                    <Text style={styles.saveButtonText}>
                      {isLoading ? "Updating..." : "Update Password"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.saveButton, isLoading && styles.disabledButton]}
                  disabled={isLoading}
                  onPress={saveProfile}
                >
                  <Text style={styles.saveButtonText}>
                    {isLoading ? "Saving..." : 
                     isProfileImageChanged ? "Save Photo" :
                     password ? "Save Password" :
                     name !== initialName ? "Save Name" :
                     "Save Profile"}
                  </Text>
                </TouchableOpacity>

                <View style={{ height: 20 }} />
              </View>
            </ScrollView>
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
                  keyExtractor={(item, index) => `${item.order_id}-${index}`}
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

        <Modal
          visible={showFavoritesModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowFavoritesModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>My Favorites</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    console.log("Close button pressed");
                    setShowFavoritesModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Image
                    source={require("./assets/icons8-close-30.png")}
                    style={styles.closeIcon}
                  />
                </TouchableOpacity>
              </View>

              {loadingFavorites ? (
                <ActivityIndicator size="large" color="#800000" />
              ) : favorites.length > 0 ? (
                <>
                  <FlatList
                    data={favorites}
                    keyExtractor={(item) => item.favorite_item_id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.favoritesList}
                    ListEmptyComponent={() => (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No favorites found</Text>
                      </View>
                    )}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    ListFooterComponent={() =>
                      loadingFavorites && hasMore ? (
                        <ActivityIndicator
                          size="large"
                          color="#800000"
                          style={styles.loader}
                        />
                      ) : null
                    }
                  />

                  {/* Quantity Modal */}
                  <Modal
                    visible={showQuantityModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowQuantityModal(false)}
                  >
                    <View style={styles.modalOverlay}>
                      <View style={styles.quantityModalContent}>
                        <Text style={styles.quantityModalTitle}>
                          Select Quantity
                        </Text>

                        <View style={styles.quantityContainer}>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => {
                              const newQuantity = Math.max(
                                1,
                                parseInt(quantity) - 1
                              );
                              setQuantity(newQuantity.toString());
                            }}
                          >
                            <Text style={styles.quantityButtonText}>-</Text>
                          </TouchableOpacity>

                          <TextInput
                            style={styles.quantityInput}
                            value={quantity}
                            onChangeText={(text) => {
                              const newQuantity = text.replace(/[^0-9]/g, "");
                              if (
                                newQuantity === "" ||
                                parseInt(newQuantity) > 0
                              ) {
                                setQuantity(newQuantity);
                              }
                            }}
                            keyboardType="numeric"
                            maxLength={2}
                          />

                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => {
                              const newQuantity = parseInt(quantity) + 1;
                              setQuantity(newQuantity.toString());
                            }}
                          >
                            <Text style={styles.quantityButtonText}>+</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.modalButtons}>
                          <TouchableOpacity
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={() => {
                              setShowQuantityModal(false);
                              setSelectedItem(null);
                              setQuantity("1");
                            }}
                          >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.modalButton, styles.confirmButton]}
                            onPress={confirmAddToBasket}
                          >
                            <Text style={styles.confirmButtonText}>
                              Add to Basket
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </Modal>
                </>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No favorites found</Text>
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
    maxHeight: '80%',
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
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
    fontWeight: "bold",
  },
  input: {
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: 'white',
    marginTop: 50, // Give some space at the top
    marginBottom: 20, // Space at the bottom
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    zIndex: 1,
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  profilePhotoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  uploadButton: {
    backgroundColor: '#800000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#800000',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
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
    shadowOffset: { width: 10, height: 2 },
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
    marginTop: 10,
    paddingTop: 10,
  },
  totalText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#800000",
    textAlign: "right",
    marginBottom: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  spacer: {
    flex: 1,
  },
  orderCancelButton: {
    backgroundColor: "#800000",
    padding: 10,
    alignSelf: "flex-end",
  },
  orderCancelButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
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
    backgroundColor: "#800000",
    padding: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  closeIcon: {
    width: 24,
    height: 24,
    tintColor: "#fff",
  },
  favoriteCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  favoriteImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
    backgroundColor: "#f0f0f0",
    resizeMode: "cover",
  },
  favoriteDetails: {
    flex: 1,
    justifyContent: "center",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    flex: 1,
  },
  vendorName: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#800000",
    marginBottom: 5,
  },
  favoritesList: {
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityModalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  quantityModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#800000",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  quantityButton: {
    backgroundColor: "#800000",
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  quantityButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: "#800000",
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 10,
    width: 50,
    textAlign: "center",
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#ccc",
  },
  confirmButton: {
    backgroundColor: "#800000",
  },
  cancelButtonText: {
    color: "#333",
    textAlign: "center",
    fontWeight: "bold",
  },
  confirmButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
  addToBasketButton: {
    backgroundColor: "#800000",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: "center",
  },
  addToBasketButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loader: {
    marginVertical: 20,
  },
  removeButton: {
    backgroundColor: "#FF0000",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  favoriteItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  outOfStockText: {
    color: "#FF0000",
    fontSize: 12,
    fontWeight: "bold",
    marginVertical: 4,
  },

  addToBasketButtonDisabled: {
    backgroundColor: "#CCCCCC",
    opacity: 0.7,
  },

  addToBasketButtonTextDisabled: {
    color: "#666666",
  },
});

export default Profile;
