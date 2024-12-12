import React, { createContext, useState, useContext } from "react";

export const BasketContext = createContext();

export const BasketProvider = ({ children }) => {
  const [basket, setBasket] = useState([]);

  const addToBasket = (item) => {
    setBasket((prevBasket) => {
      // Check if item already exists in basket (matching item_name, price, and vendor_username)
      const existingItemIndex = prevBasket.findIndex(
        (basketItem) =>
          basketItem.item_name === item.item_name &&
          basketItem.Price === item.Price &&
          basketItem.vendor_username === item.vendor_username
      );

      if (existingItemIndex !== -1) {
        // If item exists, update quantity
        const updatedBasket = [...prevBasket];
        const existingItem = updatedBasket[existingItemIndex];
        updatedBasket[existingItemIndex] = {
          ...existingItem,
          quantity: parseInt(existingItem.quantity) + parseInt(item.quantity),
        };
        return updatedBasket;
      } else {
        // If item doesn't exist, add as new item with unique basketId
        const itemWithKey = {
          ...item,
          basketId: `${item.item_name}-${item.vendor_username}-${Date.now()}`,
        };
        return [...prevBasket, itemWithKey];
      }
    });
  };

  const removeFromBasket = (itemToRemove) => {
    setBasket((prevBasket) =>
      prevBasket.filter((item) => item.basketId !== itemToRemove.basketId)
    );
  };

  const clearBasket = () => {
    setBasket([]);
  };

  const updateQuantity = (basketId, newQuantity) => {
    setBasket((prevBasket) =>
      prevBasket.map((item) =>
        item.basketId === basketId
          ? { ...item, quantity: parseInt(newQuantity) }
          : item
      )
    );
  };

  const value = {
    basket: basket || [],
    addToBasket,
    removeFromBasket,
    clearBasket,
    setBasket,
    updateQuantity,
  };

  return (
    <BasketContext.Provider value={value}>{children}</BasketContext.Provider>
  );
};

export const useBasket = () => {
  const context = useContext(BasketContext);
  if (!context) {
    throw new Error("useBasket must be used within a BasketProvider");
  }
  return context;
};
