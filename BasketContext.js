import React, { createContext, useContext, useState } from "react";

const BasketContext = createContext();

export const BasketProvider = ({ children }) => {
  const [basket, setBasket] = useState([]);

  const addToBasket = (item) => {
    setBasket((currentBasket) => {
      // Check if item already exists in basket
      const existingItemIndex = currentBasket.findIndex(
        (basketItem) => basketItem.id === item.id
      );

      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        const updatedBasket = [...currentBasket];
        updatedBasket[existingItemIndex] = {
          ...updatedBasket[existingItemIndex],
          quantity:
            parseInt(updatedBasket[existingItemIndex].quantity) +
            parseInt(item.quantity),
        };
        return updatedBasket;
      }

      // Add new item if it doesn't exist
      return [...currentBasket, item];
    });
  };

  const removeFromBasket = (itemToRemove) => {
    setBasket((currentBasket) =>
      currentBasket.filter((item) => item.id !== itemToRemove.id)
    );
  };

  const clearBasket = () => {
    setBasket([]);
  };

  return (
    <BasketContext.Provider
      value={{ basket, addToBasket, removeFromBasket, clearBasket }}
    >
      {children}
    </BasketContext.Provider>
  );
};

export const useBasket = () => {
  const context = useContext(BasketContext);
  if (!context) {
    throw new Error("useBasket must be used within a BasketProvider");
  }
  return context;
};
