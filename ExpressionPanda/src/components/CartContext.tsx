// components/CartContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";
// Define types for menu items, selected items, orders, etc.
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface SelectedItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartContextType {
  selectedItems: SelectedItem[];
  addItem: (item: MenuItem) => void;
  removeItem: (index: number) => void;
  clearOrder: () => void;
  setQuantity: (index: number, qty: number) => void;

  subtotal: number;
  tax: number;
  total: number;

  /**
   * Place the current order.
   * @param userId The ID of the current user/employee placing the order.
   * @returns A Promise with the server response or throws an error.
   */
  placeOrder: (userId: number) => Promise<void>;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  // This state is now global
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  // Add item
  const addItem = (item: MenuItem) => {
    setSelectedItems((prev) => {
      const idx = prev.findIndex((x) => x.name === item.name);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      } else {
        return [...prev, { ...item, quantity: 1 }];
      }
    });
  };

  // Remove one item
  const removeItem = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Clear entire order
  const clearOrder = () => setSelectedItems([]);

  // Set quantity
  const setQuantity = (index: number, qty: number) => {
    setSelectedItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: Math.max(0, qty) };
      return updated;
    });
  };

  // Calculate totals
  const subtotal = selectedItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.0825;
  const total = subtotal + tax;

  /**
   * Place Order function inside the context.
   * You can now call `placeOrder(user.id)` from anywhere.
   */
  const placeOrder = async (userId: number) => {
    if (selectedItems.length === 0) {
      throw new Error("Your order is empty. Please add items first.");
    }

    // Make your POST request here
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND}/api/placeOrder`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemAmount: selectedItems,
          total,
          emID: userId,
        }),
      }
    );
    const content = await response.json();

    if (!response.ok) {
      throw new Error(content.error || "Error placing order");
    }

    // If successful, clear the cart
    clearOrder();

    // Return or just console.log the success message
    console.log(content.message);
  };

  const value: CartContextType = {
    selectedItems,
    addItem,
    removeItem,
    clearOrder,
    setQuantity,
    subtotal,
    tax,
    total,
    placeOrder,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Custom hook
export const useCart = () => useContext(CartContext);
