import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function UserTypeSelection({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={require("./assets/bg_img.png")}
          style={styles.backgroundImage}
        />
      </View>

      <View style={styles.formContainer}>
        <Image source={require("./assets/EvsuLOGO.png")} style={styles.logo} />
        <Text style={styles.title}>EVSU CANTEEN</Text>
        <Text style={styles.subtitle}>Select User Type</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("VendorLogin")}
          >
            <Text style={styles.buttonText}>VENDOR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.buttonText}>CUSTOMER</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  imageContainer: {
    height: "33%",
  },
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
  },
  formContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 16,
    alignItems: "center",
    marginTop: -30,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginTop: -50,
    borderWidth: 4,
    borderColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    color: "#800000",
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 32,
    color: "#666",
  },
  buttonContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: "#800000",
    padding: 15,
    borderRadius: 5,
    width: "40%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
