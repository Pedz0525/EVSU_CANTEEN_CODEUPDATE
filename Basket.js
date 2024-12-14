import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";
import { useBasket } from "./BasketContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { API_URL } from "./config";

const Basket = () => {
  const navigation = useNavigation();
  const { basket, clearBasket, removeFromBasket, updateQuantity } = useBasket();
  const [selectedItem, setSelectedItem] = useState(null);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [tempQuantity, setTempQuantity] = useState("1");
  const [deliveryMode, setDeliveryMode] = useState(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [deliveryDetails, setDeliveryDetails] = useState("");

  const evsuLocations = [
    "EVSU Main Campus",
    "College of Technology Building",
    "College of Education Building",
    "College of Engineering Building",
    "College of Arts and Sciences Building",
    "College of Business and Entrepreneurship Building",
    "EVSU Library",
    "EVSU Gymnasium",
    "EVSU Admin Building",
    "Student Center"
  ];

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

  const calculateFinalTotal = () => {
    const subtotal = parseFloat(calculateTotal());
    return deliveryMode === 'delivery' ? (subtotal + 15).toFixed(2) : subtotal.toFixed(2);
  };

  const submitOrder = async () => {
    // Check if delivery mode is selected first
    if (!deliveryMode) {
      Alert.alert(
        "Select Mode of Receiving",
        "Please select how you want to receive your order first.",
        [
          {
            text: "OK",
            onPress: () => setShowDeliveryModal(true)
          }
        ]
      );
      return;
    }

    if (deliveryMode === 'delivery' && !deliveryLocation.trim()) {
      Alert.alert(
        "Delivery Address Required",
        "Please enter your delivery address.",
        [{ text: "OK", onPress: () => setShowDeliveryModal(true) }]
      );
      return;
    }

    try {
      const username = await AsyncStorage.getItem("username");
      if (!username) {
        Alert.alert("Error", "Please login first");
        return;
      }

      // Debug log for basket items
      console.log("Current basket:", basket);

      // Group items by vendor and combine similar items
      const itemsByVendor = basket.reduce((acc, item) => {
        const vendorId = item.vendor_id;
        if (!acc[vendorId]) {
          acc[vendorId] = [];
        }

        // Check if similar item already exists for this vendor
        const existingItemIndex = acc[vendorId].findIndex(
          (existingItem) =>
            existingItem.item_name === item.item_name &&
            existingItem.Price === item.Price &&
            existingItem.vendor_id === item.vendor_id
        );

        if (existingItemIndex !== -1) {
          // Combine quantities if item exists
          acc[vendorId][existingItemIndex].quantity += item.quantity;
        } else {
          // Add new item if it doesn't exist
          acc[vendorId].push({
            id: item.id || item.item_id,
            quantity: parseInt(item.quantity),
            Price: parseFloat(item.Price),
            vendor_id: item.vendor_id,
            item_name: item.item_name,
          });
        }
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
          ) + (deliveryMode === 'delivery' ? 15 : 0),
          status: "pending",
          delivery_mode: deliveryMode,
          delivery_location: deliveryLocation,
          delivery_details: deliveryDetails,
          items: items,
        };

        console.log("Sending order data:", JSON.stringify(orderData, null, 2));

        try {
          const response = await fetch(`${API_URL}/orders/create`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(orderData),
          });

          console.log("Response status:", response.status);
          const responseText = await response.text();
          console.log("Response text:", responseText);

          const result = JSON.parse(responseText);
          console.log("Parsed result:", result);

          if (result.success) {
            clearBasket();
            setDeliveryMode(null); // Reset delivery mode after successful order
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

  // Add quantity update handler
  const handleUpdateQuantity = (item) => {
    setSelectedItem(item);
    setTempQuantity(item.quantity.toString());
    setShowQuantityModal(true);
  };

  const confirmQuantityUpdate = () => {
    if (selectedItem && parseInt(tempQuantity) > 0) {
      updateQuantity(selectedItem.basketId, tempQuantity);
      setShowQuantityModal(false);
      setSelectedItem(null);
    } else {
      Alert.alert(
        "Invalid Quantity",
        "Please enter a valid quantity greater than 0"
      );
    }
  };

  // Update the renderItem to include quantity update button
  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Image source={{ uri: item.item_image }} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.item_name}</Text>
        <Text style={styles.vendorName}>Vendor: {item.stall_name}</Text>
        <View style={styles.quantityContainer}>
          <Text style={styles.itemPrice}>₱{item.Price}</Text>
          <TouchableOpacity
            style={styles.updateQuantityButton}
            onPress={() => handleUpdateQuantity(item)}
          >
            <Text style={styles.quantityText}>Qty: {item.quantity}</Text>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>
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
  );

  // Add quantity modal component
  const QuantityModal = () => (
    <Modal visible={showQuantityModal} transparent={true} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Update Quantity</Text>

          <View style={styles.quantitySelector}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => {
                const currentQty = parseInt(tempQuantity);
                if (currentQty > 1) {
                  setTempQuantity((currentQty - 1).toString());
                }
              }}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>

            <Text style={styles.quantityText}>{tempQuantity}</Text>

            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => {
                const currentQty = parseInt(tempQuantity);
                setTempQuantity((currentQty + 1).toString());
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
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={confirmQuantityUpdate}
            >
              <Text style={styles.confirmButtonText}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const DeliveryModal = () => (
    <Modal visible={showDeliveryModal} transparent={true} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Mode of Receiving</Text>
          
          <TouchableOpacity 
            style={[
              styles.deliveryOption,
              deliveryMode === 'pickup' && styles.selectedDeliveryOption
            ]}
            onPress={() => {
              setDeliveryMode('pickup');
              setShowDeliveryModal(false);
            }}
          >
            <Text style={[
              styles.deliveryOptionText,
              deliveryMode === 'pickup' && styles.selectedDeliveryOptionText
            ]}>Get on Store</Text>
            <Text style={[
              styles.deliveryPrice,
              deliveryMode === 'pickup' && styles.selectedDeliveryOptionText
            ]}>₱{calculateTotal()}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.deliveryOption,
              deliveryMode === 'delivery' && styles.selectedDeliveryOption
            ]}
            onPress={() => {
              setDeliveryMode('delivery');
              setShowDeliveryModal(false);
            }}
          >
            <Text style={[
              styles.deliveryOptionText,
              deliveryMode === 'delivery' && styles.selectedDeliveryOptionText
            ]}>Delivery</Text>
            <Text style={[
              styles.deliveryPrice,
              deliveryMode === 'delivery' && styles.selectedDeliveryOptionText
            ]}>₱{calculateTotal()} + ₱15</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={() => setShowDeliveryModal(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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
            keyExtractor={(item) =>
              item.basketId || String(Date.now() + Math.random())
            }
            renderItem={renderItem}
          />
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Items: {basket.length}</Text>
            
            <TouchableOpacity 
              style={styles.deliveryModeButton}
              onPress={() => setShowDeliveryModal(true)}
            >
              <Text style={styles.deliveryModeText}>
                {deliveryMode ? 
                  (deliveryMode === 'pickup' ? 'Get on Store' : 'Delivery (+₱15)') : 
                  'Select Mode of Receiving'}
              </Text>
            </TouchableOpacity>

            {deliveryMode === 'delivery' && (
              <View style={styles.deliveryDetailsContainer}>
                <TextInput
                  style={styles.locationInput}
                  value={deliveryLocation}
                  onChangeText={setDeliveryLocation}
                  placeholder="Enter your EVSU area location"
                  multiline={true}
                  numberOfLines={3}
                />
                
                <TextInput
                  style={styles.locationInput}
                  value={deliveryDetails}
                  onChangeText={setDeliveryDetails}
                  placeholder="Additional details (optional)"
                  multiline={true}
                  numberOfLines={2}
                />
              </View>
            )}

            <Text style={styles.totalText}>
              Total Amount: ₱{calculateFinalTotal()}
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

      <QuantityModal />
      <DeliveryModal />
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
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 5,
  },

  updateQuantityButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 5,
    borderRadius: 5,
  },

  quantityText: {
    marginRight: 5,
    fontSize: 14,
  },

  editText: {
    color: "#800000",
    fontSize: 14,
    fontWeight: "bold",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    alignItems: 'center',
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#800000",
  },

  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
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

  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },

  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },

  confirmButton: {
    backgroundColor: '#800000',
  },

  cancelButton: {
    backgroundColor: '#f5f5f5',
  },

  confirmButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  cancelButtonText: {
    color: '#333',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  deliveryOption: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  selectedDeliveryOption: {
    backgroundColor: '#800000',
  },

  deliveryOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },

  deliveryPrice: {
    fontSize: 14,
    color: '#666',
  },

  deliveryModeButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  deliveryModeText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#800000',
    fontWeight: 'bold',
  },

  deliveryDetailsContainer: {
    width: '100%',
    marginTop: 10,
    marginBottom: 10,
  },

  locationInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 60,
    fontSize: 16,
    color: '#000',
  },
});

export default Basket;
