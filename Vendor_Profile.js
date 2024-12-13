import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
  Alert,
} from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import { API_URL } from "./config";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function App({ navigation, route }) {
  const { profileImage, stallname, username, email, name, vendor_id } =
    route.params;
  const [totalSales, setTotalSales] = useState(0);
  const [lostSales, setLostSales] = useState(0);

  const navigateToAddItem = () => {
    navigation.navigate("AddItem", { email: email, vendor_id: vendor_id });
  };

  const handlePress = (tab) => {
    console.log(`${tab} tab pressed`);
    if (tab === "Add") {
      navigateToAddItem();
    }
    if (tab === "Home") {
      navigation.navigate("Vendor");
    }
  };

  const getProfileImageSource = () => {
    if (profileImage) {
      return { uri: `${API_URL}${profileImage}` };
    }
    return require("./assets/EvsuLOGO.png"); // Fallback to a local default image
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await AsyncStorage.clear();
            navigation.reset({
              index: 0,
              routes: [{ name: "UserTypeSelection" }],
            });
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  // Function to fetch total sales from the backend
  const fetchTotalSales = async () => {
    try {
      const response = await fetch(`${API_URL}/total-sales`);
      const data = await response.json();
      setTotalSales(data.totalSales || 0); // Update state with fetched total sales
    } catch (error) {
      console.error("Error fetching total sales:", error);
    }
  };

  // Fetch total sales on initial mount and set up periodic refresh
  useEffect(() => {
    fetchTotalSales(); // Fetch data when component mounts

    const interval = setInterval(() => {
      fetchTotalSales(); // Refresh data every 10 seconds
    }, 1000); // 10000ms = 10 seconds

    // Cleanup interval when component unmounts
    return () => clearInterval(interval);
  }, []);

  const fetchLostSales = async () => {
    try {
      const response = await fetch(`${API_URL}/lost-sales`);
      const data = await response.json();
      setLostSales(data.lostSales || 0); // Update state with fetched total sales
    } catch (error) {
      console.error("Error fetching total sales:", error);
    }
  };

  // Fetch total sales on initial mount and set up periodic refresh
  useEffect(() => {
    fetchLostSales(); // Fetch data when component mounts

    const interval = setInterval(() => {
      fetchLostSales(); // Refresh data every 10 seconds
    }, 1000); // 10000ms = 10 seconds

    // Cleanup interval when component unmounts
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image style={styles.logo} source={require("./assets/EvsuLOGO.png")} />

        <Text style={styles.headerText}>Evsu Canteen</Text>
      </View>

      {/* Profile Info */}
      <View style={styles.profileContainer}>
        <TouchableOpacity onPress={() => navigation.navigate("ProfileUpload")}>
          <Image style={styles.profileImage} source={getProfileImageSource()} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => navigation.navigate("ProfileUpload")}
        >
          <Text style={styles.logoutText}>Update Profile</Text>
        </TouchableOpacity>
        <Text style={styles.username}>{username || "Username"}</Text>
        <Text style={styles.email}>{email || "example@email.com"}</Text>
      </View>

      {/* Sales Boxes */}
      <View style={styles.salesBoxContainer}>
        <View style={styles.salesBox}>
          <Text style={styles.salesLabel}>Today Sales:</Text>
          <Text style={styles.salesAmount}>₱{totalSales}</Text>
        </View>
        <View style={styles.salesBox}>
          <Text style={styles.salesLabel}>Today Sales:</Text>
          <Text style={styles.salesAmount}>₱{lostSales}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => handlePress("Home")}>
          <AntDesign name="home" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handlePress("Add")}>
          <AntDesign name="pluscircleo" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handlePress("Profile")}>
          <AntDesign name="user" size={35} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    backgroundColor: "#D32F2F", // Red color for the button
    paddingVertical: 12, // Padding for height
    paddingHorizontal: 20, // Padding for width
    borderRadius: 25, // Rounded corners
    alignItems: "center", // Center the text inside the button
    justifyContent: "center", // Vertically center the text
    shadowColor: "#000", // Shadow for depth
    shadowOffset: { width: 0, height: 4 }, // Shadow offset
    shadowOpacity: 0.2, // Light shadow opacity
    shadowRadius: 5, // Shadow radius
    elevation: 5, // Android shadow
    marginTop: 20, // Margin to separate from other elements
  },
  logoutText: {
    color: "#fff", // White text color
    fontSize: 18, // Font size for the text
    fontWeight: "bold", // Make text bold
    textAlign: "center", // Ensure text is centered
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#7a0000",
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    justifyContent: "center",
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  headerText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  profileContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  username: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#777",
    marginBottom: 20,
    textAlign: "center",
  },
  email: {
    fontSize: 16,
    color: "#777",
    marginBottom: 20,
  },
  salesBoxContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
  },
  salesBox: {
    backgroundColor: "#f0f0f0",
    padding: 20,
    borderRadius: 10,
    width: 150,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  salesLabel: {
    fontSize: 14,
    color: "#333",
  },
  salesAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "green",
    marginTop: 5,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#8B0000",
    paddingVertical: 10,
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 100,
  },
});
