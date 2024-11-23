import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, ImageBackground } from 'react-native';

const EVSU_Canteen_Forgot = () => {
  const [email, setEmail] = useState('');

  const handleForgotPassword = () => {
    console.log('Forgot Password form submitted:', { email });
  };

  return (
    <ImageBackground source={require('./assets/bg_img.png')} style={styles.background}>
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Forgot Password</Text>
        </View>
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
          />
          <Button title="Send" onPress={handleForgotPassword} color="#ff4c4c" />
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
    borderRadius: 10,
    margin: 20,
  },
  header: {
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
});

export default EVSU_Canteen_Forgot;