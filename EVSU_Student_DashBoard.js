import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Modal,
  Alert,
} from "react-native";
import { useBasket } from "./BasketContext";
import FloatingBasket from "./FloatingBasket";
import heartIcon from "./assets/red_heart.png";
import { API_URL } from "./config";
import AsyncStorage from "@react-native-async-storage/async-storage";

const EVSU_Student_DashBoard = ({ navigation, route }) => {
  const { username } = route.params;
  const [showItems, setShowItems] = useState(false);
  const [showStores, setShowStores] = useState(false);
  const [showProducts, setShowProducts] = useState(true);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [stores, setStores] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState(
    "Checking connection..."
  );
  const [products, setProducts] = useState([]);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [basket, setBasket] = useState([]);
  const [showBasketModal, setShowBasketModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const { addToBasket } = useBasket();
  const [quantity, setQuantity] = useState("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFavoriteItem, setSelectedFavoriteItem] = useState(null);
  const [showFavoriteModal, setShowFavoriteModal] = useState(false);

  const checkConnection = async () => {
    try {
      console.log("Checking connection...");
      const response = await fetch(`${API_URL}/status`);
      const data = await response.json();
      console.log("Connection response:", data);
      setConnectionStatus("Connected to server ✅");
    } catch (error) {
      console.log("Connection error:", error);
      setConnectionStatus("Not connected to server ❌");
    }
  };

  const fetchStores = async () => {
    try {
      console.log("Attempting to fetch stores...");

      const response = await fetch(`${API_URL}/vendors`);
      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Data received:", data);

      if (data.success) {
        // Verify the data structure
        console.log("First store:", data.stores[0]);
        setStores(data.stores);
        console.log("Stores set successfully");
      } else {
        console.error("Failed to fetch stores:", data.message);
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      console.log("Fetching items from server...");
      const response = await fetch(`${API_URL}/items`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Response is not JSON");
      }

      const data = await response.json();
      console.log("Data received:", data);

      if (data.success) {
        console.log("Items received:", data.products);
        setProducts(data.products);
      } else {
        console.error("Failed to fetch items:", data.message);
      }
    } catch (error) {
      console.error("Error details:", {
        message: error.message,
        type: error.name,
        stack: error.stack,
      });
    }
  };

  const handleSearch = async (query) => {
    try {
      const response = await fetch(`${API_URL}/search?query=${query}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        // Make sure each item has all required properties
        const processedResults = data.items.map(item => ({
          ...item,
          stall_name: item.stall_name || 'Unknown Stall' // Fallback value if stall_name is missing
        }));
        setSearchResults(processedResults);
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  useEffect(() => {
    checkConnection();
    fetchStores();
    fetchProducts();
  }, []);

  const handleSearchIconClick = () => {
    setShowItems(true);
    setShowStores(false);
    setShowProducts(false);
  };

  const handleStoreIconClick = () => {
    setShowItems(false);
    setShowStores(true);
    setShowProducts(false);
  };

  const handleHomeIconClick = () => {
    setShowItems(false);
    setShowStores(false);
    setShowProducts(true);
  };

  const handleUserIconClick = () => {
    navigation.navigate("Profile", { username });
  };

  const updateQuantity = (change) => {
    const currentQty = parseInt(quantity);
    const newQty = Math.max(1, currentQty + change);
    setQuantity(newQty.toString());
  };

  const handleAddToBasket = (product) => {
    if (product.status === "Out of Stock") {
      Alert.alert("Out of Stock", "This item is currently being restocked.");
      return;
    }

    // Set the quantity back to 1 when opening modal
    setQuantity("1");
    setSelectedProduct(product);
    setShowQuantityModal(true);
  };

  const computeTotalAmount = () => {
    return basket.reduce(
      (total, item) => total + item.Price * item.quantity,
      0
    );
  };

  const updateBasketItemQuantity = (index, change) => {
    setBasket((prevBasket) => {
      const updatedBasket = [...prevBasket];
      const newQuantity = updatedBasket[index].quantity + change;
      if (newQuantity > 0) {
        updatedBasket[index].quantity = newQuantity;
      }
      return updatedBasket;
    });
  };

  const removeBasketItem = (index) => {
    setBasket((prevBasket) => prevBasket.filter((_, i) => i !== index));
  };

  const handlePayment = () => {
    // Implement payment logic here
  };

  const insertFavorite = async (item) => {
    try {
      if (!username) {
        Alert.alert("Error", "Please login first");
        return;
      }

      const favoriteData = {
        customer_id: username,
        vendor_id: item.vendor_id,
        item_name: item.item_name,
      };

      const response = await fetch(`${API_URL}/favorites/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(favoriteData),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert("Success", "Item added to favorites!");
      } else if (result.message === "Item is already in favorites") {
        Alert.alert("Info", "This item is already in your favorites!");
      } else {
        throw new Error(result.message || "Failed to add to favorites");
      }
    } catch (error) {
      console.error("Favorite submission error:", error);
      Alert.alert(
        "Error",
        error.message || "An error occurred while adding to favorites."
      );
    } finally {
      setShowFavoriteModal(false);
    }
  };

  const confirmAddToBasket = () => {
    if (selectedProduct) {
      const basketItem = {
        ...selectedProduct,
        quantity: parseInt(quantity),
      };
      addToBasket(basketItem);
      setShowQuantityModal(false);
      setSelectedProduct(null);
      Alert.alert("Success", "Item added to basket!");
    }
  };

  const renderProductItem = (item, index) => (
    <View key={index} style={styles.productItem}>
      <Image
        source={{ uri: item.item_image }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productDetails}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.item_name}
        </Text>
        <Text style={styles.productPrice}>₱{item.Price}</Text>
        <Text style={styles.storeName} numberOfLines={1}>
          {item.stall_name || 'Unknown Stall'}
        </Text>
        {item.status === "Out of Stock" && (
          <Text style={styles.outOfStockText}>Out of Stock</Text>
        )}
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.heartIconButton}
          onPress={() => {
            setSelectedFavoriteItem(item);
            setShowFavoriteModal(true);
          }}
        >
          <Image
            source={require("./assets/red_heart.png")}
            style={styles.heartIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.basketButton,
            item.status === "Out of Stock" && styles.basketButtonDisabled,
          ]}
          onPress={() => handleAddToBasket(item)}
        >
          <Image
            source={require("./assets/icon_basket.png")}
            style={[
              styles.basketIcon,
              item.status === "Out of Stock" && styles.basketIconDisabled,
            ]}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.username}>{username}</Text>
          {/* <Text style={styles.connectionStatus}>{connectionStatus}</Text> */}
          <TouchableOpacity
            style={styles.basketIcon}
            onPress={() => navigation.navigate("Basket")}
          >
            {/* <Image
              source={require("./assets/basket_icon.png")}
              style={styles.basketImage}
            /> */}
            {/* <Text style={styles.basketCount}>{basket.length}</Text> */}
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.searchBar}
          placeholder="Search"
          onFocus={() => setShowItems(true)}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            if (text.length > 0) {
              handleSearch(text);
            } else {
              setSearchResults([]);
            }
          }}
        />
      </View>
      <View style={styles.fixedLogoSection}>
        <Image
          source={require("./assets/EvsuLOGO.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {showItems ? (
          <View style={styles.itemList}>
            {searchResults.map((item, index) => renderProductItem(item, index))}
          </View>
        ) : showStores ? (
          <View style={styles.storeList}>
            {Array.isArray(stores) && stores.length > 0 ? (
              stores.map((store, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.storeItem}
                  onPress={() =>
                    navigation.navigate("StoreProduct", {
                      storeName: store.name,
                      storeLocation: store.Stall_name,
                    })
                  }
                >
                  <View style={styles.storeImageWrapper}>
                    {store.profile_image ? (
                      <Image
                        source={{ uri: store.profile_image }}
                        style={styles.storeImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Image
                        source={require("./assets/placeholder.png")}
                        style={styles.storeImage}
                        resizeMode="contain"
                      />
                    )}
                  </View>
                  <Text style={styles.storeName}>{store.name}</Text>
                  <Text style={styles.storeOwner}>{store.Stall_name}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noDataText}>No stores available</Text>
            )}
          </View>
        ) : showProducts ? (
          <View style={styles.productList}>
            {products.map((product, index) =>
              renderProductItem(product, index)
            )}
          </View>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerIcon}
          onPress={handleHomeIconClick}
        >
          <Image
            source={require("./assets/home_icon.png")}
            style={styles.footerIconImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerIcon}
          onPress={handleStoreIconClick}
        >
          <Image
            source={require("./assets/store_icon.png")}
            style={styles.footerIconImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerIcon}
          onPress={handleSearchIconClick}
        >
          <Image
            source={require("./assets/search_iconbig.png")}
            style={styles.footerIconImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerIcon}
          onPress={handleUserIconClick}
        >
          <Image
            source={require("./assets/user_icon.png")}
            style={styles.footerIconImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={showFavoritesModal}
        onRequestClose={() => setShowFavoritesModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Store Options</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.popularButton}
                onPress={() => console.log("Popular clicked")}
              >
                <Text style={styles.buttonText}>Popular</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => console.log("Favorites clicked")}
              >
                <Text style={styles.buttonText}>Favorites</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowFavoritesModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {showQuantityModal && (
        <Modal
          visible={showQuantityModal}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.quantityModalContent}>
              <Text style={styles.quantityModalTitle}>Select Quantity</Text>

              <View style={styles.quantitySelector}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    const currentQty = parseInt(quantity);
                    if (currentQty > 1) {
                      setQuantity((currentQty - 1).toString());
                    }
                  }}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>

                <Text style={styles.quantityText}>{quantity}</Text>

                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    const currentQty = parseInt(quantity);
                    setQuantity((currentQty + 1).toString());
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
                    setQuantity("1");
                    setSelectedProduct(null);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={() => {
                    if (selectedProduct) {
                      const itemWithQuantity = {
                        ...selectedProduct,
                        quantity: parseInt(quantity),
                      };
                      addToBasket(itemWithQuantity);
                      setShowQuantityModal(false);
                      setQuantity("1");
                      setSelectedProduct(null);
                      Alert.alert("Success", "Item added to basket!");
                    }
                  }}
                >
                  <Text style={styles.confirmButtonText}>Add to Basket</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showBasketModal}
        onRequestClose={() => setShowBasketModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Your Basket</Text>
            <ScrollView style={styles.basketList}>
              {basket.map((item, index) => (
                <View key={index} style={styles.basketItem}>
                  <Text style={styles.itemText}>{item.ItemName}</Text>
                  <Text style={styles.itemText}>
                    ₱{item.Price} x {item.quantity}
                  </Text>
                  <View style={styles.basketItemControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateBasketItemQuantity(index, -1)}
                    >
                      <Text style={styles.buttonText}>-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateBasketItemQuantity(index, 1)}
                    >
                      <Text style={styles.buttonText}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeBasketItem(index)}
                    >
                      <Text style={styles.buttonText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
            <Text style={styles.totalAmount}>
              Total: ₱{computeTotalAmount()}
            </Text>
            <TouchableOpacity
              style={styles.paymentButton}
              onPress={() => handlePayment()}
            >
              <Text style={styles.buttonText}>Proceed to Payment</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowBasketModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showFavoriteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFavoriteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <Text style={styles.confirmModalTitle}>Add to Favorites?</Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={[styles.confirmModalButton, styles.noButton]}
                onPress={() => setShowFavoriteModal(false)}
              >
                <Text style={styles.confirmModalButtonText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmModalButton, styles.yesButton]}
                onPress={() => {
                  if (selectedFavoriteItem) {
                    insertFavorite(selectedFavoriteItem);
                  }
                }}
              >
                <Text style={styles.confirmModalButtonText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <FloatingBasket />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D9D9D9",
    position: "relative",
  },
  header: {
    paddingTop: 38,
    padding: 10,
    backgroundColor: "#800000",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
  },
  username: {
    color: "#fff",
    fontSize: 18,
    flex: 1,
  },
  searchBar: {
    backgroundColor: "#fff",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginHorizontal: 10,
  },
  cartIcon: {
    padding: 10,
  },
  icon: {
    width: 24,
    height: 24,
  },
  fixedLogoSection: {
    alignItems: "center",
    padding: 5,
    backgroundColor: "#800000",
    position: "absolute",
    top: 120,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: -40,
  },
  content: {
    paddingTop: 180,
  },
  scrollableContent: {
    alignItems: "center",
    backgroundColor: "#D9D9D9",
    padding: 10,
    paddingTop: 25,
  },
  productContainer: {
    width: "50%",
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  image: {
    width: "50%",
    height: 100,
    borderRadius: 10,
    alignSelf: "center",
  },
  productDetails: {
    padding: 10,
    alignItems: "center",
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#800000",
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
  },
  storeName: {
    fontSize: 14,
    color: "#666",
  },
  itemList: {
    padding: 10,
  },
  itemBackground: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: "#800000",
    marginBottom: 2,
  },
  storeName: {
    fontSize: 12,
    color: "#666",
  },
  basketButton: {
    padding: 8,
    backgroundColor: "#800000",
    borderRadius: 8,
    marginLeft: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  basketIcon: {
    width: 24,
    height: 24,
    tintColor: "#fff",
  },
  storeList: {
    padding: 10,
    paddingTop: 25,
    borderRadius: 10,
  },
  storeItem: {
    marginBottom: 10,
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
  },
  storeImageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  storeImage: {
    width: "100%",
    height: "100%",
  },
  storeName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  storeOwner: {
    fontSize: 14,
    color: "#555",
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
  houseIcon: {
    width: 26,
    height: 26,
  },
  footerIconImage: {
    width: 26,
    height: 26,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    height: "80%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalSmallContent: {
    width: "90%",
    height: "50%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  popularButton: {
    backgroundColor: "#800000",
    padding: 10,
    borderRadius: 10,
    flex: 1,
    marginRight: 5,
  },
  favoriteButton: {
    backgroundColor: "#800000",
    padding: 10,
    borderRadius: 10,
    flex: 1,
    marginLeft: 5,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 14,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#800000",
    borderRadius: 10,
  },
  closeButtonText: {
    color: "white",
    textAlign: "center",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "30%",
    marginBottom: 20,
  },
  quantityButton: {
    backgroundColor: "#800000",
    padding: 10,
    borderRadius: 10,
    flex: 1,
    marginRight: 5,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#800000",
    marginHorizontal: 10,
  },
  addButton: {
    backgroundColor: "#800000",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginTop: 10,
    alignSelf: "center",
  },
  basketList: {
    width: "100%",
    marginBottom: 20,
  },
  basketItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  basketItemControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  quantityButton: {
    backgroundColor: "#800000",
    padding: 5,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  removeButton: {
    backgroundColor: "#ff0000",
    padding: 5,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  paymentButton: {
    backgroundColor: "#800000",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginTop: 10,
    alignSelf: "center",
  },
  productList: {
    padding: 10,
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: "#800000",
    marginBottom: 2,
  },
  storeName: {
    fontSize: 12,
    color: "#666",
  },
  basketButton: {
    padding: 8,
    backgroundColor: "white",
    borderRadius: 8,
    marginLeft: 12,
  },
  basketIcon: {
    width: 24,
    height: 24,
    tintColor: "#fff",
  },
  noDataText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#800000",
    textAlign: "center",
    marginTop: 20,
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
    color: "#800000",
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
  quantityInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
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
  basketIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    alignItems: "center",
  },
  basketImage: {
    width: 30,
    height: 30,
  },
  basketCount: {
    fontSize: 12,
    color: "#fff",
    backgroundColor: "#800000",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    position: "absolute",
    top: -5,
    right: -5,
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
  heartIcon: {
    width: 20,
    height: 20,
    position: "absolute",
    top: 10,
    right: 10,
  },
  itemContent: {
    width: "100%",
    alignItems: "center",
    position: "relative",
  },
  heartIconContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 15,
    zIndex: 1,
  },
  heartIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 8,
  },
  heartIconButton: {
    padding: 8,
    backgroundColor: "#800000",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  heartIcon: {
    width: 24,
    height: 24,
    tintColor: "#fff",
  },
  basketButton: {
    padding: 8,
    backgroundColor: "#800000",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  basketIcon: {
    width: 24,
    height: 24,
    tintColor: "#fff",
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
    color: "red",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 2,
  },
  basketButtonDisabled: {
    backgroundColor: "#cccccc",
  },
  basketIconDisabled: {
    opacity: 0.5,
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
    borderRadius: 15,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quantityModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#800000",
  },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
    width: "100%",
    justifyContent: "center",
  },
  quantityButton: {
    backgroundColor: "#800000",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
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
    width: "100%",
    paddingHorizontal: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: "#cccccc",
  },
  confirmButton: {
    backgroundColor: "#800000",
  },
  cancelButtonText: {
    color: "#333333",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
  confirmButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
});
export default EVSU_Student_DashBoard;
