import { useState, useEffect } from "react";
import CATsList from "./CATsList";
import CATDeadlines from "../pages/CATDeadlines";
import NotificationSettings from "./NotificationSettings";

interface UserData {
  name: string;
  email: string;
  admNumber: string;
  plan: string;
}

interface DashboardData {
  user: UserData;
  stats: {
    totalCourses: number;
    totalCATs: number;
    upcomingDeadlines: number;
    completionRate: string;
    studyHours: string;
  };
}

interface DashboardProps {
  onNavigateToPortal?: () => void;
  onNavigateToHome?: () => void;
}

export default function Dashboard({
  onNavigateToPortal,
  onNavigateToHome,
}: DashboardProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNav, setActiveNav] = useState("dashboard");
  const [showDeadlinesPage, setShowDeadlinesPage] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const navItems = [
    {
      id: "dashboard",
      icon: (
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
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
      label: "Dashboard",
    },
    {
      id: "deadlines",
      icon: (
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      label: "CAT Deadlines",
    },
    {
      id: "analytics",
      icon: (
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      label: "Analytics",
    },
    {
      id: "reports",
      icon: (
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      label: "Reports",
    },
    {
      id: "notifications",
      icon: (
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
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      ),
      label: "Notifications",
    },
    {
      id: "settings",
      icon: (
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
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      label: "Settings",
    },
    {
      id: "home",
      icon: (
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
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
      label: "Go to Home",
      action: onNavigateToHome,
    },
  ];

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          // Use default data if no token
          setDashboardData({
            user: {
              name: "Student",
              email: "student@mylife.mku.ac.ke",
              admNumber: "N/A",
              plan: "Student Plan",
            },
            stats: {
              totalCourses: 0,
              totalCATs: 0,
              upcomingDeadlines: 0,
              completionRate: "0%",
              studyHours: "0hrs",
            },
          });
          setLoading(false);
          return;
        }

        const response = await fetch("http://localhost:3000/api/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        } else {
          // Fallback to stored user data
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            const user = JSON.parse(storedUser);
            setDashboardData({
              user: {
                name: user.fullName || "Student",
                email: user.email || "",
                admNumber: user.admNumber || "N/A",
                plan: "Student Plan",
              },
              stats: {
                totalCourses: 0,
                totalCATs: 0,
                upcomingDeadlines: 0,
                completionRate: "0%",
                studyHours: "0hrs",
              },
            });
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard:", error);
        // Use localStorage fallback
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setDashboardData({
            user: {
              name: user.fullName || "Student",
              email: user.email || "",
              admNumber: user.admNumber || "N/A",
              plan: "Student Plan",
            },
            stats: {
              totalCourses: 0,
              totalCATs: 0,
              upcomingDeadlines: 0,
              completionRate: "0%",
              studyHours: "0hrs",
            },
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // If showing deadlines page, render that instead
  if (showDeadlinesPage) {
    return <CATDeadlines onBack={() => setShowDeadlinesPage(false)} />;
  }

  const userName = dashboardData?.user.name || "Student";
  const userPlan = dashboardData?.user.plan || "Student Plan";

  return (
    <div className="min-h-screen bg-[#0a1628] text-white flex">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-[#0d1e36] transition-all duration-300 z-40 hidden lg:flex flex-col ${
          sidebarCollapsed ? "w-20" : "w-60"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-5 border-b border-[#1a2d4a]">
          <div className="w-9 h-9 border-2 border-blue-500 rounded-full flex items-center justify-center shrink-0">
            <span className="text-blue-500 text-lg">🐱</span>
          </div>
          {!sidebarCollapsed && (
            <span className="text-xl font-semibold">CATAlert</span>
          )}
        </div>

        {/* Search */}
        {!sidebarCollapsed && (
          <div className="p-4">
            <input
              type="text"
              placeholder="Search for..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a2d4a] border-none rounded-lg px-4 py-3 text-sm text-gray-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.action) {
                  item.action();
                } else {
                  setActiveNav(item.id);
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeNav === item.id
                  ? "bg-blue-500 text-white"
                  : "text-gray-400 hover:bg-[#1a2d4a] hover:text-white"
              } ${sidebarCollapsed ? "justify-center" : ""}`}
              title={sidebarCollapsed ? item.label : ""}
            >
              {item.icon}
              {!sidebarCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-[#1a2d4a]">
          <div
            className={`flex items-center gap-3 ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
          >
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center font-bold text-sm">
              {getUserInitials(userName)}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{userName}</div>
                <div className="text-xs text-gray-500">{userPlan}</div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`mt-4 w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition-colors ${
              sidebarCollapsed ? "px-2" : ""
            }`}
          >
            {sidebarCollapsed ? "→" : "Logout"}
          </button>
        </div>

        {/* Collapse Button */}
        <button
          title="collapse"
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute top-1/2 -right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg"
        >
          <svg
            className={`w-3 h-3 transition-transform ${
              sidebarCollapsed ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      </aside>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 lg:hidden transition-opacity ${
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <aside
          className={`fixed top-0 left-0 h-full w-60 bg-[#0d1e36] transition-transform ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Logo */}
          <div className="flex items-center justify-between p-5 border-b border-[#1a2d4a]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 border-2 border-blue-500 rounded-full flex items-center justify-center">
                <span className="text-blue-500">🐱</span>
              </div>
              <span className="text-xl font-semibold">CATAlert</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 hover:bg-[#1a2d4a] rounded-lg"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Mobile Nav */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else {
                    setActiveNav(item.id);
                  }
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeNav === item.id
                    ? "bg-blue-500 text-white"
                    : "text-gray-400 hover:bg-[#1a2d4a] hover:text-white"
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Mobile User */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#1a2d4a]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center font-bold">
                {getUserInitials(userName)}
              </div>
              <div>
                <div className="font-medium">{userName}</div>
                <div className="text-xs text-gray-500">{userPlan}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 text-white font-semibold py-3 rounded-xl"
            >
              Logout
            </button>
          </div>
        </aside>
      </div>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-60"
        }`}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-5">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 hover:bg-[#1a2d4a] rounded-lg"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <h1 className="text-2xl lg:text-3xl font-semibold">
            Welcome back, {userName.split(" ")[0]}
          </h1>

          <div className="flex items-center gap-4">
            <button className="hidden sm:flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export data
            </button>
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Generate Report
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Show Notification Settings when notifications tab is active */}
          {activeNav === "notifications" ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Notification Settings</h2>
              <NotificationSettings darkMode={true} />

              <div className="bg-[#0d1e36] rounded-xl p-6 border border-gray-700">
                <h3 className="font-semibold text-lg mb-4">
                  How Notifications Work
                </h3>
                <div className="space-y-4 text-gray-400">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg mt-0.5">
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
                    </div>
                    <div>
                      <p className="font-medium text-white">1-Hour Reminder</p>
                      <p className="text-sm">
                        Get notified 1 hour before each CAT starts
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg mt-0.5">
                      <svg
                        className="w-4 h-4 text-green-400"
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
                    </div>
                    <div>
                      <p className="font-medium text-white">New CAT Alerts</p>
                      <p className="text-sm">
                        Get notified when new CATs are found during sync
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg mt-0.5">
                      <svg
                        className="w-4 h-4 text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        Email Notifications
                      </p>
                      <p className="text-sm">
                        Receive email reminders in addition to push
                        notifications
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {/* Total Courses Card */}
                <div className="bg-[#0d1e36] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-400 text-sm">
                        Total Courses
                      </span>
                    </div>
                    <button
                      className="text-gray-500 hover:text-gray-400"
                      title="More options"
                    >
                      ⋮
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-bold">
                      {dashboardData?.stats.totalCourses || 0}
                    </span>
                    <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-md">
                      {dashboardData?.stats.totalCATs || 0} CATs
                    </span>
                  </div>
                </div>

                {/* Upcoming Deadlines Card - Clickable */}
                <div
                  onClick={() => setShowDeadlinesPage(true)}
                  className="bg-[#0d1e36] rounded-2xl p-5 cursor-pointer hover:bg-[#1a2d4a] transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-400 text-sm">
                        Upcoming Deadlines
                      </span>
                    </div>
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                  <div className="flex items-center gap-3">
                    {(dashboardData?.stats.upcomingDeadlines || 0) === 0 ? (
                      <>
                        <span className="text-2xl">🎉</span>
                        <span className="text-lg font-semibold text-green-400">
                          All Completed!
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-4xl font-bold">
                          {dashboardData?.stats.upcomingDeadlines}
                        </span>
                        <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-1 rounded-md">
                          View all →
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Completion Rate Card */}
                <div className="bg-[#0d1e36] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-gray-400 text-sm">
                        Completion Rate
                      </span>
                    </div>
                    <button className="text-gray-500 hover:text-gray-400">
                      ⋮
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-bold">
                      {dashboardData?.stats.completionRate || "0%"}
                    </span>
                    <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-md">
                      +8.1%
                    </span>
                  </div>
                </div>

                {/* Study Hours Card */}
                <div className="bg-[#0d1e36] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-400 text-sm">Study Hours</span>
                    </div>
                    <button className="text-gray-500 hover:text-gray-400">
                      ⋮
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-bold">
                      {dashboardData?.stats.studyHours || "0hrs"}
                    </span>
                    <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-md">
                      +15.3%
                    </span>
                  </div>
                </div>
              </div>

              {/* CATs List */}
              <CATsList
                darkMode={true}
                onNavigateToPortal={onNavigateToPortal}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
