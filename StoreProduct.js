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
} from "react-native";

export default function StoreProduct({ route }) {
  const { storeName, storeLocation } = route.params;
  const [activeTab, setActiveTab] = useState("SHOP");
  const [products, setProducts] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (activeTab === "PRODUCTS") {
      const fetchProducts = async () => {
        try {
          console.log("Current store/vendor:", storeName);

          const response = await fetch(
            `http://192.168.254.112:3000/items/${encodeURIComponent(storeName)}`
          );
          console.log("Fetching items for vendor:", storeName);

          const data = await response.json();
          if (data.success) {
            console.log("Items received:", data.products);

            // Log the first item to verify structure
            if (data.products.length > 0) {
              console.log("Sample item:", {
                name: data.products[0].item_name,
                price: data.products[0].Price,
                category: data.products[0].Category,
              });
            }

            setProducts(data.products);
            console.log("Total items fetched:", data.products.length);
          } else {
            console.error("Failed to fetch items:", data.message);
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
      const encodedStoreName = encodeURIComponent(storeName);
      const encodedCategory = encodeURIComponent(category);

      const response = await fetch(
        `http://192.168.254.112:3000/categories/${encodedStoreName}?category=${encodedCategory}`
      );

      console.log("Fetching from:", {
        storeName: storeName,
        category: category,
      });

      const data = await response.json();
      console.log("API Response:", data);

      if (data.success) {
        setCategoryProducts(data.products);
        setModalVisible(true);
      } else {
        console.error("Failed to fetch category products:", data.message);
        setCategoryProducts([]);
        setModalVisible(true);
      }
    } catch (error) {
      console.error("Error fetching category products:", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header for Store Name and Location */}
      <View style={styles.header}>
        <Text style={styles.storeName}>{storeName}</Text>
        <Text style={styles.storeLocation}>{storeLocation}</Text>
      </View>

      {/* Semi-navigation bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === "SHOP" && styles.activeNavItem]}
          onPress={() => setActiveTab("SHOP")}
        >
          <Text
            style={[
              styles.navText,
              activeTab === "SHOP" && styles.activeNavText,
            ]}
          >
            SHOP
          </Text>
        </TouchableOpacity>
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
        {activeTab === "SHOP" && <Text>Displaying Shop...</Text>}
        {activeTab === "PRODUCTS" && (
          <ScrollView contentContainerStyle={styles.productsContainer}>
            {products.map((product, index) => (
              <View key={index} style={styles.product}>
                <Image
                  source={{
                    uri: product.item_image,
                  }}
                  style={styles.productImage}
                />
                <Text style={styles.productName}>{product.item_name}</Text>
                <Text style={styles.productPrice}>₱{product.Price}</Text>
              </View>
            ))}
          </ScrollView>
        )}
        {activeTab === "CATEGORIES" && (
          <ScrollView contentContainerStyle={styles.categoriesContainer}>
            <TouchableOpacity
              style={styles.category}
              onPress={() => {
                console.log("Selected Category: Dishes");
                console.log("Selected Store:", storeName);
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
                ? categoryProducts[0].category
                : "No Products"}
            </Text>
            <Button title="Close" onPress={() => setModalVisible(false)} />
          </View>
          <ScrollView contentContainerStyle={styles.productsContainer}>
            {categoryProducts.length > 0 ? (
              categoryProducts.map((product, index) => (
                <View key={index} style={styles.product}>
                  <Image
                    source={{ uri: product.ImageItem }}
                    style={styles.productImage}
                  />
                  <Text style={styles.productName}>{product.itemName}</Text>
                  <Text style={styles.productPrice}>₱{product.price}</Text>
                  <Text style={styles.categoryText}>{product.category}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    marginTop: 50,
    padding: 16,
    backgroundColor: "#ff4c4c",
    alignItems: "flex-start",
  },
  storeName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  storeLocation: {
    fontSize: 16,
    color: "#fff",
    marginTop: 4,
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
    paddingHorizontal: 16,
    backgroundColor: "white",
    alignItems: "center",
  },
  product: {
    marginBottom: 20,
    alignItems: "center",
    width: "100%",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
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
});
