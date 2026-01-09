import { useState, useEffect } from "react";

interface ProfileData {
  displayName: string;
  bio: string;
  isDiscoverable: boolean;
  showCourses: boolean;
}

interface ScrapeSettings {
  scrapeFrequency: string;
  lastScrapedAt: string | null;
}

export default function ProfileSettings() {
  const [profile, setProfile] = useState<ProfileData>({
    displayName: "",
    bio: "",
    isDiscoverable: true,
    showCourses: true,
  });
  const [scrapeSettings, setScrapeSettings] = useState<ScrapeSettings>({
    scrapeFrequency: "every_2_days",
    lastScrapedAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingScrape, setSavingScrape] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const API_URL = "http://localhost:3000/api";

  useEffect(() => {
    fetchProfile();
    fetchScrapeSettings();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const response = await fetch(`${API_URL}/social/profile/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setProfile({
          displayName: data.profile.name || "",
          bio: data.profile.bio || "",
          isDiscoverable: data.profile.is_discoverable ?? true,
          showCourses: data.profile.show_courses ?? true,
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchScrapeSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/portal/scrape-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      setScrapeSettings({
        scrapeFrequency: data.scrapeFrequency || "every_2_days",
        lastScrapedAt: data.lastScrapedAt,
      });
    } catch (err) {
      console.error("Error fetching scrape settings:", err);
    }
  };

  const saveScrapeFrequency = async (frequency: string) => {
    setSavingScrape(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/portal/scrape-settings`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ scrapeFrequency: frequency }),
      });

      const data = await response.json();
      if (response.ok) {
        setScrapeSettings({ ...scrapeSettings, scrapeFrequency: frequency });
        setMessage({
          type: "success",
          text: "Portal check frequency updated!",
        });
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to connect to server" });
    } finally {
      setSavingScrape(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/social/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to update profile",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to connect to server" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Profile Settings</h2>
        <p className="text-gray-400 mt-1">
          Manage how other students can find and interact with you
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-500/10 border border-green-500/30 text-green-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 space-y-6">
        {/* Display Name */}
        <div>
          <label className="block text-white font-medium mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={profile.displayName}
            onChange={(e) =>
              setProfile({ ...profile, displayName: e.target.value })
            }
            placeholder="How you want to appear to classmates"
            className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-gray-500 text-sm mt-1">
            Leave empty to use your registered name
          </p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-white font-medium mb-2">Bio</label>
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            placeholder="Tell classmates a bit about yourself..."
            rows={3}
            maxLength={200}
            className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-gray-500 text-sm mt-1">
            {profile.bio.length}/200 characters
          </p>
        </div>

        {/* Privacy Settings */}
        <div className="space-y-4">
          <h3 className="text-white font-medium">Privacy Settings</h3>

          {/* Discoverable Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
            <div>
              <p className="text-white font-medium">Allow Discovery</p>
              <p className="text-gray-400 text-sm">
                Let classmates find you in Course Mates
              </p>
            </div>
            <button
              onClick={() =>
                setProfile({
                  ...profile,
                  isDiscoverable: !profile.isDiscoverable,
                })
              }
              className={`relative w-12 h-6 rounded-full transition-colors ${
                profile.isDiscoverable ? "bg-blue-600" : "bg-slate-600"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  profile.isDiscoverable ? "translate-x-6" : ""
                }`}
              />
            </button>
          </div>

          {/* Show Courses Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
            <div>
              <p className="text-white font-medium">Show My Courses</p>
              <p className="text-gray-400 text-sm">
                Let others see which courses we share
              </p>
            </div>
            <button
              onClick={() =>
                setProfile({ ...profile, showCourses: !profile.showCourses })
              }
              className={`relative w-12 h-6 rounded-full transition-colors ${
                profile.showCourses ? "bg-blue-600" : "bg-slate-600"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  profile.showCourses ? "translate-x-6" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={saveProfile}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>

      {/* Portal Check Frequency */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 space-y-4">
        <div>
          <h3 className="text-white font-medium flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-400"
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
            Portal Check Frequency
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            How often should we check your portal for new CATs?
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: "daily", label: "Daily", desc: "Every day" },
            {
              value: "every_2_days",
              label: "Every 2 Days",
              desc: "Recommended",
            },
            {
              value: "every_3_days",
              label: "Every 3 Days",
              desc: "Less frequent",
            },
            { value: "weekly", label: "Weekly", desc: "Once a week" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => saveScrapeFrequency(option.value)}
              disabled={savingScrape}
              className={`p-4 rounded-lg border text-left transition-all ${
                scrapeSettings.scrapeFrequency === option.value
                  ? "bg-blue-600/20 border-blue-500 text-blue-400"
                  : "bg-slate-700/50 border-slate-600 text-gray-300 hover:border-slate-500"
              }`}
            >
              <p className="font-medium">{option.label}</p>
              <p className="text-xs text-gray-500 mt-1">{option.desc}</p>
            </button>
          ))}
        </div>

        {scrapeSettings.lastScrapedAt && (
          <p className="text-gray-500 text-sm">
            Last checked:{" "}
            {new Date(scrapeSettings.lastScrapedAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm">
            <p className="text-blue-400 font-medium">Privacy First</p>
            <p className="text-gray-400 mt-1">
              Your email and portal credentials are never shared with other
              users. Only your display name, bio, and shared courses (if
              enabled) are visible to classmates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
