import React, { useState, useEffect } from "react";
import { API_URL } from "./config";
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { PermissionsAndroid } from "react-native";

const Vendor_Sign_up = ({ navigation }) => {
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [username, setUserName] = useState("");
  const [stallName, setStallName] = useState(""); // Fix the naming to stallName
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState(""); // Add password state

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      try {
        // For Android 13+ (SDK 33+)
        if (Platform.Version >= 33) {
          const photoPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          );
          return photoPermission === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          // For Android 12 and below
          const storagePermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
          );
          return storagePermission === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    // For iOS
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === "granted";
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      console.log("Image picker result:", result);

      if (!result.canceled && result.assets && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
        console.log("Selected image URI:", result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleSignUp = async () => {
    // Validate inputs
    if (
      !name.trim() ||
      !username.trim() ||
      !email.trim() ||
      !newPassword.trim() ||
      !stallName.trim()
    ) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/vendor-signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim(),
          email: email.trim(),
          password: newPassword.trim(), // Use the correct password state
          stall_name: stallName.trim(), // Use the correct stallName state
        }),
      });

      const data = await response.json();
      console.log("Signup response:", data);

      if (data.success) {
        Alert.alert(
          "Success",
          "Vendor registered successfully, Please Wait for Approval",
          [{ text: "OK", onPress: () => navigation.navigate("VendorLogin") }]
        );
      } else {
        Alert.alert(
          "Success",
          "Vendor registered successfully, Please Wait for Approval",
          [{ text: "OK", onPress: () => navigation.navigate("VendorLogin") }]
        );
      }
    } catch (error) {
      console.error("Signup error:", error);
      Alert.alert("Error", "Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  const [connectionStatus, setConnectionStatus] = useState(
    "Checking connection..."
  );

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

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          onPress={pickImage}
          style={styles.uploadButton}
          disabled={loading}
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.image} />
          ) : (
            <Text style={styles.uploadText}>Upload Profile Picture</Text>
          )}
        </TouchableOpacity>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ff4c4c" />
            <Text style={styles.loadingText}>Uploading...</Text>
          </View>
        )}
        <Text style={styles.connectionStatus}>{connectionStatus}</Text>
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUserName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Stall Name"
            value={stallName}
            onChangeText={setStallName}
            autoCapitalize="words"
          />
        </View>

        <TouchableOpacity
          style={styles.updateButton}
          onPress={handleSignUp} // Fixed to call handleSignUp
          disabled={loading}
        >
          <Text style={styles.updateButtonText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    alignItems: "center",
    padding: 20,
  },
  uploadButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 20,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  uploadText: {
    color: "#666",
    textAlign: "center",
    padding: 10,
  },
  form: {
    width: "100%",
    maxWidth: 400,
  },
  input: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  updateButton: {
    backgroundColor: "#ff4c4c",
    padding: 15,
    borderRadius: 5,
    marginTop: 10,
  },
  updateButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
});

export default Vendor_Sign_up;
