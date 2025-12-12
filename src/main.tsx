import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import {
  initializePushNotifications,
  onServiceWorkerMessage,
} from "./services/pushNotifications";

// Initialize push notifications on app load
initializePushNotifications().then((success) => {
  if (success) {
    console.log("Push notifications initialized successfully");
  }
});

// Listen for service worker messages
onServiceWorkerMessage((data) => {
  console.log("Message from service worker:", data);
  if (data.type === "NOTIFICATION_CLICK") {
    // Handle notification click - navigate to relevant page if needed
    console.log("Notification clicked:", data.data);
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
