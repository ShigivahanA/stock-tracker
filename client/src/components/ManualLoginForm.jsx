import React, { useState } from "react";
import { Smartphone, Loader2 } from "lucide-react";
import axios from "axios";

// Assuming GlassCard and GradientBG are either imported or defined here

export default function ManualLoginForm({ GlassCard, GradientBG, baseURL, onSuccess }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleManualLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Use baseURL from props
      const res = await axios.post(`${baseURL}/api/auth/login`, form);
      localStorage.setItem("manualAuthToken", res.data.token);
      onSuccess(); // Call the success handler from AuthGate
    } catch {
      alert("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <GradientBG />
      <div className="flex flex-col items-center justify-center h-screen relative z-10">
        <GlassCard>
          <Smartphone size={40} className="mx-auto mb-4 text-blue-300" />
          <h1 className="text-2xl font-bold mb-1">Sign in</h1>
          <p className="text-sm text-blue-100 mb-6">Secure Android Access</p>

          <form onSubmit={handleManualLogin} className="flex flex-col gap-3 mb-4 w-full">
            <input
              type="text"
              name="username"
              placeholder="Username"
              autoComplete="username"
              value={form.username}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, username: e.target.value }))
              }
              className="bg-white/20 text-white placeholder-gray-300 border border-white/30 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
              className="bg-white/20 text-white placeholder-gray-300 border border-white/30 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2 transition font-medium flex items-center justify-center"
            >
              {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : "Login"}
            </button>
          </form>
        </GlassCard>
      </div>
    </>
  );
}