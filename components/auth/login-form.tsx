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
      className="w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg flex flex-col gap-6"
      aria-label="Login form"
    >
      <h1 className="text-2xl font-extrabold text-indigo-700 text-center select-none">
        UniSalon
      </h1>

      <div className="flex flex-col gap-1">
        <label htmlFor="mobile" className="text-sm font-semibold text-gray-700">
          Mobile Number
        </label>
        <div className="relative">
          <User
            size={20}
            className="absolute top-2.5 left-3 text-indigo-400 pointer-events-none"
          />
          <input
            id="mobile"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className="w-full h-11 pl-10 pr-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400 transition"
            placeholder="+91 9988877779"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
            aria-describedby={error ? "mobile-error" : undefined}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-semibold text-gray-700">
          Password
        </label>
        <div className="relative">
          <KeyRound
            size={20}
            className="absolute top-2.5 left-3 text-indigo-400 pointer-events-none"
          />
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="w-full h-11 pl-10 pr-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400 transition"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-describedby={error ? "password-error" : undefined}
          />
        </div>
      </div>

      {error && (
        <p
          id="mobile-error"
          className="flex items-center gap-2 text-sm text-red-600 font-semibold"
          role="alert"
        >
          <AlertCircle size={18} />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="relative w-full h-11 rounded-lg bg-gradient-to-tr from-indigo-600 to-green-500 text-white font-extrabold shadow-lg hover:brightness-110 transition flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
        aria-live="polite"
      >
        {loading && <Loader2 className="animate-spin" size={20} />}
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
