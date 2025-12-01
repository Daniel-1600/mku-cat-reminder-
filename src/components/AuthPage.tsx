import { useState } from "react";
import axios from "axios";

interface AuthPageProps {
  onNavigateToHero?: () => void;
  onLoginSuccess?: () => void;
  onSkipPortal?: () => void;
}

export default function AuthPage({
  onNavigateToHero,
  onLoginSuccess,
  onSkipPortal,
}: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<"form" | "verify">("form");
  const [userId, setUserId] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    admNumber: "",
    verificationCode: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [checkingPortal, setCheckingPortal] = useState(false);
  const [message, setMessage] = useState("");

  const API_URL = "http://localhost:3000/api/auth";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Email validation (MKU email only)
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!formData.email.endsWith("@mylife.mku.ac.ke")) {
      newErrors.email = "Please use your MKU email (@mylife.mku.ac.ke)";
    }

    // Register-specific validations
    if (!isLogin) {
      if (!formData.fullName || formData.fullName.trim().length < 3) {
        newErrors.fullName = "Full name is required (min 3 characters)";
      }
      if (!formData.admNumber || formData.admNumber.trim().length === 0) {
        newErrors.admNumber = "Admission number is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isLogin) {
        // Login - send email only
        const response = await axios.post(`${API_URL}/login`, {
          email: formData.email,
        });
        setUserId(response.data.userId);
        setMessage(response.data.message);
        setStep("verify");
      } else {
        // Register - send full name, adm number, and email
        const response = await axios.post(`${API_URL}/register`, {
          email: formData.email,
          fullName: formData.fullName,
          admNumber: formData.admNumber,
        });
        setUserId(response.data.userId);
        setMessage(response.data.message);
        setStep("verify");
      }
    } catch (error: any) {
      setErrors({
        submit: error.response?.data?.message || "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!formData.verificationCode || formData.verificationCode.length !== 6) {
      setErrors({ verificationCode: "Please enter the 6-digit code" });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/verify-code`, {
        userId,
        code: formData.verificationCode,
      });

      // Store token
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      setMessage("Verification successful!");
      setLoading(false);

      // Check portal connection status
      setCheckingPortal(true);

      try {
        const portalResponse = await axios.get(
          "http://localhost:3000/api/portal/status",
          {
            headers: {
              Authorization: `Bearer ${response.data.token}`,
            },
          }
        );

        // If portal is connected, skip portal setup and go to dashboard
        if (portalResponse.data.connected) {
          setTimeout(() => {
            if (onSkipPortal) {
              onSkipPortal();
            }
          }, 800);
        } else {
          // Portal not connected, show portal setup
          setTimeout(() => {
            if (onLoginSuccess) {
              onLoginSuccess();
            }
          }, 800);
        }
      } catch (portalError) {
        console.error("Error checking portal status:", portalError);
        // On error, default to showing portal setup
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess();
          }
        }, 800);
      } finally {
        setCheckingPortal(false);
      }
    } catch (error: any) {
      setErrors({
        verificationCode:
          error.response?.data?.message || "Invalid verification code",
      });
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await axios.post(`${API_URL}/resend-code`, { userId });
      setMessage(response.data.message);
    } catch (error: any) {
      setErrors({
        submit: error.response?.data?.message || "Failed to resend code",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setMessage("");
    setStep("form");
    setFormData({
      email: "",
      fullName: "",
      admNumber: "",
      verificationCode: "",
    });
  };

  const goBackToForm = () => {
    setStep("form");
    setFormData((prev) => ({ ...prev, verificationCode: "" }));
    setErrors({});
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl"></div>
      </div>

      {/* Back to website button */}
      {onNavigateToHero && (
        <button
          onClick={onNavigateToHero}
          className="absolute top-8 right-8 z-10 px-4 py-2 bg-blue-500/10 backdrop-blur-sm text-blue-400 rounded-lg border border-blue-500/30 hover:bg-blue-500/20 transition flex items-center gap-2"
        >
          Back to website
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}

      {/* Centered Auth Form */}
      <div className="w-full max-w-md relative z-10 bg-black/80 backdrop-blur-xl rounded-2xl p-8 border border-blue-500/30">
        {step === "form" ? (
          <>
            {/* Form Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-3">
                {isLogin ? "Welcome back" : "Create an account"}
              </h1>
              <p className="text-gray-300">
                {isLogin
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <button
                  onClick={toggleMode}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  {isLogin ? "Sign up" : "Log in"}
                </button>
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Registration fields */}
              {!isLogin && (
                <>
                  <div>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-gray-900 text-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition placeholder-gray-400 ${
                        errors.fullName
                          ? "border-red-500"
                          : "border-blue-500/30"
                      }`}
                      placeholder="Full Name"
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-sm text-red-400">
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      name="admNumber"
                      value={formData.admNumber}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-gray-900 text-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition placeholder-gray-400 ${
                        errors.admNumber
                          ? "border-red-500"
                          : "border-blue-500/30"
                      }`}
                      placeholder="Admission Number"
                    />
                    {errors.admNumber && (
                      <p className="mt-1 text-sm text-red-400">
                        {errors.admNumber}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Email field */}
              <div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-gray-900 text-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition placeholder-gray-400 ${
                    errors.email ? "border-red-500" : "border-blue-500/30"
                  }`}
                  placeholder="MKU Email (@mylife.mku.ac.ke)"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Error Message */}
              {errors.submit && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">{errors.submit}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3.5 rounded-lg font-semibold hover:shadow-2xl hover:shadow-blue-500/50 transition duration-200 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Processing..."
                  : isLogin
                  ? "Send Verification Code"
                  : "Create Account"}
              </button>
            </form>
          </>
        ) : (
          <>
            {/* Verification Step */}
            <div className="mb-8">
              <button
                onClick={goBackToForm}
                className="text-blue-400 hover:text-blue-300 mb-4 flex items-center gap-2"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </button>
              <h1 className="text-4xl font-bold text-white mb-3">
                Verify Your Email
              </h1>
              <p className="text-gray-300">
                We've sent a 6-digit code to{" "}
                <span className="text-blue-400">{formData.email}</span>
              </p>
            </div>

            {/* Success Message */}
            {message && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-400">{message}</p>
              </div>
            )}

            {/* Checking Portal Status */}
            {checkingPortal && (
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                  <p className="text-sm text-blue-400">
                    Checking portal connection...
                  </p>
                </div>
              </div>
            )}

            {/* Verification Form */}
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <input
                  type="text"
                  name="verificationCode"
                  value={formData.verificationCode}
                  onChange={handleInputChange}
                  maxLength={6}
                  className={`w-full px-4 py-3 bg-gray-900 text-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition placeholder-gray-400 text-center text-2xl tracking-widest ${
                    errors.verificationCode
                      ? "border-red-500"
                      : "border-blue-500/30"
                  }`}
                  placeholder="000000"
                />
                {errors.verificationCode && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.verificationCode}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3.5 rounded-lg font-semibold hover:shadow-2xl hover:shadow-blue-500/50 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>

              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">
                  Didn't receive the code?
                </p>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-blue-400 hover:text-blue-300 font-medium text-sm disabled:opacity-50"
                >
                  Resend Code
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
