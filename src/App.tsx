import "./App.css";
import { useState, useEffect } from "react";
import AuthPage from "./components/AuthPage";
import HeroPage from "./components/HeroPage";
import DashboardOmani from "./components/DashboardOmani";
import PortalCredentials from "./pages/PortalCredentials";

function App() {
  const [currentPage, setCurrentPage] = useState<
    "hero" | "auth" | "portal" | "dashboard" | "loading"
  >("loading");

  // Check for existing session on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");

      if (token && user) {
        try {
          // Verify token is still valid by making a request
          const response = await fetch("http://localhost:3000/api/dashboard", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            // Token is valid, go directly to dashboard
            setCurrentPage("dashboard");
          } else {
            // Token expired or invalid, clear storage and show hero
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setCurrentPage("hero");
          }
        } catch (error) {
          // Server not available, but we have token - go to dashboard anyway
          // Dashboard will handle offline state
          setCurrentPage("dashboard");
        }
      } else {
        // No token found, show hero page
        setCurrentPage("hero");
      }
    };

    checkAuth();
  }, []);

  // Show loading state while checking auth
  if (currentPage === "loading") {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {currentPage === "hero" ? (
        <HeroPage onNavigateToAuth={() => setCurrentPage("auth")} />
      ) : currentPage === "auth" ? (
        <AuthPage
          onNavigateToHero={() => setCurrentPage("hero")}
          onLoginSuccess={() => setCurrentPage("portal")}
          onSkipPortal={() => setCurrentPage("dashboard")}
        />
      ) : currentPage === "portal" ? (
        <PortalCredentials
          onSkip={() => setCurrentPage("dashboard")}
          onConnect={() => setCurrentPage("dashboard")}
        />
      ) : (
        <DashboardOmani onNavigateToPortal={() => setCurrentPage("portal")} />
      )}
    </div>
  );
}

export default App;
