import React, { useContext, useState, useEffect } from "react";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import PayPalButton from "../components/PayPalButton";

const ncrBarangayMap = {
  Manila: {
    1000: [
      "Ermita",
      "Malate",
      "Paco",
      "Pandacan",
      "Sampaloc",
      "San Miguel",
      "Santa Mesa",
      "Tondo",
    ],
    1008: ["Santa Cruz"],
    1016: ["Quiapo"],
    1017: ["Binondo", "Intramuros"],
  },
  "Quezon City": {
    1100: ["Diliman", "Loyola Heights", "UP Campus", "Ateneo Campus"],
    1101: ["Project 6", "Bagong Pag-asa"],
    1103: ["Cubao", "E. Rodriguez", "Imelda"],
    1110: ["Novaliches Proper", "Sauyo"],
    1123: ["Libis", "Bagumbayan", "Eastwood City"],
  },
  Makati: {
    1200: ["Poblacion", "Urdaneta", "Bel-Air"],
    1235: ["Salcedo Village"],
  },
  Pasig: {
    1600: ["Ortigas Center", "Kapitolyo", "Ugong"],
    1604: ["Caniogan"],
  },
  Taguig: {
    1630: ["Fort Bonifacio (BGC)", "Ususan"],
    1634: ["Western Bicutan"],
  },
  // ... rest of the cities from the map
  Caloocan: { 1400: ["Grace Park East", "Grace Park West"] },
  "Las Piñas": { 1740: ["Almanza", "Pilar Village"] },
  Pasay: { 1300: ["San Isidro", "Malibay"] },
  Mandaluyong: { 1550: ["Plainview", "Highway Hills"] },
  "San Juan": { 1500: ["Greenhills", "Little Baguio"] },
  Valenzuela: { 1440: ["Polo", "Malinta"] },
  Marikina: { 1800: ["Barangka", "Concepcion Uno"] },
  Navotas: { 1409: ["Navotas West", "San Roque"] },
  Malabon: { 1404: ["Tonsuya", "Dampalit"] },
  Muntinlupa: { 1770: ["Alabang", "Ayala Alabang"] },
  Pateros: { 1620: ["Aguho", "Sto. Rosario"] },
};

const cityOptions = Object.keys(ncrBarangayMap);

const PlaceOrder = () => {
  // --- STATE & CONTEXT ---
  const [method, setMethod] = useState("cod"); // Default method
  const [isFinalizing, setIsFinalizing] = useState(false); // Used for PayPal processing state

  const {
    navigate,
    backendUrl,
    token,
    cartItems,
    setCartItems,
    // 🚨 IMPORTANT: Ensure this is correctly named getTotalCartAmount if that's what ShopContext exports
    getTotalCartAmount,
    delivery_fee,
    products,
    user,
  } = useContext(ShopContext);

  const [availableBarangays, setAvailableBarangays] = useState([]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    barangay: "",
    zipcode: "",
    phone: "",
  });

  // --- EFFECT: Load User Profile and Address ---
  useEffect(() => {
    if (user) {
      // Apply profile data if available
      const [firstName = "", lastName = ""] = user.name?.split(" ") || [];
      const initialCity = user.address?.city || "";

      const initialFormData = {
        firstName: firstName,
        lastName: lastName,
        email: user.email || "",
        street: user.address?.street || "",
        city: initialCity,
        barangay: user.address?.barangay || "",
        zipcode: user.address?.zipcode || "",
        phone: user.phone || "",
      };
      setFormData(initialFormData);

      // Populate barangay options based on user's saved city
      if (initialCity) {
        updateBarangayOptions(initialCity);
      }
    }
  }, [user, navigate]);

  // --- ADDRESS HANDLERS ---
  const updateBarangayOptions = (city) => {
    const cityData = ncrBarangayMap[city];
    if (cityData) {
      const allBarangays = Object.values(cityData).flat().sort();
      setAvailableBarangays(allBarangays);
    } else {
      setAvailableBarangays([]);
    }
  };

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setFormData((data) => ({ ...data, [name]: value }));
  };

  const onCityChangeHandler = (event) => {
    const newCity = event.target.value;

    setFormData((data) => ({
      ...data,
      city: newCity,
      barangay: "", // Reset dependent field
      zipcode: "", // Reset dependent field
    }));

    updateBarangayOptions(newCity);
  };

  const onBarangayChangeHandler = (event) => {
    const newBarangay = event.target.value;
    const currentCity = formData.city;
    let newZipcode = "";

    if (currentCity && newBarangay) {
      const cityData = ncrBarangayMap[currentCity];

      for (const zip in cityData) {
        if (cityData[zip].includes(newBarangay)) {
          newZipcode = zip;
          break;
        }
      }
    }

    if (newZipcode) {
      toast.info(`Zipcode automatically set to ${newZipcode}`);
    }

    // Update both barangay and zipcode
    setFormData((data) => ({
      ...data,
      barangay: newBarangay,
      zipcode: newZipcode,
    }));
  };

  // --- ORDER & SUBMISSION LOGIC ---
  const buildOrderData = () => {
    let orderItems = [];
    for (const productId in cartItems) {
      // NOTE: This assumes cartItems structure is {productId: {size: quantity, ...}}
      for (const size in cartItems[productId]) {
        if (cartItems[productId][size] > 0) {
          const productInfo = products.find(
            (product) => product._id === productId
          );
          if (productInfo) {
            // Create a clean item object for the backend
            orderItems.push({
              _id: productInfo._id,
              name: productInfo.name,
              price: productInfo.price,
              size: size,
              quantity: cartItems[productId][size],
            });
          }
        }
      }
    }
    return {
      address: formData,
      items: orderItems,
      // 🚨 IMPORTANT: Use the correct function name here
      amount: getTotalCartAmount() + delivery_fee,
      delivery_fee: delivery_fee,
    };
  };

  // Handler called by PayPalButton on successful payment
  const handleFinalizeOrder = async (paypalResponse) => {
    if (!paypalResponse || !paypalResponse.payment_id) {
      toast.error("PayPal approval missing payment ID.");
      return;
    }

    setIsFinalizing(true);
    const orderData = buildOrderData();
    const url = `${backendUrl}/api/order/paypal/finalize`;

    try {
      const response = await axios.post(
        url,
        { ...orderData, paymentId: paypalResponse.payment_id },
        { headers: { token } }
      );

      if (response.data.success) {
        setCartItems({});
        toast.success("Payment successful! Order placed. Redirecting...");
        setTimeout(() => navigate("/orders"), 1000);
      } else {
        toast.error(
          response.data.message ||
            "Failed to confirm order in database. Payment successful, please contact support."
        );
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "A critical error occurred after payment.";
      toast.error(errorMsg);
    } finally {
      setIsFinalizing(false);
    }
  };

  // Primary Submission Handler (for COD/Stripe methods)
  const onSubmitHandler = async (event) => {
    event.preventDefault();

    // Basic validation checks
    // 🚨 IMPORTANT: Use the correct function name here
    if (getTotalCartAmount() === 0) {
      toast.error(
        "Your cart is empty. Please add items before placing an order."
      );
      return;
    }
    if (!token) {
      toast.error("You must be logged in to place an order.");
      return;
    }
    if (!formData.city || !formData.barangay) {
      toast.error("Please select both City and Barangay for delivery.");
      return;
    }

    // If PayPal is selected, the submission is handled by the PayPalButton component, so we exit.
    if (method === "paypal") {
      return;
    }

    setIsFinalizing(true); // Re-using this state for all processing
    const orderData = buildOrderData();

    try {
      let endpoint =
        method === "stripe" ? "/api/order/place-stripe" : "/api/order/place";

      const response = await axios.post(backendUrl + endpoint, orderData, {
        headers: { token },
      });

      if (response.data.success) {
        if (method === "stripe" && response.data.session_url) {
          window.location.replace(response.data.session_url);
        } else {
          setCartItems({});
          toast.success("Order placed successfully!");
          navigate("/orders");
        }
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Order submission error:", error);
      toast.error("An error occurred while placing the order.");
    } finally {
      setIsFinalizing(false);
    }
  };

  // --- RENDER ---
  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t"
    >
      {/* ------------- Left Side - Delivery Information ---------------- */}
      <div className="flex flex-col gap-4 w-full sm:max-w-[480px]">
        <div className="text-xl sm:text-2xl my-3">
          <Title text1={"DELIVERY"} text2={"INFORMATION"} />
        </div>
        <div className="flex gap-3">
          <input
            required
            onChange={onChangeHandler}
            name="firstName"
            value={formData.firstName}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="First name"
          />
          <input
            required
            onChange={onChangeHandler}
            name="lastName"
            value={formData.lastName}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="Last name"
          />
        </div>
        <input
          required
          onChange={onChangeHandler}
          name="email"
          value={formData.email}
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="email"
          placeholder="Email address"
        />
        <input
          required
          onChange={onChangeHandler}
          name="street"
          value={formData.street}
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="text"
          placeholder="House no. and Street Address"
        />
        <div className="flex gap-3">
          {/* 1. City Dropdown */}
          <select
            required
            name="city"
            value={formData.city}
            onChange={onCityChangeHandler}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          >
            <option value="">Select City (NCR)</option>
            {cityOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          {/* 2. Barangay Dropdown (Conditional) */}
          <select
            required
            name="barangay"
            value={formData.barangay}
            onChange={onBarangayChangeHandler}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            disabled={!formData.city}
          >
            <option value="">
              {formData.city ? "Select Barangay" : "Select a City First"}
            </option>
            {availableBarangays.map((barangay) => (
              <option key={barangay} value={barangay}>
                {barangay}
              </option>
            ))}
          </select>
        </div>
        {/* 3. Zipcode (Auto-filled/Read-only) */}
        <input
          required
          onChange={onChangeHandler}
          name="zipcode"
          value={formData.zipcode}
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="text"
          placeholder="Zipcode (Auto-filled)"
          readOnly
        />
        <input
          required
          onChange={onChangeHandler}
          name="phone"
          value={formData.phone}
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="number"
          placeholder="Phone"
        />
      </div>

      {/* ------------- Right Side (Cart & Payment) ------------------ */}
      <div className="mt-8">
        <div className="mt-8 min-w-80">
          <CartTotal />
        </div>
        <div className="mt-12">
          <Title text1={"PAYMENT"} text2={"METHOD"} />
          <div className="flex gap-3 flex-col lg:flex-row">
            {/* Stripe Selection */}
            <div
              onClick={() => setMethod("stripe")}
              className={`flex items-center gap-3 border p-2 px-3 cursor-pointer rounded-lg transition-all duration-200 ${
                method === "stripe"
                  ? "border-green-500 shadow-md"
                  : "border-gray-300"
              }`}
            >
              <div
                className={`min-w-3.5 h-3.5 border rounded-full ${
                  method === "stripe"
                    ? "bg-green-400 border-green-400"
                    : "border-gray-400"
                }`}
              ></div>
              <img
                className="h-5 mx-4"
                src={assets.stripe_logo}
                alt="Stripe Logo"
              />
            </div>
            {/* COD Selection */}
            <div
              onClick={() => setMethod("cod")}
              className={`flex items-center gap-3 border p-2 px-3 cursor-pointer rounded-lg transition-all duration-200 ${
                method === "cod"
                  ? "border-green-500 shadow-md"
                  : "border-gray-300"
              }`}
            >
              <div
                className={`min-w-3.5 h-3.5 border rounded-full ${
                  method === "cod"
                    ? "bg-green-400 border-green-400"
                    : "border-gray-400"
                }`}
              ></div>
              <p className=" text-gray-500 text-sm font-medium mx-4">
                CASH ON DELIVERY
              </p>
            </div>
            {/* PayPal Selection */}
            <div
              onClick={() => setMethod("paypal")}
              className={`flex items-center gap-3 border p-2 px-3 cursor-pointer rounded-lg transition-all duration-200 ${
                method === "paypal"
                  ? "border-green-500 shadow-md"
                  : "border-gray-300"
              }`}
            >
              <div
                className={`min-w-3.5 h-3.5 border rounded-full ${
                  method === "paypal"
                    ? "bg-green-400 border-green-400"
                    : "border-gray-400"
                }`}
              ></div>
              <img
                className="h-5 mx-4"
                src={assets.paypal_logo}
                alt="PayPal Logo"
              />
            </div>
          </div>

          {/* Conditional Submission Button / PayPal Component */}
          {method === "paypal" ? (
            <div className="mt-4 relative">
              <PayPalButton
                // 🚨 IMPORTANT: Use the correct function name here
                amount={getTotalCartAmount() + delivery_fee}
                orderData={buildOrderData()}
                onFinalizeOrder={handleFinalizeOrder}
                isDisabled={isFinalizing}
              />
              {isFinalizing && (
                <p className="text-center text-sm text-green-600 mt-2">
                  Finalizing order...
                </p>
              )}
            </div>
          ) : (
            <div className="w-full text-end mt-8">
              <button
                type="submit"
                className="bg-black text-white px-16 py-3 text-sm font-medium rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
                disabled={
                  isFinalizing || !token || !formData.city || !formData.barangay
                }
              >
                {isFinalizing
                  ? "PROCESSING..."
                  : method === "stripe"
                  ? "PROCEED TO PAYMENT"
                  : "PLACE ORDER"}
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
