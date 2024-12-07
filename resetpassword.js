import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ImageBackground,
} from "react-native";

const ResetPassword = ({ route, navigation }) => {
  const { email } = route.params;
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [connectionStatus, setConnectionStatus] = useState(
    "Checking connection..."
  );

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

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleResetPassword = async () => {
    if (newPassword === "") {
      Alert.alert("Error", "New password cannot be empty.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(
        "http://192.168.254.108:3000/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            newPassword: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        Alert.alert("Success", "Password has been reset successfully!", [
          {
            text: "OK",
            onPress: () => navigation.replace("Login"),
          },
        ]);
      } else {
        Alert.alert("Error", data.message || "Failed to reset password");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      Alert.alert("Error", "Failed to connect to server");
    }
  };

  return (
    <ImageBackground
      source={require("./assets/bg_img.png")}
      style={styles.background}
    >
      <View style={styles.overlay}>
        <Text style={styles.headerText}>Reset Password</Text>
        <Text style={styles.connectionStatus}>{connectionStatus}</Text>

        <View style={styles.form}>
          <Text style={styles.label}>New Password:</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />

          <Text style={styles.label}>Confirm Password:</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetPassword}
          >
            <Text style={styles.resetButtonText}>Reset Password</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 20,
    justifyContent: "center",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 30,
  },
  form: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  resetButton: {
    backgroundColor: "#800000",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  connectionStatus: {
    textAlign: "center",
    marginBottom: 10,
    fontSize: 12,
    color: "#fff",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 5,
    borderRadius: 5,
  },
});

export default ResetPassword;
