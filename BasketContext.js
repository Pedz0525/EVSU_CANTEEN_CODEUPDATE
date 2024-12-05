import React, { createContext, useState } from "react";

export const BasketContext = createContext();

export const BasketProvider = ({ children }) => {
  const [basket, setBasket] = useState([]);
  const [basketPosition, setBasketPosition] = useState({ x: 0, y: 0 });

  return (
    <BasketContext.Provider
      value={{ basket, setBasket, basketPosition, setBasketPosition }}
    >
      {children}
    </BasketContext.Provider>
  );
};
