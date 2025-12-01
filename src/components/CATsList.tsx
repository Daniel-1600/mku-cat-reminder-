import { useState, useEffect } from "react";
import axios from "axios";

interface CAT {
  id: number;
  subject_code: string;
  subject_name: string;
  cat_date: string;
  cat_time: string | null;
  venue: string | null;
  duration: number | null;
  cat_number: number | null;
}

interface CATsListProps {
  darkMode?: boolean;
  onNavigateToPortal?: () => void;
}

export default function CATsList({
  darkMode = true,
  onNavigateToPortal,
}: CATsListProps) {
  const [cats, setCats] = useState<CAT[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const API_URL = "http://localhost:3000/api/cats";

  useEffect(() => {
    fetchCATs();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const fetchCATs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/upcoming`, getAuthHeaders());
      setCats(response.data.cats);
      setError("");
    } catch (err) {
      const error = err as any;
      // Don't show error for empty database - it's expected on first load
      if (error.response?.status !== 404) {
        console.error("Error fetching CATs:", error);
      }
      setError("");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError("");
      setMessage("");

      const response = await axios.post(
        `${API_URL}/sync`,
        {},
        getAuthHeaders()
      );
      setMessage(response.data.message);

      // Refresh CATs list
      await fetchCATs();
    } catch (err) {
      const error = err as any;
      setError(error.response?.data?.message || "Failed to sync CATs");
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "TBA";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDaysUntil = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const catDate = new Date(dateString);
    catDate.setHours(0, 0, 0, 0);
    const diffTime = catDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 0) return "Past";
    return `${diffDays} days`;
  };

  const getUrgencyColor = (dateString: string) => {
    const days = getDaysUntil(dateString);
    if (days === "Today") return "bg-red-500";
    if (days === "Tomorrow") return "bg-orange-500";
    if (days === "Past") return "bg-gray-500";
    const daysNum = parseInt(days);
    if (daysNum <= 3) return "bg-red-500";
    if (daysNum <= 7) return "bg-yellow-500";
    return "bg-blue-500";
  };

  if (loading) {
    return (
      <div
        className={`${
          darkMode
            ? "bg-gray-800 border-blue-500/20"
            : "bg-white border-gray-200"
        } rounded-xl border p-6`}
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${
        darkMode ? "bg-gray-800 border-blue-500/20" : "bg-white border-gray-200"
      } rounded-xl border p-6`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Upcoming CATs</h2>
        <button
          onClick={handleSync}
          disabled={syncing}
          className={`flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <svg
            className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {syncing ? "Syncing..." : "Sync Now"}
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-400">{message}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* CATs List */}
      {cats.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold mb-2">No CATs Scheduled</h3>
          <p className={`${darkMode ? "text-gray-400" : "text-gray-600"} mb-4`}>
            {error?.includes("Portal credentials not connected")
              ? "You need to connect your MKU portal to sync CAT schedules"
              : "Click 'Sync Now' to fetch your CAT schedules from the MKU portal"}
          </p>
          {error?.includes("Portal credentials not connected") &&
            onNavigateToPortal && (
              <button
                onClick={onNavigateToPortal}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition inline-flex items-center gap-2"
              >
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Connect Portal Now
              </button>
            )}
        </div>
      ) : (
        <div className="space-y-4">
          {cats.map((cat) => (
            <div
              key={cat.id}
              className={`p-4 ${
                darkMode
                  ? "bg-gray-700/50 hover:bg-gray-700"
                  : "bg-gray-50 hover:bg-gray-100"
              } rounded-lg transition-colors border ${
                darkMode ? "border-blue-500/20" : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Subject Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-3 h-3 rounded-full ${getUrgencyColor(
                        cat.cat_date
                      )}`}
                    ></div>
                    <h3 className="font-semibold text-lg">
                      {cat.subject_name}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className={`${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Code:
                      </span>
                      <span className="font-medium">{cat.subject_code}</span>
                    </div>
                    {cat.cat_number && (
                      <div className="flex items-center gap-2">
                        <span
                          className={`${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          CAT:
                        </span>
                        <span className="font-medium">#{cat.cat_number}</span>
                      </div>
                    )}
                    {cat.venue && (
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="font-medium">{cat.venue}</span>
                      </div>
                    )}
                    {cat.duration && (
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="font-medium">{cat.duration} mins</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Date & Time */}
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-400 mb-1">
                    {getDaysUntil(cat.cat_date)}
                  </div>
                  <div
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {formatDate(cat.cat_date)}
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {formatTime(cat.cat_time)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
