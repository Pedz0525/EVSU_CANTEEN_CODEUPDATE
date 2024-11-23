import React, { useState } from 'react';
import { View, Text, TextInput, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

const EVSU_Student_DashBoard = () => {
  const [showStores, setShowStores] = useState(false);

  const handleStoreIconClick = () => {
    setShowStores(true);
  };

  const handleHomeIconClick = () => {
    setShowStores(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.username}>Username</Text>
          <TouchableOpacity style={styles.cartIcon}>
            <Image source={require('./assets/bag_icon.png')} style={styles.icon} resizeMode="contain" />
          </TouchableOpacity>
        </View>
        <TextInput style={styles.searchBar} placeholder="Search" />
      </View>
      <View style={styles.fixedLogoSection}>
        <Image source={require('./assets/EvsuLOGO.png')} style={styles.logo} resizeMode="contain" />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {showStores ? (
          <View style={styles.storeList}>
            <View style={styles.storeItem}>
              <View style={styles.storeImageWrapper}>
                <Image source={require('./assets/placeholder.png')} style={styles.storeImage} resizeMode="contain" />
              </View>
              <Text style={styles.storeName}>Store 1</Text>
              <Text style={styles.storeOwner}>Owner 1</Text>
              <Text style={styles.storeRating}>★★★★☆</Text>
            </View>
            <View style={styles.storeItem}>
              <View style={styles.storeImageWrapper}>
                <Image source={require('./assets/placeholder.png')} style={styles.storeImage} resizeMode="contain" />
              </View>
              <Text style={styles.storeName}>Store 2</Text>
              <Text style={styles.storeOwner}>Owner 2</Text>
              <Text style={styles.storeRating}>★★★★☆</Text>
            </View>
            <View style={styles.storeItem}>
              <View style={styles.storeImageWrapper}>
                <Image source={require('./assets/placeholder.png')} style={styles.storeImage} resizeMode="contain" />
              </View>
              <Text style={styles.storeName}>Store 3</Text>
              <Text style={styles.storeOwner}>Owner 3</Text>
              <Text style={styles.storeRating}>★☆☆☆☆</Text>
            </View>
            <View style={styles.storeItem}>
              <View style={styles.storeImageWrapper}>
                <Image source={require('./assets/placeholder.png')} style={styles.storeImage} resizeMode="contain" />
              </View>
              <Text style={styles.storeName}>Store 4</Text>
              <Text style={styles.storeOwner}>Owner 4</Text>
              <Text style={styles.storeRating}>★★★★★</Text>
            </View>
          </View>
        ) : (
          <View style={styles.scrollableContent}>
            <Image source={require('./assets/placeholder.png')} style={styles.image} resizeMode="contain" />
            <Image source={require('./assets/placeholder.png')} style={styles.image} resizeMode="contain" />
            <Image source={require('./assets/placeholder.png')} style={styles.image} resizeMode="contain" />
            <Image source={require('./assets/placeholder.png')} style={styles.image} resizeMode="contain" />
            <Image source={require('./assets/placeholder.png')} style={styles.image} resizeMode="contain" />
          </View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerIcon} onPress={handleHomeIconClick}>
          <Image source={require('./assets/home_icon.png')} style={styles.houseIcon} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerIcon} onPress={handleStoreIconClick}>
          <Image source={require('./assets/store_icon.png')} style={styles.footerIconImage} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerIcon}>
          <Image source={require('./assets/search_iconbig.png')} style={styles.footerIconImage} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerIcon}>
          <Image source={require('./assets/user_icon.png')} style={styles.footerIconImage} resizeMode="contain" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D9D9D9',
  },
  header: {
    paddingTop: 38,
    padding: 10,
    backgroundColor: '#800000',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  username: {
    color: '#fff',
    fontSize: 18,
    flex: 1,
  },
  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginHorizontal: 10,
  },
  cartIcon: {
    padding: 10,
  },
  icon: {
    width: 24,
    height: 24,
  },
  fixedLogoSection: {
    alignItems: 'center',
    padding: 5,
    backgroundColor: '#800000',
    position: 'absolute',
    top: 138, 
    left: 0,
    right: 0,
    zIndex: 1,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: -40, 
  },
  content: {
    paddingTop: 180, 
  },
  scrollableContent: {
    alignItems: 'center',
    backgroundColor: '#D9D9D9',
    padding: 10,
    paddingTop: 25,
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: 10,
  },
  storeList: {
    padding: 10,
    paddingTop: 25,
    borderRadius: 10,
  },
  storeItem: {
    marginBottom: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#800000',
  },
  storeImageWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    marginBottom: 10,
  },
  storeImage: {
    width: '100%',
    height: '100%',
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  storeOwner: {
    fontSize: 14,
    color: '#555',
  },
  storeRating: {
    fontSize: 14,
    color: '#888',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 11,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  footerIcon: {
    padding: 10,
  },
  houseIcon: {
    width: 26, 
    height: 26, 
  },
  footerIconImage: {
    width: 26,
    height: 26,
  },
});

export default EVSU_Student_DashBoard;
