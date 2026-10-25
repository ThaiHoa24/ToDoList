"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { loginApi } from "@/api/API_Auth";
import { setAuthSession, getAuthToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect to /dashboard
  useEffect(() => {
    if (getAuthToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg("Vui lòng nhập địa chỉ email");
      return;
    }
    if (!password) {
      setErrorMsg("Vui lòng nhập mật khẩu");
      return;
    }

    setIsLoading(true);

    try {
      const response = await loginApi({
        email: trimmedEmail,
        password,
      });

      // Backend trả về format { success: true, data: { accessToken: "...", user: { id, name, email } } }
      const token =
        response?.data?.accessToken ||
        response?.access_token ||
        response?.token;

      const user =
        response?.data?.user ||
        response?.user || {
          email: trimmedEmail,
          name: trimmedEmail.split("@")[0],
        };

      if (token) {
        setAuthSession(token, user);
        router.push("/dashboard");
      } else {
        setErrorMsg("Đăng nhập không thành công, không tìm thấy token.");
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorData = err.response?.data;
        const msg =
          errorData?.error?.message ||
          errorData?.detail ||
          errorData?.message ||
          (err.response?.status === 401
            ? "Email hoặc mật khẩu không chính xác."
            : "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin kết nối.");
        setErrorMsg(typeof msg === "string" ? msg : JSON.stringify(msg));
      } else {
        setErrorMsg("Đã xảy ra lỗi không xác định. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#f4f7fc] flex items-center justify-center p-4 select-none">
      {/* Background soft ambient glowing circles */}
      <div className="absolute w-[500px] h-[500px] sm:w-[650px] sm:h-[650px] rounded-full bg-white/70 blur-2xl pointer-events-none -z-10" />
      <div className="absolute w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] rounded-full bg-blue-100/40 blur-3xl pointer-events-none -z-10" />

      {/* Login Card */}
      <div className="w-full max-w-[400px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.08)] border border-slate-100/80 p-6 sm:p-8 relative flex flex-col z-10 transition-all">
        {/* Header with Title & Close Button */}
        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
            Sign In
          </h1>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-blue-500/70 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-full transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Error Alert if login fails */}
        {errorMsg && (
          <div className="mb-3.5 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200/80 text-red-600 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 sm:gap-4">
          {/* Email Input */}
          <div className="flex items-center gap-3 px-3.5 py-2.5 sm:py-3 rounded-xl border border-slate-200/90 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <span className="text-blue-500/80 font-medium text-base sm:text-lg pl-0.5">
              @
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              placeholder="Email"
              className="w-full bg-transparent text-sm sm:text-base text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          {/* Password Input */}
          <div className="flex items-center gap-3 px-3.5 py-2.5 sm:py-3 rounded-xl border border-slate-200/90 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500/80 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              placeholder="Password"
              className="w-full bg-transparent text-sm sm:text-base text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            {password && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 text-xs font-medium cursor-pointer"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            )}
          </div>

          {/* Sign In Primary Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm tracking-wider uppercase py-3 sm:py-3.5 rounded-xl shadow-md shadow-blue-500/30 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              "SIGN IN"
            )}
          </button>
        </form>

        {/* Divider Text */}
        <div className="my-3.5 text-center">
          <span className="text-xs sm:text-sm text-slate-400 font-medium">
            or sign in with
          </span>
        </div>

        {/* Google Login Button */}
        <button
          type="button"
          onClick={() => {
            // Quick guest or google login
            try {
              localStorage.setItem(
                "currentUser",
                JSON.stringify({
                  id: "user_google",
                  name: "Google User",
                  email: "google.user@gmail.com",
                })
              );
            } catch {}
            router.push("/dashboard");
          }}
          className="w-full flex items-center justify-center gap-2.5 bg-slate-100/90 hover:bg-slate-200/80 active:scale-[0.99] text-slate-700 font-bold text-xs tracking-wider uppercase py-3 sm:py-3.5 rounded-xl transition-all cursor-pointer"
        >
          {/* Authentic Google Icon */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27A7.16 7.16 0 014.9 12c0-.79.14-1.57.38-2.27V6.58H1.25A11.97 11.97 0 000 12c0 1.92.45 3.74 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>GOOGLE</span>
        </button>

        {/* Footer Link */}
        <div className="mt-4 sm:mt-5 text-center text-xs sm:text-sm text-slate-500">
          Don&apos;t have an account yet?{" "}
          <Link
            href="/register"
            className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
          >
            Sign up
          </Link>
        </div>

        {/* Bottom subtle dot indicators */}
        <div className="flex justify-center items-center gap-1 mt-3.5 text-blue-300">
          <span className="w-1 h-1 rounded-full bg-blue-400/80"></span>
          <span className="w-1 h-1 rounded-full bg-blue-300/60"></span>
          <span className="w-1 h-1 rounded-full bg-blue-200/50"></span>
        </div>
      </div>
    </main>
  );
}
