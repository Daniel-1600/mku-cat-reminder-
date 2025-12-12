/**
 * Push Notification Service
 * Handles browser push notifications for CAT reminders
 */

const API_URL = "http://localhost:3000/api";

// VAPID public key - This should match the server's VAPID key
// Generate with: npx web-push generate-vapid-keys
let VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

/**
 * Fetch VAPID key from server if not available from env
 */
async function getVapidKey(): Promise<string> {
  if (VAPID_PUBLIC_KEY) return VAPID_PUBLIC_KEY;

  try {
    const response = await fetch(`${API_URL}/notifications/vapid-key`);
    if (response.ok) {
      const data = await response.json();
      VAPID_PUBLIC_KEY = data.publicKey;
      console.log("VAPID key fetched from server");
    }
  } catch (error) {
    console.error("Failed to fetch VAPID key:", error);
  }
  return VAPID_PUBLIC_KEY;
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  return Notification.permission;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    console.warn("Push notifications not supported");
    return "denied";
  }

  const permission = await Notification.requestPermission();
  console.log("Notification permission:", permission);
  return permission;
}

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service workers not supported");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    console.log("Service Worker registered:", registration.scope);
    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return null;
  }
}

/**
 * Convert URL-safe base64 to Uint8Array (for VAPID key)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    // Get VAPID key (from env or server)
    const vapidKey = await getVapidKey();

    if (!subscription && vapidKey) {
      // Subscribe with VAPID key
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      console.log("Push subscription created:", subscription.endpoint);

      // Send subscription to server
      await saveSubscriptionToServer(subscription);
    } else if (!vapidKey) {
      console.error("VAPID key not available - cannot subscribe to push");
      return null;
    }

    return subscription;
  } catch (error) {
    console.error("Failed to subscribe to push:", error);
    return null;
  }
}

/**
 * Save push subscription to server
 */
async function saveSubscriptionToServer(
  subscription: PushSubscription
): Promise<void> {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    await fetch(`${API_URL}/notifications/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ subscription }),
    });
    console.log("Subscription saved to server");
  } catch (error) {
    console.error("Failed to save subscription:", error);
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();

      // Notify server
      const token = localStorage.getItem("token");
      if (token) {
        await fetch(`${API_URL}/notifications/unsubscribe`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      }

      console.log("Unsubscribed from push notifications");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Failed to unsubscribe:", error);
    return false;
  }
}

/**
 * Show a local notification (fallback when service worker isn't available)
 */
export function showLocalNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (!("Notification" in window)) {
    console.warn("Notifications not supported");
    return null;
  }

  if (Notification.permission !== "granted") {
    console.warn("Notification permission not granted");
    return null;
  }

  const defaultOptions: NotificationOptions = {
    icon: "/vite.svg",
    badge: "/vite.svg",
    vibrate: [200, 100, 200],
    requireInteraction: false,
    ...options,
  };

  return new Notification(title, defaultOptions);
}

/**
 * Show CAT reminder notification
 */
export function showCATReminder(cat: {
  subject_name: string;
  cat_date: string;
  cat_time?: string | null;
  cat_number: number;
}): Notification | null {
  const date = new Date(cat.cat_date);
  const dateStr = date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const timeStr = cat.cat_time || "Time TBA";

  return showLocalNotification(`🚨 CAT ${cat.cat_number} Reminder!`, {
    body: `${cat.subject_name}\n📅 ${dateStr} at ${timeStr}`,
    tag: `cat-reminder-${cat.subject_name}`,
    requireInteraction: true,
  });
}

/**
 * Initialize push notifications
 */
export async function initializePushNotifications(): Promise<boolean> {
  if (!isPushSupported()) {
    console.log("Push notifications not supported in this browser");
    return false;
  }

  // Register service worker
  const registration = await registerServiceWorker();
  if (!registration) return false;

  // Check permission
  const permission = getNotificationPermission();

  if (permission === "granted") {
    // Already have permission, subscribe
    await subscribeToPush();
    return true;
  } else if (permission === "default") {
    // Need to request permission
    console.log("Notification permission not yet requested");
    return false;
  } else {
    // Permission denied
    console.log("Notification permission denied");
    return false;
  }
}

/**
 * Listen for messages from service worker
 */
export function onServiceWorkerMessage(
  callback: (data: { type: string; data: unknown }) => void
): void {
  navigator.serviceWorker.addEventListener("message", (event) => {
    callback(event.data);
  });
}
