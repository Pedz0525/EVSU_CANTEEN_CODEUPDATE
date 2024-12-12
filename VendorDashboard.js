import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

const VendorDashboard = ({ navigation }) => {
  const [showItems, setShowItems] = useState(true);
  const [products, setProducts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newItem, setNewItem] = useState({
    ItemName: "",
    Price: "",
    ImageItem: null,
  });
  const [connectionStatus, setConnectionStatus] = useState(
    "Checking connection..."
  );

  const checkConnection = async () => {
    try {
      console.log("Checking connection...");
      const response = await fetch("http://172.16.1.246:3000/status");
      const data = await response.json();
      console.log("Connection response:", data);
      setConnectionStatus("Connected to server ✅");
    } catch (error) {
      console.log("Connection error:", error);
      setConnectionStatus("Not connected to server ❌");
    }
  };
  useEffect(() => {
    fetchProducts();
    checkConnection();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("http://172.16.1.246:3000/products");
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
        console.log("Products fetched:", data.products);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setNewItem({ ...newItem, ImageItem: result.assets[0].uri });
      console.log("Image selected:", result.assets[0].uri);
    }
  };

  const handleSubmitItem = async () => {
    if (!newItem.ItemName || !newItem.Price || !newItem.ImageItem) {
      Alert.alert("Error", "Please fill in all fields including image");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("ItemName", newItem.ItemName);
      formData.append("Price", newItem.Price);

      // Get file extension
      const uriParts = newItem.ImageItem.split(".");
      const fileType = uriParts[uriParts.length - 1];

      console.log("Preparing image upload:", {
        uri: newItem.ImageItem,
        type: `image/${fileType}`,
        name: `photo.${fileType}`,
      });

      formData.append("ImageItem", {
        uri: newItem.ImageItem,
        type: `image/${fileType}`,
        name: `photo.${fileType}`,
      });

      // Change port to 3000 to match your server
      const response = await fetch("http://172.16.1.246:3000/products", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Server response:", data);

      if (data.success) {
        Alert.alert("Success", "Item added successfully");
        setModalVisible(false);
        setNewItem({ ItemName: "", Price: "", ImageItem: null });
        fetchProducts();
      } else {
        Alert.alert("Error", data.message || "Failed to add item");
      }
    } catch (error) {
      console.error("Error details:", error);
      Alert.alert(
        "Error",
        "Network error. Please check your server connection and try again."
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Vendor Dashboard</Text>
          <Text style={styles.connectionStatus}>{connectionStatus}</Text>
          <TouchableOpacity
            style={styles.userIcon}
            onPress={() => navigation.navigate("Profile")}
          >
            <Image
              source={require("./assets/user_icon.png")}
              style={styles.headerIcon}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor="#666"
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {showItems && (
          <View style={styles.scrollableContent}>
            {products.map((product, index) => (
              <View key={index} style={styles.productContainer}>
                {product.ImageItem ? (
                  <Image
                    source={{
                      uri: `data:image/jpeg;base64,${product.ImageItem}`,
                    }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                ) : (
                  <Image
                    source={require("./assets/placeholder.png")}
                    style={styles.image}
                    resizeMode="contain"
                  />
                )}
                <View style={styles.productDetails}>
                  <Text style={styles.productName}>{product.ItemName}</Text>
                  <Text style={styles.productPrice}>₱{product.Price}</Text>
                  <Text style={styles.storeName}>{product.StoreName}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Item Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Item</Text>

            <TextInput
              style={styles.input}
              placeholder="Item Name"
              value={newItem.ItemName}
              onChangeText={(text) =>
                setNewItem({ ...newItem, ItemName: text })
              }
            />

            <TextInput
              style={styles.input}
              placeholder="Price"
              value={newItem.Price}
              onChangeText={(text) => setNewItem({ ...newItem, Price: text })}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={pickImage}
            >
              <Text style={styles.imagePickerText}>
                {newItem.ImageItem ? "Change Image" : "Select Image"}
              </Text>
            </TouchableOpacity>

            {newItem.ImageItem && (
              <Image
                source={{ uri: newItem.ImageItem }}
                style={styles.previewImage}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setNewItem({ ItemName: "", Price: "", ImageItem: null });
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmitItem}
              >
                <Text style={styles.buttonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Footer with Add Item button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerIcon}
          onPress={() => setModalVisible(true)}
        >
          <Image
            source={require("./assets/store_icon.png")}
            style={styles.footerIconImage}
          />
          <Text style={styles.iconText}>Add Item</Text>
        </TouchableOpacity>
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
    backgroundColor: "#800000",
    padding: 16,
    paddingTop: 40, // Adjust for status bar
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  headerIcon: {
    width: 24,
    height: 24,
    tintColor: "white",
  },
  userIcon: {
    padding: 5,
  },
  searchContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 5,
  },
  searchInput: {
    height: 40,
    fontSize: 16,
  },
  content: {
    flexGrow: 1,
  },
  scrollableContent: {
    padding: 16,
    alignItems: "center",
  },
  productContainer: {
    width: "50%",
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 200,
    marginBottom: 10,
  },
  productDetails: {
    padding: 10,
    alignItems: "center",
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
  },
  productPrice: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
  },
  storeName: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 11,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  footerIcon: {
    padding: 10,
  },
  footerIconImage: {
    width: 26,
    height: 26,
  },
  iconText: {
    fontSize: 14,
    color: "#000",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#800000",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  imagePickerButton: {
    backgroundColor: "#800000",
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
  },
  imagePickerText: {
    color: "white",
    textAlign: "center",
  },
  previewImage: {
    width: 100,
    height: 100,
    marginBottom: 15,
    borderRadius: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  submitButton: {
    backgroundColor: "#800000",
  },
  cancelButton: {
    backgroundColor: "#666",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
  },
  connectionStatus: {
    color: "white",
    fontSize: 14,
  },
});

export default VendorDashboard;
