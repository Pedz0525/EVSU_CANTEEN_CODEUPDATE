import React from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function EVSU_Canteen_Login({ navigation }) {
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

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username or Email:</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your username or email"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password:</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              secureTextEntry
            />
          </View>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>SIGN IN</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.link} onPress={() => {}}>Forget Password</Text> 
        <Text style={styles.text}> 
          Don't have an account?{' '} 
          <Text style={styles.link} onPress={() => navigation.navigate('Signup')}>Sign Up</Text> 
        </Text>
      </View>
    </View>
  );
  return
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  imageContainer: {
    height: '33%',
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 16,
    alignItems: 'center',
    marginTop: -30,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginTop: -50,
    borderWidth: 4,
    borderColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 24,
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    color: '#333',
    marginBottom: 4,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingLeft: 8,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#ff4c4c',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  link: {
    color: '#ff4c4c',
    fontWeight: 'bold',
    marginTop: 12,
  },
  text: {
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
});


