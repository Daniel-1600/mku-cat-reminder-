import { useState, useEffect } from "react";
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
} from "../services/pushNotifications";

interface NotificationSettingsProps {
  darkMode?: boolean;
}

export default function NotificationSettings({
  darkMode = true,
}: NotificationSettingsProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testLoading, setTestLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    setLoading(true);
    try {
      const supported = isPushSupported();
      setIsSupported(supported);

      if (supported) {
        setPermission(getNotificationPermission());

        // Check if already subscribed
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      }
    } catch (error) {
      console.error("Error checking notification status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableNotifications = async () => {
    setLoading(true);
    setMessage("");
    try {
      // Register service worker first
      await registerServiceWorker();

      // Request permission
      const newPermission = await requestNotificationPermission();
      setPermission(newPermission);

      if (newPermission === "granted") {
        // Subscribe to push
        const subscription = await subscribeToPush();
        if (subscription) {
          setIsSubscribed(true);
          setMessage("✅ Notifications enabled! You'll receive CAT reminders.");
        } else {
          setMessage(
            "⚠️ Could not subscribe to notifications. Please try again."
          );
        }
      } else if (newPermission === "denied") {
        setMessage(
          "❌ Notification permission denied. Please enable it in browser settings."
        );
      }
    } catch (error) {
      console.error("Error enabling notifications:", error);
      setMessage("❌ Failed to enable notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setLoading(true);
    setMessage("");
    try {
      const success = await unsubscribeFromPush();
      if (success) {
        setIsSubscribed(false);
        setMessage("Notifications disabled.");
      }
    } catch (error) {
      console.error("Error disabling notifications:", error);
      setMessage("❌ Failed to disable notifications.");
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setTestLoading(true);
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("❌ Please log in first.");
        return;
      }

      // Also show a local notification immediately as a test
      if (Notification.permission === "granted") {
        new Notification("🐱 CATAlert Test (Local)", {
          body: "This is a local test notification!",
          icon: "/vite.svg",
        });
      }

      const response = await fetch(
        "http://localhost:3000/api/notifications/test",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        setMessage("✅ " + data.message + " (Check bottom-right of screen!)");
      } else {
        setMessage("❌ " + data.message);
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      setMessage("❌ Failed to send test notification.");
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`${
          darkMode ? "bg-[#0d1e36]" : "bg-white"
        } rounded-xl p-6 border ${
          darkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          <span className="text-gray-400">Checking notification status...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${
        darkMode ? "bg-[#0d1e36]" : "bg-white"
      } rounded-xl p-6 border ${
        darkMode ? "border-gray-700" : "border-gray-200"
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <svg
            className="w-6 h-6 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-lg">Push Notifications</h3>
          <p
            className={`text-sm ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Get browser notifications for CAT reminders
          </p>
        </div>
      </div>

      {!isSupported ? (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-400 text-sm">
            ⚠️ Push notifications are not supported in this browser. Please use
            Chrome, Firefox, or Edge.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  isSubscribed ? "bg-green-500" : "bg-gray-500"
                }`}
              ></div>
              <span>
                {isSubscribed
                  ? "Notifications enabled"
                  : permission === "denied"
                  ? "Notifications blocked"
                  : "Notifications disabled"}
              </span>
            </div>

            {isSubscribed ? (
              <button
                onClick={handleDisableNotifications}
                disabled={loading}
                className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                Disable
              </button>
            ) : (
              <button
                onClick={handleEnableNotifications}
                disabled={loading || permission === "denied"}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {permission === "denied" ? "Blocked" : "Enable"}
              </button>
            )}
          </div>

          {/* Test Button */}
          {isSubscribed && (
            <button
              onClick={handleTestNotification}
              disabled={testLoading}
              className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {testLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  Send Test Notification
                </>
              )}
            </button>
          )}

          {/* Permission Denied Help */}
          {permission === "denied" && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm mb-2">
                Notifications are blocked. To enable them:
              </p>
              <ol className="text-red-300 text-sm list-decimal list-inside space-y-1">
                <li>Click the lock icon in the address bar</li>
                <li>Find "Notifications" in the permissions</li>
                <li>Change it to "Allow"</li>
                <li>Refresh the page</li>
              </ol>
            </div>
          )}

          {/* Message */}
          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.includes("✅")
                  ? "bg-green-500/10 border border-green-500/30 text-green-400"
                  : message.includes("❌")
                  ? "bg-red-500/10 border border-red-500/30 text-red-400"
                  : "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400"
              }`}
            >
              {message}
            </div>
          )}

          {/* Info */}
          <div
            className={`text-xs ${
              darkMode ? "text-gray-500" : "text-gray-400"
            }`}
          >
            <p>You'll receive notifications for:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>CAT reminders 1 hour before start</li>
              <li>New CATs found during sync</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
