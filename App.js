import React from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import EVSU_Canteen_Login from './EVSU_Canteen_Login';
import EVSU_Canteen_Signup from './EVSU_Canteen_Signup';


const Stack = createStackNavigator();
export default function App() {
  return (
    
    <NavigationContainer>
        <Stack.Navigator initialRouteName='Login'>
          <Stack.Screen name="Login" component={EVSU_Canteen_Login} options={{ headerShown: false }}></Stack.Screen>
          <Stack.Screen name="Signup" component={EVSU_Canteen_Signup} options={{ headerShown: false }}></Stack.Screen>
        </Stack.Navigator>

    </NavigationContainer>



);
};


