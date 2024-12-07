import React, { useState } from "react";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useBasket } from "./BasketContext";
import Icon from "react-native-vector-icons/MaterialIcons";

const FloatingBasket = () => {
  const navigation = useNavigation();
  const { basket } = useBasket();

  // Initialize position state
  const [pan] = useState(new Animated.ValueXY());
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      pan.setOffset({
        x: pan.x._value,
        y: pan.y._value,
      });
      pan.setValue({ x: 0, y: 0 });
    },
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
      useNativeDriver: false,
    }),
    onPanResponderRelease: (e, gesture) => {
      pan.flattenOffset();
      // Save the last position
      setLastPosition({
        x: pan.x._value,
        y: pan.y._value,
      });
    },
    onPanResponderEnd: (e, gesture) => {
      const moveThreshold = 5;
      if (
        Math.abs(gesture.dx) < moveThreshold &&
        Math.abs(gesture.dy) < moveThreshold
      ) {
        navigation.navigate("Basket");
      }
    },
  });

  return (
    <Animated.View
      style={[
        styles.floatingBasket,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.basketContainer}>
        <Icon name="shopping-basket" size={24} color="white" />
        {basket.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{basket.length}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  floatingBasket: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#800000",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 999,
  },
  basketContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "#ff4444",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 6,
  },
});

export default FloatingBasket;
