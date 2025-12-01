import { useState } from "react";
import CATsList from "./CATsList";

export default function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNav, setActiveNav] = useState("dashboard");

  const navItems = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "deadlines", icon: "📅", label: "Deadlines" },
    { id: "tasks", icon: "✓", label: "Tasks" },
    { id: "portals", icon: "🌐", label: "Portals" },
    { id: "analytics", icon: "📈", label: "Analytics" },
    { id: "notifications", icon: "🔔", label: "Notifications" },
    { id: "settings", icon: "⚙️", label: "Settings" },
  ];

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-black text-white" : "bg-gray-50 text-gray-900"
      } transition-colors duration-300`}
    >
      {/* Sidebar - Desktop */}
      <aside
        className={`fixed top-0 left-0 h-full ${
          darkMode
            ? "bg-gray-900 border-blue-500/20"
            : "bg-white border-gray-200"
        } border-r transition-all duration-300 z-40 hidden lg:block ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 border-b border-blue-500/20">
          <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-xl shrink-0">
            🐱
          </div>
          {!sidebarCollapsed && (
            <span className="text-xl font-bold bg-linear-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              CATAlert
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeNav === item.id
                  ? `${
                      darkMode
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-blue-100 text-blue-600"
                    }`
                  : `${
                      darkMode
                        ? "text-gray-400 hover:bg-blue-500/10 hover:text-white"
                        : "hover:bg-gray-100"
                    }`
              } ${sidebarCollapsed ? "justify-center" : ""}`}
              title={sidebarCollapsed ? item.label : ""}
            >
              <span className="text-2xl">{item.icon}</span>
              {!sidebarCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Collapse Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`absolute bottom-6 ${
            sidebarCollapsed ? "left-1/2 -translate-x-1/2" : "right-6"
          } p-2 ${
            darkMode
              ? "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400"
              : "bg-gray-100 hover:bg-gray-200"
          } rounded-lg transition-all`}
        >
          <svg
            className={`w-5 h-5 transition-transform ${
              sidebarCollapsed ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      </aside>

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 lg:hidden transition-opacity ${
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <aside
          className={`fixed top-0 left-0 h-full w-64 ${
            darkMode ? "bg-gray-900" : "bg-white"
          } transition-transform transform ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-6 border-b border-blue-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-xl">
                🐱
              </div>
              <span className="text-xl font-bold bg-linear-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                CATAlert
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className={`p-2 ${
                darkMode ? "hover:bg-blue-500/10" : "hover:bg-gray-100"
              } rounded-lg`}
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveNav(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeNav === item.id
                    ? `${
                        darkMode
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-blue-100 text-blue-600"
                      }`
                    : `${
                        darkMode
                          ? "text-gray-400 hover:bg-blue-500/10 hover:text-white"
                          : "hover:bg-gray-100"
                      }`
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>
      </div>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        {/* Topbar */}
        <header
          className={`sticky top-0 z-30 ${
            darkMode
              ? "bg-gray-900/95 border-blue-500/20"
              : "bg-white/95 border-gray-200"
          } backdrop-blur-sm border-b`}
        >
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left: Mobile Menu + Search */}
            <div className="flex items-center gap-4 flex-1">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className={`lg:hidden p-2 ${
                  darkMode ? "hover:bg-blue-500/10" : "hover:bg-gray-100"
                } rounded-lg`}
                title="Open menu"
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

              {/* Search Bar */}
              <div className="relative max-w-md w-full">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search deadlines, tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 ${
                    darkMode
                      ? "bg-gray-800 border-blue-500/30 text-white placeholder-gray-400"
                      : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                  } border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition`}
                />
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2.5 ${
                  darkMode
                    ? "bg-blue-500/20 hover:bg-blue-500/30"
                    : "bg-gray-100 hover:bg-gray-200"
                } rounded-lg transition-colors`}
                title={
                  darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
                }
              >
                {darkMode ? (
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
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                )}
              </button>

              {/* Notifications */}
              <button
                className={`relative p-2.5 ${
                  darkMode
                    ? "bg-blue-500/20 hover:bg-blue-500/30"
                    : "bg-gray-100 hover:bg-gray-200"
                } rounded-lg transition-colors`}
                title="Notifications"
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
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="flex items-center gap-3 pl-3 border-l border-blue-500/20">
                <div className="hidden sm:block text-right">
                  <div className="text-sm font-medium">John Doe</div>
                  <div
                    className={`text-xs ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    MBA Aspirant
                  </div>
                </div>
                <button
                  className="w-10 h-10 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center font-semibold text-white"
                  title="User profile"
                >
                  JD
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, John! 👋
              </h1>
              <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Here's what's happening with your CAT preparation today.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                {
                  label: "Upcoming Deadlines",
                  value: "5",
                  icon: "📅",
                  color: "bg-gradient-to-br from-blue-500 to-blue-600",
                },
                {
                  label: "Active Tasks",
                  value: "12",
                  icon: "✓",
                  color: "bg-gradient-to-br from-blue-500 to-blue-600",
                },
                {
                  label: "Days Until CAT",
                  value: "45",
                  icon: "🎯",
                  color: "bg-gradient-to-br from-blue-500 to-blue-600",
                },
                {
                  label: "Completion Rate",
                  value: "78%",
                  icon: "📈",
                  color: "bg-gradient-to-br from-blue-500 to-blue-600",
                },
              ].map((stat, index) => (
                <div
                  key={index}
                  className={`p-6 ${
                    darkMode
                      ? "bg-gray-800 border-blue-500/20"
                      : "bg-white border-gray-200"
                  } rounded-xl border hover:shadow-lg hover:shadow-blue-500/20 transition-all`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-2xl`}
                    >
                      {stat.icon}
                    </div>
                    <svg
                      className={`w-5 h-5 ${
                        darkMode ? "text-blue-400" : "text-gray-400"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <CATsList darkMode={darkMode} />
          </div>
        </main>
      </div>
    </div>
  );
}
