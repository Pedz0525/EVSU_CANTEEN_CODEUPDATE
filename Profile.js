import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

const Profile = ({ navigation, route }) => {
  const { username: initialUsername } = route.params;
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAccountSettings = () => {
    setShowEditProfile(true);
  };

  const handleBack = () => {
    setUsername(initialUsername);
    setPassword("");
    setShowEditProfile(false);
  };

  const handleLogout = () => {
    navigation.replace("UserTypeSelection");
  };

  const selectImage = async (useLibrary = false) => {
    try {
      let result;
      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      };

      if (useLibrary) {
        result = await ImagePicker.launchImageLibraryAsync(options);
      } else {
        await ImagePicker.requestCameraPermissionsAsync();
        result = await ImagePicker.launchCameraAsync(options);
      }

      if (!result.canceled) {
        const source = { uri: result.assets[0].uri };
        setProfileImage(source);
        console.log("Image set successfully:", source);
      }
    } catch (error) {
      console.error("Error selecting image:", error);
      Alert.alert("Error", "Failed to select image");
    }
  };

  const fetchProfileImage = async () => {
    try {
      console.log("Fetching profile image for username:", username);
      const response = await fetch(
        `http://192.168.254.112:3000/customer/profile/${encodeURIComponent(
          username
        )}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Profile data received:", data);

      if (data.success && data.profile_image) {
        setProfileImage({
          uri: `data:image/jpeg;base64,${data.profile_image}`,
        });
      }
    } catch (error) {
      console.error("Error fetching profile image:", error);
      Alert.alert("Error", "Failed to fetch profile image. Please try again.");
    }
  };

  useEffect(() => {
    if (username) {
      fetchProfileImage();
    }
  }, [username]);

  const saveProfile = async () => {
    try {
      setIsLoading(true);
      console.log("Starting profile update...");

      // Create FormData object
      const formData = new FormData();
      formData.append("username", username);

      if (password) {
        formData.append("password", password);
      }

      // Handle image
      if (profileImage && profileImage.uri) {
        const uriParts = profileImage.uri.split(".");
        const fileType = uriParts[uriParts.length - 1];

        formData.append("profileImage", {
          uri: profileImage.uri,
          name: `profile.${fileType}`,
          type: `image/${fileType}`,
        });
      }

      console.log("Sending request with formData:", formData);

      const response = await fetch(
        "http://192.168.254.112:3000/customer/profile/update",
        {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const data = await response.json();
      console.log("Profile update response:", data);

      if (data.success) {
        Alert.alert("Success", "Profile updated successfully", [
          {
            text: "OK",
            onPress: () => {
              setShowEditProfile(false);
              fetchProfileImage(); // Refresh the profile image
            },
          },
        ]);
      } else {
        Alert.alert("Error", data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile details:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Profile</Text>
      </View>

      <View style={styles.centerContent}>
        {!showEditProfile && (
          <View style={styles.iconContainer}>
            <View style={styles.iconWrapper}>
              <Image
                source={require("./assets/icons8-bag-30.png")}
                style={styles.icon}
              />
              <Text style={styles.iconText}>Orders</Text>
            </View>
            <View style={styles.iconWrapper}>
              <Image
                source={require("./assets/icons8-food-basket-30.png")}
                style={styles.icon}
              />
              <Text style={styles.iconText}>Basket</Text>
            </View>
            <View style={styles.iconWrapper}>
              <Image
                source={require("./assets/icons8-star-30.png")}
                style={styles.icon}
              />
              <Text style={styles.iconText}>Favorites</Text>
            </View>
          </View>
        )}

        <View style={styles.menuContainer}>
          {showEditProfile ? (
            <View>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>

              <View style={styles.profilePhotoContainer}>
                <Image
                  source={profileImage || require("./assets/placeholder.png")}
                  style={styles.profilePhoto}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => selectImage(true)}
                >
                  <Text style={styles.uploadButtonText}>
                    {profileImage ? "Change Photo" : "Upload Photo"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter username"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor="#666"
                  secureTextEntry={true}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, isLoading && styles.disabledButton]}
                disabled={isLoading}
                onPress={saveProfile}
              >
                <Text style={styles.saveButtonText}>Save Profile</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.profilePhotoContainer}>
                <Image
                  source={profileImage || require("./assets/placeholder.png")}
                  style={styles.profilePhoto}
                  resizeMode="cover"
                />
                <Text style={styles.profileName}>{username}</Text>
              </View>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleAccountSettings}
              >
                <Text style={styles.menuItemText}>Account Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <Text style={styles.menuItemText}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D9D9D9",
  },
  header: {
    paddingTop: 38,
    padding: 20,
    backgroundColor: "#800000",
  },
  headerText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#800000",
    padding: 20,
    marginBottom: 20,
    borderRadius: 10,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconWrapper: {
    alignItems: "center",
  },
  icon: {
    width: 40,
    height: 40,
    marginBottom: 5,
  },
  iconText: {
    fontSize: 12,
    color: "#fff",
  },
  menuContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  menuItemText: {
    fontSize: 18,
    color: "#800000",
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 18,
    color: "#800000",
  },
  profilePhotoContainer: {
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 20,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#800000",
    backgroundColor: "#fff",
    marginBottom: 15,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#800000",
    marginTop: 5,
  },
  uploadButton: {
    backgroundColor: "#800000",
    padding: 10,
    borderRadius: 5,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 5,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#800000",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.7,
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  roundProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  usernameText: {
    fontSize: 18,
    color: "#333",
  },
});

export default Profile;
