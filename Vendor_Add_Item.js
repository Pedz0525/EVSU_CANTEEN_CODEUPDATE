import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker"; // Import ImagePicker
import { API_URL } from './config';
import AntDesign from '@expo/vector-icons/AntDesign';
export default function Vendor_Add_Item({ navigation, route }) {

    const { email, vendor_id } = route.params;
    const [category, setCategory] = useState("");
    const [status, setStatus] = useState("");
    const [image, setImage] = useState(null); // State for selected image
    const [loading, setLoading] = useState(false); // Add loading state
    const [itemName, setItemName] = useState('');
    const [itemDescription, setItemDescription] = useState('');
    const [itemPrice, setItemPrice] = useState('');


    const pickImage = async () => {
        // Request permission to access the media library
        console.log("Add Item");
        console.log(vendor_id);
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert("Permission to access media library is required!");
            return;
        }

        // Launch the image picker
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri); // Save the image URI
        }
    };

    const handleAddItem = async () => {
        console.log('Item Name:', itemName); // Debugging line
        if (!itemName.trim() || !itemDescription.trim() || !itemPrice.trim() || !image) {
            Alert.alert('Error', 'All fields are required, including an image');

            return;
        }

        setLoading(true); // Start loading indicator

        const formData = new FormData();
        formData.append('name', itemName.trim());
        formData.append('description', itemDescription.trim());
        formData.append('price', itemPrice.trim());
        formData.append('vendor_id', vendor_id);
        if (category.trim()) formData.append('category', category.trim());
        if (status.trim()) formData.append('status', status.trim());
        formData.append('image', {
            uri: image,
            name: 'item-image.jpg',
            type: 'image/jpeg',
        });

        // Log each part of the FormData
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }

        try {
            const response = await fetch(`${API_URL}/add_item`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    // Do not set 'Content-Type' here
                },
                body: formData,
            });

            const data = await response.json();
            console.log('Server Response:', data); // Log the server response

            if (data.success) {
                Alert.alert('Success', 'Item added successfully');
                navigation.replace("Vendor");
                // Clear form fields
                setItemName('');
                setItemDescription('');
                setItemPrice('');
                setImage(null);
            } else {
                throw new Error(data.message || 'Failed to add item');
            }
        } catch (error) {
            console.error('Error adding item:', error);
            Alert.alert('Error', error.message || 'Failed to add item. Please try again.');
        } finally {
            setLoading(false); // Stop loading indicator
        }
    };

    const handlePress = (tab) => {

        if (tab === 'Home') {
            navigation.replace("Vendor"); // Navigate to AddItem screen
        }
        if (tab === 'Profile') {
            navigation.goBack();

        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.storeInfo}>
                    <Image
                        style={styles.profileImage}
                        source={require('./assets/EvsuLOGO.png')}
                    />
                    <View style={styles.storeDetails}>
                        <Text style={styles.storeName}>Evsu Canteen</Text>
                    </View>
                </View>
            </View>

            {/* Form */}
            <View style={styles.form}>
                <Text style={styles.title}>Create Food</Text>
                {/* Image Upload */}
                {image && (
                    <Image
                        source={{ uri: image }}
                        style={styles.image}
                    />
                )}
                <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                    <Text style={styles.uploadText}>
                        {image ? "Change Image" : "Choose Image"}
                    </Text>
                </TouchableOpacity>

                <TextInput
                    style={styles.input}
                    placeholder="Item name"
                    onChangeText={setItemName}
                    value={itemName} />

                <TextInput
                    style={styles.input}
                    placeholder="Item Price"
                    keyboardType="numeric"
                    onChangeText={setItemPrice} />


                <TextInput
                    style={styles.input}
                    placeholder="Description"
                    multiline
                    onChangeText={setItemDescription} />

                {/* Category Picker */}
                <Picker
                    selectedValue={category}
                    style={styles.picker}
                    onValueChange={setCategory}
                >
                    <Picker.Item label="Select Category" value="" />
                    <Picker.Item label="Food" value="Food" />
                    <Picker.Item label="Drinks" value="Drinks" />
                </Picker>

                {/* Status Picker */}
                <Picker
                    selectedValue={status}
                    style={styles.picker}
                    onValueChange={setStatus}
                >
                    <Picker.Item label="Select Status" value="" />
                    <Picker.Item label="Available" value="Available" />
                    <Picker.Item label="Unavailable" value="Unavailable" />
                    <Picker.Item label="Out of Stock" value="Out of Stock" />
                </Picker>



                <TouchableOpacity
                    style={styles.updateButton}
                    onPress={handleAddItem} // Call handleAddItem on press
                    disabled={loading}
                >
                    <Text style={styles.updateButtonText}>Add Item</Text>
                </TouchableOpacity>



            </View>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity onPress={() => handlePress('Home')}>
                    <Text style={styles.tabText}><AntDesign name="home" size={24} color="white" /></Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handlePress('Add')}>
                    <Text style={styles.tabText}><AntDesign name="pluscircleo" size={35} color="black" /></Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handlePress('Profile')}>
                    <Text style={styles.tabText}><AntDesign name="user" size={24} color="white" /></Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8f8f8" },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#7a0000',
        padding: 10,
    },
    username: { color: "#fff", fontSize: 18 },
    form: { padding: 20, flex: 1 },
    title: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 10,
        borderRadius: 8,
        marginBottom: 16,
        backgroundColor: "#fff",
    },
    picker: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        marginBottom: 16,
        backgroundColor: "#fff",
    },
    uploadButton: {
        backgroundColor: "#e0e0e0",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginBottom: 16,
    },
    uploadText: { color: "#333" },
    imagePreview: { width: 100, height: 100, marginTop: 10 },
    bottomNav: {
        flexDirection: "row",
        backgroundColor: "#7D1A1A",
        justifyContent: "space-around",
        paddingVertical: 10,
        height: 100,
    },
    updateButton: {
        backgroundColor: '#7D1A1A',
        padding: 15,
        borderRadius: 5,
        marginTop: 10,
    },
    updateButtonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16,
    },
    navButton: { alignItems: "center" },

    tabText: {
        color: '#fff',
        fontSize: 16,
    },
    image: {
        width: '50%',
        height: '23%',
        alignSelf: 'center',
        marginBottom: 10,
    },
    storeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#7a0000', // Background color similar to the image
        padding: 1,
        borderRadius: 8,
        marginBottom: 0,
        marginTop: 0,
    },
    profileImage: {
        width: 50,
        height: 50,
        borderRadius: 40,
        backgroundColor: '#ccc',
        marginRight: 10,
    },
    storeDetails: {
        flex: 1,
    },
    storeName: {
        color: '#fff',
        fontSize: 15, // Adjust font size for prominence
        fontWeight: 'bold',
        fontFamily: 'Cochin',
    },


});


