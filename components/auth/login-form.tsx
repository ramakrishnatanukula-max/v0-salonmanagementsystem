"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Loader2, AlertCircle, KeyRound } from "lucide-react";

export default function LoginForm() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, password }),
        credentials: "include",
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      
      // Redirect to appointments dashboard
      router.replace("/dashboard/appointments");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-md mx-auto p-8 bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col gap-6 backdrop-blur-sm"
      aria-label="Login form"
    >
      {/* Logo with animation */}
      <div className="flex justify-center mb-2 animate-fade-in">
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-5 shadow-2xl transform hover:scale-105 transition-transform duration-300">
          <img
            src="/siteicon.png"
            alt="UniSalon Logo"
            className="w-20 h-20 object-contain"
          />
        </div>
      </div>
      
      {/* Title with gradient */}
      <div className="text-center space-y-2 mb-2">
        <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent select-none">
          UniSalon
        </h1>
        <p className="text-sm text-gray-500 font-medium">Welcome back! Please sign in to continue</p>
      </div>

      {/* Mobile Number Field */}
      <div className="flex flex-col gap-2">
        <label htmlFor="mobile" className="text-sm font-bold text-gray-700 uppercase tracking-wide">
          Mobile Number
        </label>
        <div className="relative group">
          <User
            size={20}
            className="absolute top-3.5 left-4 text-indigo-400 pointer-events-none group-focus-within:text-indigo-600 transition-colors"
          />
          <input
            id="mobile"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all bg-gray-50 focus:bg-white text-base font-medium"
            placeholder="+91 9988877779"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
            aria-describedby={error ? "mobile-error" : undefined}
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-bold text-gray-700 uppercase tracking-wide">
          Password
        </label>
        <div className="relative group">
          <KeyRound
            size={20}
            className="absolute top-3.5 left-4 text-indigo-400 pointer-events-none group-focus-within:text-indigo-600 transition-colors"
          />
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all bg-gray-50 focus:bg-white text-base font-medium"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-describedby={error ? "password-error" : undefined}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="animate-shake">
          <div className="flex items-center gap-3 text-sm text-red-600 font-semibold bg-red-50 border-2 border-red-200 rounded-xl p-3" role="alert">
            <AlertCircle size={20} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="relative w-full h-14 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 text-white font-bold text-base shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2"
        aria-live="polite"
      >
        {loading && <Loader2 className="animate-spin" size={22} />}
        {loading ? "Signing you in..." : "Sign in to Dashboard"}
      </button>
      
      {/* Footer */}
      <p className="text-center text-xs text-gray-400 mt-2">
        Secure login • Your data is protected
      </p>
    </form>
  );
}
