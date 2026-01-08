import { useState, useEffect } from "react";

interface CourseMate {
  id: string;
  name: string;
  adm_number: string;
  bio: string | null;
  last_active: string;
  shared_courses?: string[];
  shared_course_ids?: string[];
  total_courses: number;
}

interface Course {
  course_id: string;
  course_name: string;
  classmate_count: number;
}

interface CourseMatesProps {
  onOpenChat: (userId: string, userName: string) => void;
}

export default function CourseMates({ onOpenChat }: CourseMatesProps) {
  const [courseMates, setCourseMates] = useState<CourseMate[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = "http://localhost:3000/api";

  useEffect(() => {
    fetchCourses();
    fetchCourseMates();
  }, []);

  useEffect(() => {
    fetchCourseMates(selectedCourse);
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/social/my-courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCourses(data.courses);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchCourseMates = async (courseId?: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const url = courseId
        ? `${API_URL}/social/coursemates?courseId=${courseId}`
        : `${API_URL}/social/coursemates`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setCourseMates(data.coursemates);
        setError(null);
      } else {
        setError(data.error || "Failed to fetch course mates");
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const formatLastActive = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Course Mates</h2>
          <p className="text-gray-400 mt-1">
            Find classmates taking the same courses as you
          </p>
        </div>

        {/* Course Filter */}
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          aria-label="Filter by course"
          className="bg-slate-800 text-white border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Courses</option>
          {courses.map((course) => (
            <option key={course.course_id} value={course.course_id}>
              {course.course_name} ({course.classmate_count} mates)
            </option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => fetchCourseMates(selectedCourse)}
            className="mt-2 text-sm text-blue-400 hover:text-blue-300"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && courseMates.length === 0 && (
        <div className="bg-slate-800/50 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            No course mates found
          </h3>
          <p className="text-gray-400">
            {selectedCourse
              ? "No other students are registered for this course yet."
              : "No other students share your courses yet. Check back later!"}
          </p>
        </div>
      )}

      {/* Course Mates Grid */}
      {!loading && !error && courseMates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courseMates.map((mate) => (
            <div
              key={mate.id}
              className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-blue-500/50 transition-all"
            >
              {/* User Info */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {mate.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">
                    {mate.name}
                  </h3>
                  <p className="text-gray-400 text-sm">{mate.adm_number}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    Active {formatLastActive(mate.last_active)}
                  </p>
                </div>
              </div>

              {/* Bio */}
              {mate.bio && (
                <p className="text-gray-400 text-sm mt-3 line-clamp-2">
                  {mate.bio}
                </p>
              )}

              {/* Shared Courses */}
              {mate.shared_courses && mate.shared_courses.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">Shared courses:</p>
                  <div className="flex flex-wrap gap-1">
                    {mate.shared_courses.slice(0, 3).map((course, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full"
                      >
                        {course.length > 20
                          ? course.substring(0, 20) + "..."
                          : course}
                      </span>
                    ))}
                    {mate.shared_courses.length > 3 && (
                      <span className="text-gray-500 text-xs px-2 py-1">
                        +{mate.shared_courses.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => onOpenChat(mate.id, mate.name)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
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
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  Message
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
