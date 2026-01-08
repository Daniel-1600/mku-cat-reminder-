interface HeroPageProps {
  onNavigateToAuth?: () => void;
}

export default function HeroPage({ onNavigateToAuth }: HeroPageProps) {
  const features = [
    {
      title: "Never Miss a Deadline",
      description: "Smart notifications for all your CAT assignments and tests",
      icon: "🎯",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      title: "Track Your Progress",
      description: "Visual analytics to monitor your study performance",
      icon: "📊",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Smart Calendar",
      description: "Organize all your CAT schedules in one place",
      icon: "📅",
      gradient: "from-orange-500 to-amber-500",
    },
    {
      title: "Find Course Mates",
      description: "Connect and chat with classmates taking the same courses",
      icon: "💬",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      title: "Auto Portal Sync",
      description:
        "Automatically checks your portal daily for new CATs and updates",
      icon: "🔄",
      gradient: "from-indigo-500 to-purple-500",
    },
  ];

  const stats = [
    { value: "5000+", label: "Active Students" },
    { value: "98%", label: "On-Time Submissions" },
    { value: "24/7", label: "Smart Reminders" },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Subtle Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 px-6 py-5 backdrop-blur-md bg-black/50 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center text-xl">
              🐱
            </div>
            <span className="text-xl font-semibold text-white">CATAlert</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm">
            <a
              href="#features"
              className="text-gray-400 hover:text-white transition"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-gray-400 hover:text-white transition"
            >
              How It Works
            </a>
            <a
              href="#testimonials"
              className="text-gray-400 hover:text-white transition"
            >
              Reviews
            </a>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onNavigateToAuth}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-40">
        <div className="text-center space-y-10">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
            <span className="text-white">Never miss a deadline</span>
            <br />
            <span className="bg-linear-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Stay on track
            </span>
          </h1>

          <p className="text-base md:text-lg text-gray-400 leading-relaxed max-w-3xl mx-auto">
            CATAlert is the ultimate deadline tracking platform.
            <br />
            Start your journey with smart reminders, CAT tracking, instant
            notifications,
            <br />
            real-time sync, portal integration, and course mate connections.
          </p>

          <div className="flex flex-wrap gap-3 justify-center pt-4">
            <button
              onClick={onNavigateToAuth}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-sm transition-all flex items-center gap-2"
            >
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Start your project
            </button>
            <button className="px-5 py-2.5 bg-transparent hover:bg-white/5 text-white rounded-md font-medium text-sm border border-gray-700 hover:border-gray-600 transition-all flex items-center gap-2">
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <a href="#how-it-works"> How it works</a>
            </button>
          </div>
        </div>
      </section>

      {/* Product Screenshot Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-4 overflow-hidden">
            {/* Placeholder for screenshot - replace src with your actual image */}
            <img
              src="/path-to-your-screenshot.png"
              alt="CATAlert Dashboard Preview"
              className="w-full h-auto rounded-lg shadow-2xl"
            />
            {/* Alternative: Placeholder if no image yet */}
            <div className="w-full aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">📸</div>
                <p className="text-gray-400 text-lg">Dashboard Screenshot</p>
                <p className="text-gray-500 text-sm mt-2">
                  Replace with actual product image
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="relative z-10 max-w-7xl mx-auto px-6 py-32 border-t border-gray-800"
      >
        <div className="text-center mb-20">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            <span className="text-white">Everything you need to</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              ace your CATs
            </span>
          </h2>
          <p className="text-sm text-gray-400">
            Powerful features designed for your success
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* First feature - spans 2 rows on the left */}
          <div className="md:row-span-2 group p-10 bg-gradient-to-b from-gray-900/80 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 hover:border-gray-700 transition-all duration-300 flex flex-col">
            <div className="text-5xl mb-6 text-blue-500">
              {features[0].icon}
            </div>
            <h3 className="text-xl font-bold mb-4 text-white">
              {features[0].title}
            </h3>
            <p className="text-gray-400 text-base leading-relaxed">
              {features[0].description}
            </p>
          </div>

          {/* Remaining features - 2x2 grid on the right */}
          {features.slice(1).map((feature, index) => (
            <div
              key={index + 1}
              className="group p-10 bg-gradient-to-b from-gray-900/80 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 hover:border-gray-700 transition-all duration-300"
            >
              <div className="text-5xl mb-6 text-blue-500">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-4 text-white">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-base leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="relative z-10 max-w-7xl mx-auto px-6 py-20"
      >
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 text-white">How It Works</h2>
          <p className="text-base text-gray-300">
            CATAlert simplifies deadline tracking with intelligent automation
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Sign Up & Setup",
              desc: "Create your free account and personalize your dashboard with your CAT exam preferences and schedule",
              icon: "👤",
            },
            {
              step: "02",
              title: "Automated Tracking",
              desc: "Our system automatically monitors official CAT portals for registration deadlines, exam dates, and result announcements",
              icon: "📝",
            },
            {
              step: "03",
              title: "Smart Notifications",
              desc: "Receive timely push notifications, email alerts, and SMS reminders before every critical deadline",
              icon: "🔔",
            },
          ].map((item, index) => (
            <div key={index} className="relative text-center">
              <div className="text-8xl font-bold text-blue-500/10 mb-4">
                {item.step}
              </div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-6xl mb-6">
                {item.icon}
              </div>
              <div className="mt-12">
                <h3 className="text-lg font-bold mb-3 text-white">
                  {item.title}
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Details */}
        <div className="mt-16 p-8 bg-gray-900 backdrop-blur-sm rounded-2xl border border-blue-500/20">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-base font-bold mb-3 text-blue-400">
                🎯 Why CATAlert?
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Missing a CAT registration deadline can delay your MBA journey
                by an entire year. CATAlert ensures you never miss crucial dates
                by automatically syncing with official IIM portals and sending
                you multi-channel reminders at the perfect time.
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold mb-3 text-blue-400">
                ⚡ Key Features
              </h3>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>✓ Real-time sync with official CAT websites</li>
                <li>
                  ✓ Customizable reminder intervals (1 week, 3 days, 1 day
                  before)
                </li>
                <li>✓ Portal credential manager for quick access</li>
                <li>✓ Deadline countdowns on your dashboard</li>
                <li>✓ Multi-device synchronization</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-32">
        <div className="bg-gradient-to-b from-gray-900 to-gray-900/50 rounded-2xl backdrop-blur-xl border border-gray-800 p-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">
            Ready to never miss a deadline?
          </h2>
          <p className="text-sm text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of students who are staying on top of their CAT
            preparation with CATAlert.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={onNavigateToAuth}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-sm transition-all flex items-center gap-2"
            >
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Start your free trial
            </button>
            <button className="px-5 py-2.5 bg-transparent hover:bg-white/5 text-white rounded-md font-medium text-sm border border-gray-700 hover:border-gray-600 transition-all flex items-center gap-2">
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Schedule a demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center text-xl">
                  🐱
                </div>
                <span className="text-lg font-semibold text-white">
                  CATAlert
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                Your ultimate CAT deadline companion
              </p>
            </div>

            {[
              { title: "Product", links: ["Features", "Pricing", "Demo"] },
              { title: "Resources", links: ["Blog", "Help Center", "API"] },
              { title: "Company", links: ["About", "Careers", "Contact"] },
            ].map((col, index) => (
              <div key={index}>
                <h4 className="font-medium mb-4 text-white text-sm">
                  {col.title}
                </h4>
                <ul className="space-y-3">
                  {col.links.map((link, i) => (
                    <li key={i}>
                      <a
                        href="#"
                        className="text-gray-500 hover:text-gray-300 transition text-sm"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © 2025 CATAlert. All rights reserved.
            </p>
            <div className="flex gap-8">
              {["Privacy", "Terms", "Cookies"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-gray-500 hover:text-gray-300 transition text-sm"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
