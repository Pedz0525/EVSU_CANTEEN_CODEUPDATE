import React from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import EVSU_Canteen_Login from './EVSU_Canteen_Login';
import EVSU_Canteen_Signup from './EVSU_Canteen_Signup';
import EVSU_Canteen_Forgot from './EVSU_Canteen_Forgot';
import EVSU_Student_DashBoard from './EVSU_Student_DashBoard';


const Stack = createStackNavigator();
export default function App() {
  return (
    
    <NavigationContainer>
        <Stack.Navigator initialRouteName='Login'>
          <Stack.Screen name="Login" component={EVSU_Canteen_Login} options={{ headerShown: false }}></Stack.Screen>
          <Stack.Screen name="Signup" component={EVSU_Canteen_Signup} options={{ headerShown: false }}></Stack.Screen>
          <Stack.Screen name="Forgot" component={EVSU_Canteen_Forgot} options={{ headerShown: false }}></Stack.Screen>
          <Stack.Screen name="Stud_Dashboard" component={EVSU_Student_DashBoard} options={{ headerShown: false }}></Stack.Screen>
        </Stack.Navigator>
    </NavigationContainer>



);
};


