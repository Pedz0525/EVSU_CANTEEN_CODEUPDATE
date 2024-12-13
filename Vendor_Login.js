import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Linking
} from 'react-native';
import styles from './Styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config';

export default function EVSU_Canteen_Login({ navigation }) {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);


  const handleLogin = async () => {
    // Validation
    if (!usernameOrEmail.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/login_vendor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usernameOrEmail: usernameOrEmail.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (data.success) {
        // Store user data
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        await AsyncStorage.setItem('userType', data.userType);

        console.log(data.user.vendor_id);
        // Navigate based on user type
        if (data.userType === 'vendor') {
          navigation.replace('Vendor');
        } else {
          navigation.replace('Vendor');
        }
      } else {
        Alert.alert('Error', data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setNewItem({ ...newItem, ImageItem: result.assets[0].uri });
      console.log("Image selected:", result.assets[0].uri);
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
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={require('./assets/bg_img.png')}
          style={styles.backgroundImage}
        />
      </View>

      <View style={styles.formContainer}>
        <Image source={require('./assets/EvsuLOGO.png')} style={styles.logo} />
        <Text style={styles.title}>EVSU CANTEEN</Text>
        <Text style={styles.connectionStatus}>{connectionStatus}</Text>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username or Email:</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your username or email"
              value={usernameOrEmail}
              onChangeText={setUsernameOrEmail}
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password:</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>SIGN IN</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.link} onPress={() => { }}>
          Forget Password
        </Text>
        <Text style={styles.text}>
          Don't have an account?{' '}
          <Text
            style={styles.link}

          >
            <TouchableOpacity onPress={() => navigation.navigate('VendorSignUp')}>
              <Text style={styles.signupText}>Sign up</Text>
            </TouchableOpacity>
          </Text>
        </Text>


      </View>
    </View>
  );
}




