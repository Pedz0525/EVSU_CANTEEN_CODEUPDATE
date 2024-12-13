import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import EVSU_Canteen_Login from "./EVSU_Canteen_Login";
import EVSU_Canteen_Signup from "./EVSU_Canteen_Signup";
import EVSU_Canteen_Forgot from "./EVSU_Canteen_Forgot";
import EVSU_Student_DashBoard from "./EVSU_Student_DashBoard";
import ResetPassword from "./resetpassword";
import VerifyOTP from "./VerifyOTP";
import Profile from "./Profile";
import resetpassword from "./resetpassword";
import UserTypeSelection from "./UserTypeSelection";
import VendorDashboard from "./VendorDashboard";
import StoreProduct from "./StoreProduct";
import Basket from "./Basket";
import { BasketProvider } from "./BasketContext";
import Vendor_Dashboard from "./Vendor_Dashboard";
import ProfileUpload from "./ProfileUpload";
import Vendor_Add_Item from "./Vendor_Add_Item";
import EditItem from "./EditItem";
import Vendor_Profile from "./Vendor_Profile";
import Vendor_Order from "./Vendor_Order";
import Vendor_Sign_up from "./Vendor_Sign_up";
import Vendor_Login from "./Vendor_Login";

const Stack = createStackNavigator();

export default function App() {
  return (
    <BasketProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="UserTypeSelection">
          <Stack.Screen
            name="Login"
            component={EVSU_Canteen_Login}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Signup"
            component={EVSU_Canteen_Signup}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Forgot"
            component={EVSU_Canteen_Forgot}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="VerifyOTP" // Add this screen
            component={VerifyOTP}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ResetPassword"
            component={ResetPassword}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Stud_Dashboard"
            component={EVSU_Student_DashBoard}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Profile"
            component={Profile}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="resetpassword"
            component={resetpassword}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="UserTypeSelection"
            component={UserTypeSelection}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Vendor_Dashboard"
            component={VendorDashboard}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="StoreProduct"
            component={StoreProduct}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Basket"
            component={Basket}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="VendorLogin"
            component={Vendor_Login}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Vendor"
            component={Vendor_Dashboard}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProfileUpload"
            component={ProfileUpload}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddItem"
            component={Vendor_Add_Item}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EditItem"
            component={EditItem}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="VendorProfile"
            component={Vendor_Profile}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="VendorOrder"
            component={Vendor_Order}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="VendorSignUp"
            component={Vendor_Sign_up}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </BasketProvider>
  );
}
