import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";

const CartTotal = () => {
  // 🚨 FIX: Renamed getCartAmount to the correct getTotalCartAmount
  // Added defensive defaults to prevent potential crashes if context is null
  const {
    currency = "₱",
    delivery_fee = 0,
    getTotalCartAmount = () => 0,
  } = useContext(ShopContext) || {};

  const subtotal = getTotalCartAmount();
  const total = subtotal === 0 ? 0 : subtotal + delivery_fee;

  // Helper function to format the amount safely
  const formatAmount = (amount) => {
    // Ensure amount is treated as a number and formatted to 2 decimal places
    return `${currency} ${Number(amount).toFixed(2)}`;
  };

  return (
    <div className="w-full">
      <div className="text-2xl">
        <Title text1={"CART"} text2={"TOTALS"} />
      </div>

      <div className="flex flex-col gap-2 mt-2 text-sm">
        {/* Subtotal Calculation */}
        <div className="flex justify-between">
          <p>Subtotal</p>
          <p className="font-semibold">{formatAmount(subtotal)}</p>
        </div>
        <hr />
        {/* Shipping Fee */}
        <div className="flex justify-between">
          <p>Shipping Fee</p>
          <p className="font-semibold">{formatAmount(delivery_fee)}</p>
        </div>
        <hr />
        {/* Final Total */}
        <div className="flex justify-between text-base font-bold text-gray-800">
          <b>Total</b>
          <b>{formatAmount(total)}</b>
        </div>
      </div>
    </div>
  );
};

export default CartTotal;
