import { useState, useEffect } from "react";

interface CAT {
  id: number;
  subject_code: string;
  subject_name: string;
  cat_date: string;
  cat_time: string | null;
  venue: string;
  cat_number: number;
  duration: number;
}

interface CATDeadlinesProps {
  onBack: () => void;
}

export default function CATDeadlines({ onBack }: CATDeadlinesProps) {
  const [cats, setCats] = useState<CAT[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");

  useEffect(() => {
    fetchCATs();
  }, []);

  const fetchCATs = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch("http://localhost:3000/api/cats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCats(data.cats || []);
      }
    } catch (error) {
      console.error("Error fetching CATs:", error);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredCats = cats.filter((cat) => {
    const catDate = new Date(cat.cat_date);
    catDate.setHours(0, 0, 0, 0);

    if (filter === "upcoming") {
      return catDate >= today;
    } else if (filter === "past") {
      return catDate < today;
    }
    return true;
  });

  const sortedCats = [...filteredCats].sort((a, b) => {
    return new Date(a.cat_date).getTime() - new Date(b.cat_date).getTime();
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getDaysUntil = (dateStr: string) => {
    const catDate = new Date(dateStr);
    catDate.setHours(0, 0, 0, 0);
    const diffTime = catDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyColor = (dateStr: string) => {
    const days = getDaysUntil(dateStr);
    if (days < 0) return "bg-gray-500"; // Past
    if (days === 0) return "bg-red-600"; // Today
    if (days <= 2) return "bg-red-500"; // Very urgent
    if (days <= 7) return "bg-yellow-500"; // This week
    return "bg-green-500"; // More than a week
  };

  const getUrgencyText = (dateStr: string) => {
    const days = getDaysUntil(dateStr);
    if (days < 0) return `${Math.abs(days)} days ago`;
    if (days === 0) return "Today!";
    if (days === 1) return "Tomorrow";
    return `${days} days left`;
  };

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      {/* Header */}
      <header className="bg-[#0d1e36] border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-[#1a2d4a] rounded-lg transition-colors"
              title="Go back"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold">CAT Deadlines</h1>
              <p className="text-gray-400 text-sm">
                Track all your upcoming assessments
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            {(["upcoming", "past", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-blue-600 text-white"
                    : "bg-[#1a2d4a] text-gray-400 hover:text-white"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : sortedCats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            {filter === "upcoming" ? (
              <>
                <div className="text-6xl mb-4">🎉</div>
                <p className="text-2xl font-bold text-green-400">
                  All CATs Completed!
                </p>
                <p className="text-lg mt-2 text-gray-300">No Upcoming CATs</p>
                <p className="text-sm mt-1 text-gray-500">
                  Congratulations! You're all caught up!
                </p>
              </>
            ) : (
              <>
                <svg
                  className="w-16 h-16 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-xl font-medium">No CATs found</p>
                <p className="text-sm mt-1">Sync with portal to load CATs</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#0d1e36] rounded-xl p-4">
                <p className="text-gray-400 text-sm">Total CATs</p>
                <p className="text-3xl font-bold">{cats.length}</p>
              </div>
              <div className="bg-[#0d1e36] rounded-xl p-4">
                <p className="text-gray-400 text-sm">Upcoming</p>
                <p className="text-3xl font-bold text-blue-400">
                  {cats.filter((c) => getDaysUntil(c.cat_date) >= 0).length}
                </p>
              </div>
              <div className="bg-[#0d1e36] rounded-xl p-4">
                <p className="text-gray-400 text-sm">This Week</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {
                    cats.filter((c) => {
                      const days = getDaysUntil(c.cat_date);
                      return days >= 0 && days <= 7;
                    }).length
                  }
                </p>
              </div>
            </div>

            {/* CATs List */}
            <div className="space-y-3">
              {sortedCats.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-[#0d1e36] rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getUrgencyColor(
                            cat.cat_date
                          )}`}
                        >
                          {getUrgencyText(cat.cat_date)}
                        </span>
                        <span className="text-gray-500 text-sm">
                          CAT {cat.cat_number}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold mb-1">
                        {cat.subject_name}
                      </h3>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
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
                          <span>{formatDate(cat.cat_date)}</span>
                        </div>

                        {cat.cat_time && (
                          <div className="flex items-center gap-1">
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
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>{cat.cat_time}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1">
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
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span>{cat.venue}</span>
                        </div>

                        <div className="flex items-center gap-1">
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
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>{cat.duration} mins</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-300">
                        {cat.subject_code}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
