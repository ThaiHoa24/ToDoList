"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { getAuthToken } from "@/lib/auth";
import { registerApi } from "@/api/API_Auth";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect to /dashboard
  useEffect(() => {
    if (getAuthToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const clearFieldError = (field: "name" | "email" | "password" | "confirmPassword") => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    if (errorMsg) setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // Validate fields
    const errors: typeof fieldErrors = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = "Vui lòng nhập họ và tên";
    } else if (trimmedName.length < 2) {
      errors.name = "Họ và tên phải có ít nhất 2 ký tự";
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = "Vui lòng nhập địa chỉ email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = "Email không hợp lệ (ví dụ: user@example.com)";
    }

    if (!password) {
      errors.password = "Vui lòng nhập mật khẩu";
    } else if (password.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await registerApi({
        name: trimmedName,
        email: trimmedEmail,
        password,
      });

      setSuccessMsg(
        response?.message || "Đăng ký tài khoản thành công! Đang chuyển hướng sang trang đăng nhập..."
      );

      // Redirect to /login after 1.5s
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const detail = err.response?.data?.detail;
        const message = err.response?.data?.message;

        if (Array.isArray(detail)) {
          // FastAPI / Pydantic validation error list
          const firstErr = detail[0];
          const field = firstErr?.loc?.[firstErr.loc.length - 1];
          const msg = firstErr?.msg || "Thông tin nhập không hợp lệ";
          if (field === "email") {
            setFieldErrors((prev) => ({ ...prev, email: msg }));
          } else if (field === "password") {
            setFieldErrors((prev) => ({ ...prev, password: msg }));
          } else if (field === "name") {
            setFieldErrors((prev) => ({ ...prev, name: msg }));
          }
          setErrorMsg(msg);
        } else if (typeof detail === "string") {
          setErrorMsg(detail);
          if (detail.toLowerCase().includes("email")) {
            setFieldErrors((prev) => ({ ...prev, email: detail }));
          }
        } else if (typeof message === "string") {
          setErrorMsg(message);
        } else if (status === 400 || status === 409) {
          const conflictMsg = "Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.";
          setErrorMsg(conflictMsg);
          setFieldErrors((prev) => ({ ...prev, email: "Email này đã tồn tại" }));
        } else if (err.code === "ECONNABORTED") {
          setErrorMsg("Kết nối đến máy chủ quá thời gian. Vui lòng thử lại.");
        } else if (!err.response) {
          setErrorMsg("Không thể kết nối đến máy chủ API. Vui lòng kiểm tra backend server.");
        } else {
          setErrorMsg(`Đăng ký thất bại (Mã lỗi: ${status || "Lỗi không xác định"}).`);
        }
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

      {/* Register Card */}
      <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.08)] border border-slate-100/80 p-5 sm:p-7 relative flex flex-col z-10 transition-all max-h-[92vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* Header with Title & Close Button */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              Sign Up
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Create your account to get started
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/login")}
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

        {/* Global Error Notification */}
        {errorMsg && (
          <div className="mb-3 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-600 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        {/* Global Success Notification */}
        {successMsg && (
          <div className="mb-3 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span className="flex-1">{successMsg}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          {/* Name Input */}
          <div>
            <div
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border bg-white transition-all ${
                fieldErrors.name
                  ? "border-rose-400 ring-2 ring-rose-100"
                  : "border-slate-200/90 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"
              }`}
            >
              <svg
                className={`w-4 h-4 shrink-0 transition-colors ${
                  fieldErrors.name ? "text-rose-400" : "text-blue-500/80"
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearFieldError("name");
                }}
                placeholder="Full Name"
                className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            {fieldErrors.name && (
              <p className="mt-1 pl-1 text-[11px] font-semibold text-rose-500 flex items-center gap-1">
                <span>⚠</span> {fieldErrors.name}
              </p>
            )}
          </div>

          {/* Email Input */}
          <div>
            <div
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border bg-white transition-all ${
                fieldErrors.email
                  ? "border-rose-400 ring-2 ring-rose-100"
                  : "border-slate-200/90 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"
              }`}
            >
              <span
                className={`font-semibold text-base shrink-0 pl-0.5 transition-colors ${
                  fieldErrors.email ? "text-rose-400" : "text-blue-500/80"
                }`}
              >
                @
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError("email");
                }}
                placeholder="Email"
                className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1 pl-1 text-[11px] font-semibold text-rose-500 flex items-center gap-1">
                <span>⚠</span> {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <div
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border bg-white transition-all ${
                fieldErrors.password
                  ? "border-rose-400 ring-2 ring-rose-100"
                  : "border-slate-200/90 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"
              }`}
            >
              <svg
                className={`w-4 h-4 shrink-0 transition-colors ${
                  fieldErrors.password ? "text-rose-400" : "text-blue-500/80"
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError("password");
                }}
                placeholder="Password (min 6 characters)"
                className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
              {password && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-medium cursor-pointer shrink-0"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              )}
            </div>
            {fieldErrors.password && (
              <p className="mt-1 pl-1 text-[11px] font-semibold text-rose-500 flex items-center gap-1">
                <span>⚠</span> {fieldErrors.password}
              </p>
            )}
          </div>

          {/* Confirm Password Input */}
          <div>
            <div
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border bg-white transition-all ${
                fieldErrors.confirmPassword
                  ? "border-rose-400 ring-2 ring-rose-100"
                  : "border-slate-200/90 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"
              }`}
            >
              <svg
                className={`w-4 h-4 shrink-0 transition-colors ${
                  fieldErrors.confirmPassword ? "text-rose-400" : "text-blue-500/80"
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearFieldError("confirmPassword");
                }}
                placeholder="Confirm Password"
                className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
              {confirmPassword && (
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-medium cursor-pointer shrink-0"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              )}
            </div>
            {fieldErrors.confirmPassword && (
              <p className="mt-1 pl-1 text-[11px] font-semibold text-rose-500 flex items-center gap-1">
                <span>⚠</span> {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Sign Up Primary Button */}
          <button
            type="submit"
            disabled={isLoading || Boolean(successMsg)}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm tracking-wider uppercase py-3 rounded-xl shadow-md shadow-blue-500/30 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Processing...</span>
              </>
            ) : successMsg ? (
              "Registered Successfully"
            ) : (
              "SIGN UP"
            )}
          </button>
        </form>

        {/* Divider Text */}
        <div className="my-2.5 text-center">
          <span className="text-xs text-slate-400 font-medium">
            or sign up with
          </span>
        </div>

        {/* Google Register Button */}
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2.5 bg-slate-100/90 hover:bg-slate-200/80 active:scale-[0.99] text-slate-700 font-bold text-xs tracking-wider uppercase py-2.5 rounded-xl transition-all cursor-pointer"
        >
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
        <div className="mt-3.5 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
          >
            Sign in
          </Link>
        </div>

        {/* Bottom subtle dot indicators */}
        <div className="flex justify-center items-center gap-1 mt-2.5 text-blue-300">
          <span className="w-1 h-1 rounded-full bg-blue-400/80"></span>
          <span className="w-1 h-1 rounded-full bg-blue-300/60"></span>
          <span className="w-1 h-1 rounded-full bg-blue-200/50"></span>
        </div>
      </div>
    </main>
  );
}
