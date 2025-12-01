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
  ];

  const stats = [
    { value: "5000+", label: "Active Students" },
    { value: "98%", label: "On-Time Submissions" },
    { value: "24/7", label: "Smart Reminders" },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4 backdrop-blur-sm bg-blue-500/5 border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-2xl">
              🐱
            </div>
            <span className="text-2xl font-bold text-white">CATAlert</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="hover:text-blue-400 transition">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-blue-400 transition">
              How It Works
            </a>
            <a
              href="#testimonials"
              className="hover:text-yellow-300 transition"
            >
              Reviews
            </a>
          </div>

          <button
            onClick={onNavigateToAuth}
            className="px-6 py-2.5 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition transform hover:scale-105"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center space-y-8">
          <div className="inline-block px-4 py-2 bg-blue-500/20 rounded-full border border-blue-500/30 backdrop-blur-sm">
            <span className="text-sm text-blue-300">
              🎓 #1 CAT Deadline Manager
            </span>
          </div>

          <h1 className="text-6xl lg:text-7xl font-bold leading-tight text-white">
            Never Miss a
            <span className="block text-blue-400 animate-pulse">
              CAT Deadline
            </span>
            Again!
          </h1>

          <p className="text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
            Stay on top of your CAT exam prep with intelligent reminders,
            deadline tracking, and progress analytics. Your success is our
            mission.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={onNavigateToAuth}
              className="px-8 py-4 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition transform hover:scale-105"
            >
              Start Free Trial
            </button>
            <button className="px-8 py-4 bg-blue-500/10 backdrop-blur-sm rounded-full font-semibold text-lg border border-blue-500/30 hover:bg-blue-500/20 transition text-blue-400">
              Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 pt-8 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-blue-400">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="relative z-10 max-w-7xl mx-auto px-6 py-20"
      >
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4 text-white">
            Everything You Need to
            <span className="block text-blue-400">Ace Your CATs</span>
          </h2>
          <p className="text-xl text-gray-300">
            Powerful features designed for your success
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 bg-gray-900 backdrop-blur-sm rounded-2xl border border-blue-500/20 hover:bg-gray-800 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30"
            >
              <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">
                {feature.title}
              </h3>
              <p className="text-gray-300 leading-relaxed">
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
          <h2 className="text-5xl font-bold mb-4 text-white">How It Works</h2>
          <p className="text-xl text-gray-300">
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
                <h3 className="text-2xl font-bold mb-3 text-white">
                  {item.title}
                </h3>
                <p className="text-gray-300 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Details */}
        <div className="mt-16 p-8 bg-gray-900 backdrop-blur-sm rounded-2xl border border-blue-500/20">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-3 text-blue-400">
                🎯 Why CATAlert?
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Missing a CAT registration deadline can delay your MBA journey
                by an entire year. CATAlert ensures you never miss crucial dates
                by automatically syncing with official IIM portals and sending
                you multi-channel reminders at the perfect time.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3 text-blue-400">
                ⚡ Key Features
              </h3>
              <ul className="text-gray-300 space-y-2">
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
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <div className="bg-gray-900 rounded-3xl backdrop-blur-xl border border-blue-500/30 p-12 text-center">
          <h2 className="text-5xl font-bold mb-6 text-white">
            Ready to Never Miss a Deadline?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of students who are staying on top of their CAT
            preparation with CATAlert.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={onNavigateToAuth}
              className="px-10 py-5 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition transform hover:scale-105"
            >
              Start Your Free Trial
            </button>
            <button className="px-10 py-5 bg-blue-500/10 backdrop-blur-sm rounded-full font-semibold text-lg border border-blue-500/30 hover:bg-blue-500/20 transition text-blue-400">
              Schedule a Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-blue-500/20 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-xl">
                  🐱
                </div>
                <span className="text-xl font-bold text-white">CATAlert</span>
              </div>
              <p className="text-gray-300 text-sm">
                Your ultimate CAT deadline companion
              </p>
            </div>

            {[
              { title: "Product", links: ["Features", "Pricing", "Demo"] },
              { title: "Resources", links: ["Blog", "Help Center", "API"] },
              { title: "Company", links: ["About", "Careers", "Contact"] },
            ].map((col, index) => (
              <div key={index}>
                <h4 className="font-semibold mb-4 text-white">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link, i) => (
                    <li key={i}>
                      <a
                        href="#"
                        className="text-gray-300 hover:text-blue-400 transition text-sm"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-blue-500/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-300 text-sm">
              © 2025 CATAlert. All rights reserved.
            </p>
            <div className="flex gap-6">
              {["Privacy", "Terms", "Cookies"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-gray-300 hover:text-blue-400 transition text-sm"
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
