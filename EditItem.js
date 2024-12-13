import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import { API_URL } from './config';
import { Picker } from "@react-native-picker/picker";
import { Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const EditItem = ({ route, navigation }) => {
    const { item } = route.params; // Get the item data passed from Vendor_Dashboard
    const [name, setName] = useState(item.item_name);
    const [description, setDescription] = useState(item.description);
    const [price, setPrice] = useState(item.price);
    const [category, setCategory] = useState(item.category);
    const [status, setStatus] = useState(item.status);
    const [loading, setLoading] = useState(false);
    const [imageUri, setImageUri] = useState(`${API_URL}${item.item_image}`);
    const [image, setImage] = useState(null); // To store the picked image for upload

    const handleUpdate = async () => {
        try {
            const formData = new FormData();
            formData.append('id', item.item_id);
            formData.append('name', name);
            formData.append('description', description);
            formData.append('price', price);
            formData.append('category', category);
            formData.append('status', status);

            if (image) {
                formData.append('image', {
                    uri: image.uri,
                    type: 'image/jpeg',
                    name: 'item_image.jpg', // You can set dynamic file names
                });
            }

            setLoading(true);
            const response = await axios.put(`${API_URL}/update_item`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setLoading(false);

            if (response.data.success) {
                Alert.alert('Success', 'Item updated successfully');
                navigation.replace("Vendor"); // Navigate back to the previous screen
            } else {
                Alert.alert('Error', response.data.message);
            }
        } catch (error) {
            setLoading(false);
            console.error('Error updating item:', error);
            Alert.alert('Error', 'Failed to update item. Please try again.');
        }
    };

    const handleImagePick = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri); // Update image URI with the picked image
            setImage(result.assets[0]); // Set the picked image for upload
        }
    };

    return (
        <View style={styles.container}>
            {/* Add Image Display */}
            <TouchableOpacity onPress={handleImagePick}>
                <Image
                    source={{ uri: imageUri }} // Use the updated image URI
                    style={styles.image}
                    resizeMode="cover"
                />
            </TouchableOpacity>
            {/* ... existing code ... */}
            <Text style={styles.label}>Item Name</Text>
            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
            />
            <Text style={styles.label}>Description</Text>
            <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
            />
            <Text style={styles.label}>Price</Text>
            <TextInput
                style={styles.input}
                value={price.toString()}
                onChangeText={text => setPrice(parseFloat(text))}
                keyboardType="numeric"
            />
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
                onPress={handleUpdate}
                disabled={loading}
            >
                <Text style={styles.updateButtonText}>Update Profile</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    image: {
        width: '100%', // Adjust width as needed
        height: 200, // Adjust height as needed
        marginBottom: 15, // Space below the image
    },
    updateButton: {
        backgroundColor: '#ff4c4c',
        padding: 15,
        borderRadius: 5,
        marginTop: 10,
    },
    container: {
        padding: 20,
    },
    label: {
        marginBottom: 5,
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
    },
    updateButtonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default EditItem;
