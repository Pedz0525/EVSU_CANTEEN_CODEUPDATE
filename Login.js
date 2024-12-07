import AsyncStorage from "@react-native-async-storage/async-storage";

// In your login function
const handleLogin = async () => {
  try {
    const response = await fetch("http://192.168.254.108:3000/login", {
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
      // Store both username and student_id
      await AsyncStorage.setItem("username", data.username);
      await AsyncStorage.setItem("student_id", String(data.student_id));

      navigation.replace("EVSU_Student_DashBoard", {
        username: data.username,
      });
    } else {
      Alert.alert("Error", data.message);
    }
  } catch (error) {
    console.error("Login error:", error);
    Alert.alert("Error", "Failed to connect to server");
  }
};
