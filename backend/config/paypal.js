import "dotenv/config"; // Load environment variables first!
import paypal from "@paypal/checkout-server-sdk";

// Use environment variables for security
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

// Initialize core components
let environment;
// Default client that will throw a runtime error if used without initialization
let client = {
  execute: (request) => {
    console.error(
      "CRITICAL: PayPal Client is not initialized. Check server .env file."
    );
    throw new Error(
      "PayPal Client is not initialized. Check server .env file."
    );
  },
};

if (clientId && clientSecret) {
  // Only initialize the environment if credentials are found
  environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
  client = new paypal.core.PayPalHttpClient(environment);
} else {
  // If not found, log a severe warning
  console.error(
    "CRITICAL: PayPal credentials (CLIENT_ID or SECRET) are missing from the environment!"
  );
}

// Exporting the client and the necessary request class
export default {
  client,
  // ordersCreateRequest is a class, so it's safe to export even if client fails.
  ordersCreateRequest: paypal.orders.OrdersCreateRequest,
};
