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

  const checkConnection = async () => {
    try {
      console.log("Checking connection...");
      const response = await fetch("http://192.168.254.108:3000/status");
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

      const response = await fetch("http://192.168.254.108:3000/vendors");
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
      const response = await fetch("http://192.168.254.108:3000/items");

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
    setSelectedProduct((prevProduct) => ({
      ...prevProduct,
      quantity: Math.max(1, (prevProduct.quantity || 1) + change),
    }));
  };

  const handleAddToBasket = (product, selectedQuantity) => {
    const itemWithQuantity = {
      id: String(Date.now()),
      item_name: product.item_name,
      Price: product.Price,
      item_image: product.item_image,
      quantity: selectedQuantity,
      vendor_username: product.vendor_username,
    };

    addToBasket(itemWithQuantity);
    setShowQuantityModal(false);
    setQuantity(1);
    Alert.alert("Success", "Item added to basket!");
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.username}>{username}</Text>
          <Text style={styles.connectionStatus}>{connectionStatus}</Text>
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
        <TextInput style={styles.searchBar} placeholder="Search" />
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
            <ImageBackground
              source={require("./assets/placeholder.png")}
              style={styles.itemBackground}
            >
              <Image
                source={require("./assets/placeholder.png")}
                style={styles.itemImage}
                resizeMode="contain"
              />
              <Text style={styles.itemName}>Ampalaya</Text>
              <Text style={styles.itemPrice}>₱20</Text>
              <View style={styles.itemIcons}>
                <TouchableOpacity>
                  <Image
                    source={require("./assets/heart_iconsmall.png")}
                    style={styles.icon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <TouchableOpacity>
                  <Image
                    source={require("./assets/basket_icon.png")}
                    style={styles.icon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </ImageBackground>
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
                    <Image
                      source={require("./assets/placeholder.png")}
                      style={styles.storeImage}
                      resizeMode="contain"
                    />
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
            {products.map((product, index) => (
              <TouchableOpacity
                key={index}
                style={styles.productItem}
                onPress={() => {
                  setSelectedProduct(product);
                  setShowQuantityModal(true);
                }}
              >
                <Image
                  source={{ uri: product.item_image }}
                  style={styles.productImage}
                  resizeMode="contain"
                />
                <Text style={styles.productName}>{product.item_name}</Text>
                <Text style={styles.productPrice}>₱{product.Price}</Text>
                <Text style={styles.storeName}>{product.vendor_username}</Text>
              </TouchableOpacity>
            ))}
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
      <Modal
        visible={showQuantityModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowQuantityModal(false);
          setQuantity(1);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Quantity</Text>

            {selectedProduct && (
              <View style={styles.productInfo}>
                <Text style={styles.productNameModal}>
                  {selectedProduct.item_name}
                </Text>
                <Text style={styles.productPriceModal}>
                  ₱{selectedProduct.Price}
                </Text>
              </View>
            )}

            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => {
                  if (quantity > 1) {
                    setQuantity(quantity - 1);
                  }
                }}
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
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={() => handleAddToBasket(selectedProduct, quantity)}
              >
                <Text style={styles.buttonText}>Add to Basket</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    top: 138,
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
    paddingTop: 25,
    borderRadius: 10,
  },
  itemBackground: {
    marginBottom: 10,
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#800000",
    justifyContent: "center",
  },
  itemImage: {
    width: 70,
    height: 70,
    marginBottom: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
  },
  itemPrice: {
    fontSize: 14,
    color: "#555",
  },
  itemIcons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "40%",
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
    backgroundColor: "red",
  },
  storeImageWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: "hidden",
    marginBottom: 10,
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
    paddingTop: 25,
    borderRadius: 10,
  },
  productItem: {
    marginBottom: 10,
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
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
  productImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: "hidden",
    marginBottom: 10,
    alignSelf: "center",
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  productPrice: {
    fontSize: 14,
    color: "#555",
  },
  storeName: {
    fontSize: 14,
    color: "#666",
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
});
export default EVSU_Student_DashBoard;
