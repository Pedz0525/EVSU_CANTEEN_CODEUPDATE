import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  Button,
  TextInput,
  Alert,
} from "react-native";
import { useBasket } from "./BasketContext";
import FloatingBasket from "./FloatingBasket";
import { useNavigation } from "@react-navigation/native";
import { API_URL } from "./config";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function StoreProduct({ route }) {
  const navigation = useNavigation();
  const { storeName, storeLocation } = route.params;
  const [activeTab, setActiveTab] = useState("PRODUCTS");
  const [products, setProducts] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const { addToBasket, basket } = useBasket();
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showFavoriteModal, setShowFavoriteModal] = useState(false);
  const [selectedFavoriteItem, setSelectedFavoriteItem] = useState(null);
  const [showFavoriteConfirmModal, setShowFavoriteConfirmModal] =
    useState(false);

  useEffect(() => {
    if (activeTab === "PRODUCTS") {
      const fetchProducts = async () => {
        try {
          const response = await fetch(
            `${API_URL}/items/${encodeURIComponent(storeName)}`
          );
          const data = await response.json();

          if (data.success) {
            // Log the first product to verify the structure
            if (data.products.length > 0) {
              console.log("Sample product:", {
                item_name: data.products[0].item_name,
                Price: data.products[0].Price,
                stall_name: data.products[0].stall_name || storeName,
              });
            }
            setProducts(
              data.products.map((product) => ({
                ...product,
                vendor_id: product.vendor_id,
                stall_name: product.stall_name || storeName,
              }))
            );
          } else {
            console.error("Failed to fetch products:", data.message);
          }
        } catch (error) {
          console.error("Error fetching items:", error);
        }
      };

      fetchProducts();
    }
  }, [activeTab, storeName]);

  const fetchCategoryProducts = async (category) => {
    try {
      console.log("Current store details:", {
        storeName,
        storeLocation,
        category,
      });

      const encodedStoreName = encodeURIComponent(storeLocation);
      const encodedCategory = encodeURIComponent(category);

      console.log(
        "Making request to:",
        `${API_URL}/categories/${encodedStoreName}?category=${encodedCategory}`
      );

      const response = await fetch(
        `${API_URL}/categories/${encodedStoreName}?category=${encodedCategory}`
      );

      const data = await response.json();
      console.log("Category API Response:", data);

      if (data.success) {
        setCategoryProducts(data.products);
        setModalVisible(true);
      } else {
        console.error("Failed to fetch category products:", data.message);
        Alert.alert(
          "Error",
          `Failed to fetch ${category} for ${storeLocation}: ${data.message}`
        );
        setCategoryProducts([]);
        setModalVisible(true);
      }
    } catch (error) {
      console.error("Error fetching category products:", error);
      Alert.alert(
        "Error",
        `Failed to fetch ${category} products: ${error.message}`
      );
    }
  };

  const incrementQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToBasket = (product) => {
    console.log("Attempting to add product with status:", product.status); // Debug log

    if (product.status === "Out of Stock") {
      Alert.alert("Out of Stock", "This item is currently being restocked.");
      return;
    }

    setSelectedProduct(product);
    setQuantity(1);
    setShowQuantityModal(true);
  };

  const confirmAddToBasket = () => {
    if (!selectedProduct || selectedProduct.status === "Out of Stock") {
      Alert.alert("Out of Stock", "This item is currently being restocked.");
      setShowQuantityModal(false);
      return;
    }

    const itemWithQuantity = {
      id: selectedProduct.item_id || String(Date.now()),
      item_name: selectedProduct.item_name,
      Price: selectedProduct.Price,
      item_image: selectedProduct.item_image,
      quantity: quantity,
      stall_name: selectedProduct.stall_name || storeName,
      Category: selectedProduct.Category,
      status: selectedProduct.status,
      vendor_id: selectedProduct.vendor_id, // Ensure this is defined
    };

    console.log("Adding to basket:", itemWithQuantity); // Check if vendor_id is included
    addToBasket(itemWithQuantity);
    setShowQuantityModal(false);
    setQuantity(1);
    setSelectedProduct(null);
    Alert.alert("Success", "Item added to basket!");
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleAddToFavorites = (item) => {
    setSelectedFavoriteItem({
      ...item,
      vendor_id: item.vendor_id,
      item_name: item.item_name,
    });
    setShowFavoriteConfirmModal(true);
  };

  const confirmAddToFavorites = async () => {
    try {
      const username = await AsyncStorage.getItem("username");
      if (!username) {
        Alert.alert("Error", "Please login first");
        return;
      }

      const favoriteData = {
        customer_id: username,
        vendor_id: selectedFavoriteItem.vendor_id,
        item_name: selectedFavoriteItem.item_name,
      };

      console.log(
        "Sending favorite data:",
        JSON.stringify(favoriteData, null, 2)
      );

      const response = await fetch(`${API_URL}/favorites/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(favoriteData),
      });

      const result = await response.json();
      console.log("Server response:", result);

      if (result.success) {
        Alert.alert("Success", "Item added to favorites!");
      } else {
        // Check if the error is because item is already in favorites
        if (result.message === "Item is already in favorites") {
          Alert.alert("Info", "This item is already in your favorites!");
        } else {
          throw new Error(result.message || "Failed to add to favorites");
        }
      }
    } catch (error) {
      console.error("Favorite submission error:", error);
      Alert.alert(
        "Error",
        error.message || "An error occurred while adding to favorites."
      );
    } finally {
      setShowFavoriteConfirmModal(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.storeName}>{storeName}</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Image
            source={require("./assets/icons8-back-30.png")}
            style={styles.backIcon}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.subHeader}>
        <Text style={styles.storeLocation}>{storeLocation}</Text>
      </View>

      {/* Modified navigation bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[
            styles.navItem,
            activeTab === "PRODUCTS" && styles.activeNavItem,
          ]}
          onPress={() => setActiveTab("PRODUCTS")}
        >
          <Text
            style={[
              styles.navText,
              activeTab === "PRODUCTS" && styles.activeNavText,
            ]}
          >
            PRODUCTS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.navItem,
            activeTab === "CATEGORIES" && styles.activeNavItem,
          ]}
          onPress={() => setActiveTab("CATEGORIES")}
        >
          <Text
            style={[
              styles.navText,
              activeTab === "CATEGORIES" && styles.activeNavText,
            ]}
          >
            CATEGORIES
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content based on active tab */}
      <View style={styles.content}>
        {activeTab === "PRODUCTS" && (
          <ScrollView contentContainerStyle={styles.productsContainer}>
            <View style={styles.productsGrid}>
              {products.map((product, index) => (
                <View key={index} style={styles.product}>
                  <Image
                    source={{
                      uri: product.item_image,
                    }}
                    style={styles.productImage}
                  />
                  <TouchableOpacity
                    style={styles.heartIconButton}
                    onPress={() => handleAddToFavorites(product)}
                  >
                    <Image
                      source={require("./assets/red_heart.png")}
                      style={styles.heartIcon}
                    />
                  </TouchableOpacity>
                  <Text style={styles.productName}>{product.item_name}</Text>
                  <Text style={styles.productPrice}>₱{product.Price}</Text>
                  <Text style={styles.stallName}>{product.stall_name}</Text>
                  {product.status === "Out of Stock" && (
                    <Text style={styles.outOfStockText}>Out of Stock</Text>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.basketButton,
                      product.status === "Out of Stock" &&
                        styles.basketButtonDisabled,
                    ]}
                    onPress={() => handleAddToBasket(product)}
                    disabled={product.status === "Out of Stock"}
                  >
                    <Text
                      style={[
                        styles.basketButtonText,
                        product.status === "Out of Stock" &&
                          styles.basketButtonTextDisabled,
                      ]}
                    >
                      {product.status === "Out of Stock"
                        ? "Out of Stock"
                        : "Add to Basket"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
        {activeTab === "CATEGORIES" && (
          <ScrollView contentContainerStyle={styles.categoriesContainer}>
            <TouchableOpacity
              style={styles.category}
              onPress={() => {
                console.log("Selected Category: Dishes");
                console.log("Current Store:", storeLocation);
                console.log("Store Type:", typeof storeLocation);
                fetchCategoryProducts("Dishes");
              }}
            >
              <Image
                source={require("./assets/Dishes.jpg")}
                style={styles.categoryImage}
              />
              <Text style={styles.categoryText}>Dishes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.category}
              onPress={() => {
                console.log("Selected Category: Beverages");
                console.log("Selected Store:", storeName);
                fetchCategoryProducts("Beverages");
              }}
            >
              <Image
                source={require("./assets/Drinks.jpg")}
                style={styles.categoryImage}
              />
              <Text style={styles.categoryText}>Beverages</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.category}
              onPress={() => {
                console.log("Selected Category: Snacks");
                console.log("Current Store:", storeName);
                console.log("Store Type:", typeof storeName);
                fetchCategoryProducts("Snacks");
              }}
            >
              <Image
                source={require("./assets/Snacks.jpg")}
                style={styles.categoryImage}
              />
              <Text style={styles.categoryText}>Snacks</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* Modal for displaying category products */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {storeName} -{" "}
              {categoryProducts.length > 0
                ? categoryProducts[0].Category
                : "No Products"}
            </Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setModalVisible(false)}
            >
              <Image
                source={require("./assets/icons8-back-30.png")}
                style={styles.backIcon}
              />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.productsContainer}>
            {categoryProducts.length > 0 ? (
              categoryProducts.map((product, index) => (
                <View key={index} style={styles.product}>
                  <Image
                    source={{ uri: product.item_image }}
                    style={styles.productImage}
                  />
                  <TouchableOpacity
                    style={styles.heartIconButton}
                    onPress={() => handleAddToFavorites(product)}
                  >
                    <Image
                      source={require("./assets/red_heart.png")}
                      style={styles.heartIcon}
                    />
                  </TouchableOpacity>
                  <Text style={styles.productName}>{product.item_name}</Text>
                  <Text style={styles.productPrice}>₱{product.Price}</Text>
                  <Text style={styles.categoryText}>{product.Category}</Text>
                  {product.status === "Out of Stock" && (
                    <Text style={styles.outOfStockText}>Out of Stock</Text>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.basketButton,
                      product.status === "Out of Stock" &&
                        styles.basketButtonDisabled,
                    ]}
                    onPress={() => {
                      if (product.status === "Out of Stock") {
                        Alert.alert(
                          "Out of Stock",
                          "This item is currently being restocked."
                        );
                        return;
                      }
                      setSelectedProduct(product);
                      setShowQuantityModal(true);
                    }}
                    disabled={product.status === "Out of Stock"}
                  >
                    <Text
                      style={[
                        styles.basketButtonText,
                        product.status === "Out of Stock" &&
                          styles.basketButtonTextDisabled,
                      ]}
                    >
                      {product.status === "Out of Stock"
                        ? "Out of Stock"
                        : "Add to Basket"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.noProductsContainer}>
                <Text style={styles.noProductsText}>
                  No products found for {storeName} in this category
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Quantity Modal */}
      {showQuantityModal && (
        <Modal
          visible={showQuantityModal}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Quantity</Text>

              <View style={styles.quantitySelector}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => quantity > 1 && setQuantity(quantity - 1)}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>

                <Text style={styles.quantityText}>{quantity}</Text>

                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(quantity + 1)}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowQuantityModal(false);
                    setQuantity(1);
                    setSelectedProduct(null);
                  }}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.addButton]}
                  onPress={confirmAddToBasket}
                >
                  <Text style={styles.buttonText}>Add to Basket</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Add the Favorite Modal */}
      <Modal
        visible={showFavoriteConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFavoriteConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <Text style={styles.confirmModalTitle}>Add to Favorites?</Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={[styles.confirmModalButton, styles.noButton]}
                onPress={() => setShowFavoriteConfirmModal(false)}
              >
                <Text style={styles.confirmModalButtonText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmModalButton, styles.yesButton]}
                onPress={confirmAddToFavorites}
              >
                <Text style={styles.confirmModalButtonText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add FloatingBasket at the end */}
      <FloatingBasket />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    position: "relative",
  },
  header: {
    paddingTop: 45,
    padding: 16,
    backgroundColor: "#800000",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  storeName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
  },
  subHeader: {
    backgroundColor: "#800000",
    padding: 8,
    paddingTop: 0,
  },
  storeLocation: {
    fontSize: 16,
    color: "#fff",
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  navItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  navText: {
    fontSize: 16,
    color: "#333",
  },
  activeNavItem: {
    borderBottomWidth: 2,
    borderBottomColor: "#ff4c4c",
  },
  activeNavText: {
    color: "#ff4c4c",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  productsContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  productsGrid: {
    width: "100%",
    alignItems: "center",
  },
  product: {
    width: "100%",
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: "center",
  },
  productImage: {
    width: 300,
    height: 150,
    borderRadius: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
  },
  productPrice: {
    fontSize: 14,
    color: "#333",
  },
  categoriesContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  category: {
    marginBottom: 20,
    alignItems: "center",
  },
  categoryImage: {
    width: 300,
    height: 120,
    borderRadius: 10,
  },
  categoryText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  modalHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#800000",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    flex: 1, // This allows the title to wrap if needed
    marginRight: 10, // Adds some space between title and button
  },
  noProductsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noProductsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  categoryText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  productInfo: {
    marginBottom: 15,
  },
  productNameModal: {
    fontSize: 16,
    fontWeight: "bold",
  },
  productPriceModal: {
    fontSize: 14,
    color: "#800000",
    marginTop: 5,
  },
  quantitySelector: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  quantityButton: {
    backgroundColor: "#800000",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 15,
  },
  quantityButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  quantityText: {
    fontSize: 24,
    fontWeight: "bold",
    minWidth: 40,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    width: "45%",
  },
  cancelButton: {
    backgroundColor: "#666",
  },
  addButton: {
    backgroundColor: "#800000",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
  basketButton: {
    backgroundColor: "#800000",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    width: "100%",
  },
  basketButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
  backButton: {
    padding: 5,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: "#fff", // Makes the icon white to match header text
  },
  heartIconButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 15,
    padding: 5,
  },
  heartIcon: {
    width: 24,
    height: 24,
    tintColor: "#ff0000",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmModalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#800000",
  },
  confirmModalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  confirmModalButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  noButton: {
    backgroundColor: "#ccc",
  },
  yesButton: {
    backgroundColor: "#800000",
  },
  confirmModalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  outOfStockText: {
    color: "#FF0000",
    fontSize: 12,
    fontWeight: "bold",
    marginVertical: 4,
  },
  basketButtonDisabled: {
    backgroundColor: "#CCCCCC",
    opacity: 0.7,
  },
  basketButtonTextDisabled: {
    color: "#666666",
  },
});
