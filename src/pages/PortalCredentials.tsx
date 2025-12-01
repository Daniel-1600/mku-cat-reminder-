import { useState, useEffect } from "react";
import axios from "axios";

interface PortalCredentialsProps {
  onSkip?: () => void;
  onConnect?: () => void;
}

export default function PortalCredentials({
  onSkip,
  onConnect,
}: PortalCredentialsProps) {
  const [portalConnected, setPortalConnected] = useState(false);
  const [portalUsername, setPortalUsername] = useState("");
  const [connectedAt, setConnectedAt] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const API_URL = "http://localhost:3000/api/portal";

  useEffect(() => {
    checkPortalStatus();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const checkPortalStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/status`, getAuthHeaders());
      setPortalConnected(response.data.portalConnected);
      setPortalUsername(response.data.portalUsername);
      setConnectedAt(response.data.connectedAt);
    } catch (error: any) {
      console.error("Error checking portal status:", error);
      if (error.response?.status === 401) {
        setError("Session expired. Please login again.");
      }
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!formData.username || !formData.password) {
      setError("Please enter both username and password");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/connect`,
        {
          portalUsername: formData.username,
          portalPassword: formData.password,
        },
        getAuthHeaders()
      );

      setMessage(response.data.message);
      setPortalConnected(true);
      setPortalUsername(formData.username);
      setFormData({ username: "", password: "" });

      // Navigate to dashboard after successful connection
      setTimeout(() => {
        if (onConnect) {
          onConnect();
        }
      }, 1500);
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to connect portal");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your MKU portal?")) {
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.delete(
        `${API_URL}/disconnect`,
        getAuthHeaders()
      );

      setMessage(response.data.message);
      setPortalConnected(false);
      setPortalUsername("");
      setConnectedAt(null);
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to disconnect portal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-black to-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Connect Your MKU Portal
          </h1>
          <p className="text-gray-400">
            Connect your MKU portal credentials to enable automatic CAT schedule
            syncing. You can skip this step and add it later from settings.
          </p>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-green-400">{message}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-black/50 backdrop-blur-xl rounded-2xl p-8 border border-blue-500/30">
          {portalConnected ? (
            /* Connected State */
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-green-400 font-semibold">
                    Portal Connected
                  </p>
                  <p className="text-sm text-gray-400">
                    Your CATs will be synced automatically
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-4 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-400">Portal Username</span>
                  <span className="text-white font-medium">
                    {portalUsername}
                  </span>
                </div>

                {connectedAt && (
                  <div className="flex justify-between items-center p-4 bg-gray-900/50 rounded-lg">
                    <span className="text-gray-400">Connected Since</span>
                    <span className="text-white font-medium">
                      {new Date(connectedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={onConnect}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-2xl hover:shadow-blue-500/50 transition"
              >
                Continue to Dashboard
              </button>

              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="w-full py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg font-semibold hover:bg-red-500/20 transition disabled:opacity-50"
              >
                {loading ? "Disconnecting..." : "Disconnect Portal"}
              </button>

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-300">
                  <strong>Note:</strong> Your credentials are encrypted and
                  stored securely. We only use them to fetch your CAT schedule
                  from the MKU portal.
                </p>
              </div>
            </div>
          ) : (
            /* Not Connected State */
            <form onSubmit={handleConnect} className="space-y-6">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-300">
                  <strong>Why connect?</strong> We'll automatically fetch your
                  CAT schedules from the MKU portal so you never miss a test!
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  MKU Portal Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-900 text-white border border-blue-500/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition placeholder-gray-400"
                  placeholder="Enter your portal username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  MKU Portal Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-900 text-white border border-blue-500/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition placeholder-gray-400"
                    placeholder="Enter your portal password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-2xl hover:shadow-blue-500/50 transition disabled:opacity-50"
              >
                {loading ? "Connecting..." : "Connect Portal"}
              </button>

              {/* Skip Button */}
              {onSkip && (
                <button
                  type="button"
                  onClick={onSkip}
                  className="w-full py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg font-semibold hover:bg-gray-700 transition"
                >
                  Skip for Now
                </button>
              )}

              <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-400 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <div className="text-sm text-gray-300">
                    <p className="font-semibold mb-1">Security Notice</p>
                    <p>
                      Your portal credentials are encrypted before storage. We
                      never store passwords in plain text and only use them to
                      access your CAT schedule.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
