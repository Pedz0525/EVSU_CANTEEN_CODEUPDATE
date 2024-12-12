import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "./config";

// In your login function
const handleLogin = async () => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("Storing student_id:", data.student_id); // Debugging log
      await AsyncStorage.setItem("name", data.name);
      await AsyncStorage.setItem("student_id", String(data.student_id)); // Ensure this is correct
      navigation.replace("EVSU_Student_DashBoard", {
        name: data.name,
      });
    } else {
      Alert.alert("Error", data.message);
    }
  } catch (error) {
    console.error("Login error:", error);
    Alert.alert("Error", "Failed to connect to server");
  }
};
