import React from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useBasket } from "./BasketContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

const Basket = () => {
  const navigation = useNavigation();
  const { basket, clearBasket, removeFromBasket } = useBasket();

  const calculateTotal = () => {
    return basket
      .reduce((total, item) => {
        const itemPrice = parseFloat(item.Price);
        const itemQuantity = parseInt(item.quantity);
        return total + itemPrice * itemQuantity;
      }, 0)
      .toFixed(2); // Round to 2 decimal places
  };

  const calculateItemTotal = (price, quantity) => {
    return (parseFloat(price) * parseInt(quantity)).toFixed(2);
  };

  const submitOrder = async () => {
    try {
      const username = await AsyncStorage.getItem("username");
      if (!username) {
        Alert.alert("Error", "Please login first");
        return;
      }

      // Debug log for basket items
      console.log("Current basket:", basket);

      // Group items by vendor
      const itemsByVendor = basket.reduce((acc, item) => {
        console.log("Processing basket item:", item); // Debug log
        const vendorId = item.vendor_username;
        if (!acc[vendorId]) {
          acc[vendorId] = [];
        }
        acc[vendorId].push(item);
        return acc;
      }, {});

      // Create orders for each vendor
      for (const [vendorId, items] of Object.entries(itemsByVendor)) {
        const orderData = {
          customer_id: username,
          vendor_id: vendorId,
          total_price: items.reduce(
            (total, item) => total + parseFloat(item.Price) * item.quantity,
            0
          ),
          status: "pending",
          items: items.map((item) => {
            console.log("Processing item for order:", item); // Debug log
            return {
              id: item.id || item.item_id, // Try both possible ID fields
              quantity: parseInt(item.quantity),
              Price: parseFloat(item.Price),
              vendor_username: item.vendor_username,
              item_name: item.item_name, // Include item name for reference
            };
          }),
        };

        console.log("Sending order data:", JSON.stringify(orderData, null, 2));

        try {
          const response = await fetch(
            "http://192.168.0.106:3000/orders/create",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify(orderData),
            }
          );

          console.log("Response status:", response.status);
          const responseText = await response.text();
          console.log("Response text:", responseText);

          const result = JSON.parse(responseText);
          console.log("Parsed result:", result);

          if (result.success) {
            clearBasket();
            Alert.alert("Success", "Order placed successfully!", [
              { text: "OK" },
            ]);
          } else {
            throw new Error(result.message || "Failed to place order");
          }
        } catch (fetchError) {
          console.error("Fetch error:", fetchError);
          throw new Error(`Failed to submit order: ${fetchError.message}`);
        }
      }
    } catch (error) {
      console.error("Order submission error:", error);
      Alert.alert(
        "Error",
        error.message || "An error occurred while placing your order.",
        [{ text: "OK" }]
      );
    }
  };

  const handleRemoveItem = (item) => {
    Alert.alert(
      "Remove Item",
      `Are you sure you want to remove ${item.item_name} from your basket?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          onPress: () => removeFromBasket(item),
          style: "destructive",
        },
      ]
    );
  };

  const handleBack = () => {
    navigation.goBack(); // This will return to the previous screen
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Basket</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Image
            source={require("./assets/icons8-back-30.png")}
            style={styles.backIcon}
          />
        </TouchableOpacity>
      </View>
      {basket.length > 0 ? (
        <>
          <FlatList
            data={basket}
            keyExtractor={(item) => String(item.id || Date.now())}
            renderItem={({ item }) => (
              <View style={styles.itemContainer}>
                <Image
                  source={{ uri: item.item_image }}
                  style={styles.itemImage}
                />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.item_name}</Text>
                  <Text style={styles.vendorName}>
                    Vendor: {item.vendor_username}
                  </Text>
                  <Text style={styles.itemPrice}>
                    ₱{item.Price} x {item.quantity}
                  </Text>
                  <Text style={styles.itemSubtotal}>
                    Subtotal: ₱{calculateItemTotal(item.Price, item.quantity)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveItem(item)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          />
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Items: {basket.length}</Text>
            <Text style={styles.totalText}>
              Total Amount: ₱{calculateTotal()}
            </Text>
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={submitOrder}
            >
              <Text style={styles.checkoutButtonText}>Place Order</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your basket is empty</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 38,
    padding: 20,
    backgroundColor: "#800000",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  backButton: {
    padding: 5,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: "#fff", // Makes the icon white to match header text
  },
  itemContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
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
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  vendorName: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#800000",
  },
  totalContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  totalLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  totalText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#800000",
    marginBottom: 15,
  },
  checkoutButton: {
    backgroundColor: "#800000",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  checkoutButtonText: {
    color: "white",
    fontSize: 16,
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
    textAlign: "center",
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#ff4c4c",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 10,
    right: 10,
  },
  removeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Basket;
