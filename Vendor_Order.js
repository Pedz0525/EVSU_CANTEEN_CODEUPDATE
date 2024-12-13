import React, { useState, useEffect } from 'react';
import { View, BackHandler, StyleSheet, Image, Text, TouchableOpacity, FlatList, Modal, Alert } from 'react-native';
import axios from 'axios';
import { API_URL } from './config'; // Assuming you have a config.js for your API URL
import MaterialIcons from '@expo/vector-icons/MaterialIcons';


export default function Vendor_Order({ navigation, route }) {
    const { vendor_id } = route.params; // Retrieve vendor_id from route params
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState('');


    useEffect(() => {
        // Define the back button handler
        const backAction = () => {
            navigation.replace("Vendor"); // Replace the current screen with the "Vendor" screen
            return true; // Prevent the default back button behavior
        };

        // Add the back button listener
        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction
        );

        // Clean up the listener on unmount
        return () => backHandler.remove();
    }, [navigation]);

    // Fetch orders every 5 seconds
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await axios.get(`${API_URL}/orders`, {
                    params: { vendor_id }, // Pass vendor_id as a query parameter
                });
                setOrders(response.data);
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
        const intervalId = setInterval(fetchOrders, 5000); // Poll every 5 seconds

        return () => clearInterval(intervalId); // Clear interval on unmount
    }, [vendor_id]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                {/* Centered Image */}
                <Image
                    style={styles.loadingImage}
                    source={require('./assets/EvsuLOGO.png')} // Replace with your image path
                />

                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    // Update order status
    const updateOrderStatus = async () => {
        if (!selectedStatus) {
            Alert.alert('Error', 'Please select a status');
            return;
        }

        try {
            const response = await axios.post(`${API_URL}/update-order-status`, {
                order_id: selectedOrderId,
                status: selectedStatus,
            });

            if (response.status === 200) {
                // Update the order status locally to reflect the changes
                const updatedOrders = orders.map((order) => {
                    if (order.order_id === selectedOrderId) {
                        return { ...order, status: selectedStatus };
                    }
                    return order;
                });
                setOrders(updatedOrders);
                setModalVisible(false);
                Alert.alert('Success', `Order status updated to ${selectedStatus}!`);
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            Alert.alert('Error', 'There was an issue updating the order status');
        }
    };
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true, // AM/PM format
        };
        return date.toLocaleString('en-US', options);
    };

    const renderItem = ({ item }) => (
        <View style={styles.orderItem}>
            <Text style={styles.orderHeader}>Order Details</Text>
            <View style={styles.orderRow}>
                <Text style={styles.label}>Customer Name:</Text>
                <Text style={styles.value}>{item.name}</Text>
            </View>
            <View style={styles.orderRow}>
                <Text style={styles.label}>Order Date:</Text>
                <Text style={styles.value}>{formatDate(item.order_date)}</Text>
            </View>
            <View style={styles.orderRow}>
                <Text style={styles.label}>Total Price:</Text>
                <Text style={styles.value}>₱{item.total_price}</Text>
            </View>
            <View style={styles.orderRow}>
                <Text style={styles.label}>Status:</Text>
                <Text style={[styles.value, item.status === 'Pending' ? styles.pending : styles.completed]}>
                    {item.status}
                </Text>
            </View>
            <View style={styles.itemSection}>
                <Text style={styles.orderHeader}>Item Details</Text>
                <View style={styles.orderRow}>
                    <Text style={styles.label}>Item Name:</Text>
                    <Text style={styles.value}>{item.item_name}</Text>
                </View>
                <View style={styles.orderRow}>
                    <Text style={styles.label}>Quantity:</Text>
                    <Text style={styles.value}>{item.quantity}</Text>
                </View>
                <View style={styles.orderRow}>
                    <Text style={styles.label}>Item Price:</Text>
                    <Text style={styles.value}>₱{item.item_price}</Text>
                </View>
            </View>
            <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                    setSelectedOrderId(item.order_id);
                    setModalVisible(true);
                }}
            >
                <Text style={styles.confirmButtonText}>Change Status</Text>
            </TouchableOpacity>
        </View>
    );

    const handleStatusSelect = (status) => {
        setSelectedStatus(status);
        updateOrderStatus(); // Automatically update status once it's selected
    };

    return (
        <View style={styles.container}>

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.replace("Vendor")} style={styles.backButton}>
                    <MaterialIcons name="food-bank" size={37} color="white" />
                </TouchableOpacity>
                <Text style={styles.stallName}>Orders</Text>
            </View>


            {/* Order List */}
            <FlatList
                data={orders}
                keyExtractor={(item) => item.order_id.toString()}
                renderItem={renderItem}
                refreshing={loading}
                onRefresh={() => setLoading(true)} // Allow pull-to-refresh
            />

            {/* Modal for selecting the order status */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalHeader}>Select Order Status</Text>
                        <TouchableOpacity
                            style={styles.statusOption}
                            onPress={() => handleStatusSelect('Confirmed')}
                        >
                            <Text style={styles.statusOptionText}>Confirm</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.statusOption}
                            onPress={() => handleStatusSelect('Order Recieved')}
                        >
                            <Text style={styles.statusOptionText}>Order Recieved</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.statusOption}
                            onPress={() => handleStatusSelect('Pending')}
                        >
                            <Text style={styles.statusOptionText}>Pending</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.statusOption}
                            onPress={() => handleStatusSelect('Cancelled')}
                        >
                            <Text style={styles.statusOptionText}>Cancelled</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.closeModalButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.closeModalButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    header: {
        backgroundColor: '#7a0000',
        padding: 5,
        flexDirection: 'row', // Align children horizontally
        // Space out the back button and text
        alignItems: 'center', // Vertically center the children
    },
    backButton: {
        padding: 8,
    },
    stallName: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center', // Center the text (optional, depending on design)
    },
    orderItem: {
        backgroundColor: '#fff',
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    orderHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
        textAlign: 'center',
    },
    orderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    label: {
        fontWeight: 'bold',
        color: '#555',
    },
    value: {
        color: '#333',
    },
    pending: {
        color: '#f39c12',
        fontWeight: 'bold',
    },
    completed: {
        color: '#27ae60',
        fontWeight: 'bold',
    },
    itemSection: {
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 8,
    },
    confirmButton: {
        backgroundColor: '#6b151f',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginTop: 20,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 8,
        width: '80%',
        alignItems: 'center',
    },
    modalHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    statusOption: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginBottom: 10,
        backgroundColor: '#6b151f',
        borderRadius: 5,
        alignItems: 'center',
        width: '100%',
    },
    statusOptionText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeModalButton: {
        marginTop: 20,
        backgroundColor: '#ff6347',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    closeModalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1, // Full screen height
        justifyContent: 'center', // Center horizontally
        alignItems: 'center', // Center vertically
        backgroundColor: '#f5f5f5', // Optional: background color for loading screen
    },
    loadingImage: {
        width: 100, // Adjust width as needed
        height: 100, // Adjust height as needed
        marginBottom: 20, // Space between image and text
    },
});
