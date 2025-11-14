import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";

const PAYPAL_CLIENT_ID =
  import.meta.env.VITE_PAYPAL_CLIENT_ID || window.PAYPAL_CLIENT_ID;

const PayPalButton = ({ amount, onFinalizeOrder, isDisabled }) => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const buttonRendered = useRef(false);

  useEffect(() => {
    if (
      window.paypal ||
      document.querySelector(`script[src*="${PAYPAL_CLIENT_ID}"]`)
    ) {
      setIsScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&components=buttons`;
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => {
      console.error("Failed to load PayPal SDK");
      toast.error("Failed to load PayPal. Please refresh the page.");
    };

    document.body.appendChild(script);

    return () => {
      const scriptElement = document.querySelector(
        `script[src*="${PAYPAL_CLIENT_ID}"]`
      );
      if (scriptElement) {
        scriptElement.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (
      !isScriptLoaded ||
      !window.paypal ||
      buttonRendered.current ||
      isDisabled
    ) {
      return;
    }

    const container = document.getElementById("paypal-button-container");
    if (!container) return;

    container.innerHTML = "";

    window.paypal
      .Buttons({
        createOrder: (data, actions) => {
          const paypalAmount = amount.toFixed(2);
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  currency_code: "USD",
                  value: paypalAmount,
                },
                description: "E-Commerce Order Payment",
              },
            ],
          });
        },

        onApprove: async (data, actions) => {
          try {
            const capture = await actions.order.capture();
            console.log("Payment successful:", capture);

            onFinalizeOrder({
              payment_id: data.orderID,
              is_success: true,
            });
          } catch (err) {
            console.error("Error capturing payment:", err);
            toast.error("Payment approved but failed to confirm order.");
          }
        },

        onError: (err) => {
          console.error("PayPal Error:", err);
          toast.error("PayPal payment failed. Please try again.");
        },
      })
      .render("#paypal-button-container");

    buttonRendered.current = true;

    return () => {
      if (container) {
        container.innerHTML = "";
      }
      buttonRendered.current = false;
    };
  }, [isScriptLoaded, amount, onFinalizeOrder, isDisabled]);

  return (
    <div>
      <div
        id="paypal-button-container"
        className="w-full"
        style={{ minHeight: "150px" }}
      >
        {!isScriptLoaded && (
          <div className="text-center p-4 border rounded text-gray-600">
            Loading PayPal...
          </div>
        )}
      </div>
      {isDisabled && (
        <div className="text-center text-gray-500 text-sm mt-2">
          Processing payment...
        </div>
      )}
    </div>
  );
};

export default PayPalButton;
