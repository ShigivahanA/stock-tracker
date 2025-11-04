import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  isWebAuthnSupported,
  registerCredential,
  verifyCredential,
  isAndroid,
} from "./webauthn";
import { Fingerprint, LogIn, Smartphone, Lock, Loader2 } from "lucide-react";

export default function AuthGate({ children }) {
  const [status, setStatus] = useState("checking");
  const [showManualLogin, setShowManualLogin] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const baseURL = import.meta.env.VITE_API_BASE_URL;

  // 🧩 Manual Login
  const handleManualLogin = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${baseURL}/api/auth/login`, form);
      localStorage.setItem("manualAuthToken", res.data.token);
      setStatus("unlocked");
      setShowManualLogin(false);
    } catch {
      alert("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  // 🤖 Google Sign-In (Android)
  const handleGoogleSignIn = async () => {
    try {
      await new Promise((resolve, reject) => {
        if (!window.google || !window.google.accounts) {
          reject(new Error("Google Identity API not loaded"));
          return;
        }
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: (resp) => {
            if (resp.credential) {
              localStorage.setItem("googleAuthToken", resp.credential);
              resolve();
            } else reject(new Error("No Google credential returned"));
          },
        });
        window.google.accounts.id.prompt((n) => {
          if (n.isNotDisplayed() || n.isSkippedMoment())
            reject(new Error("User canceled Google Sign-In"));
        });
      });
      setStatus("unlocked");
    } catch (err) {
      alert("Google Sign-In failed: " + err.message);
    }
  };

  // 🧠 WebAuthn registration + unlock
  const handleRegister = async () => {
    try {
      await registerCredential();
      setStatus("unlocked");
    } catch (err) {
      alert("Failed to register passkey: " + err.message);
    }
  };
  const handleUnlock = async () => {
    try {
      const ok = await verifyCredential();
      if (ok) setStatus("unlocked");
    } catch (err) {
      alert("Unlock failed: " + err.message);
    }
  };

  // 🧭 Initialization
  useEffect(() => {
    if (isAndroid) {
      const token = localStorage.getItem("googleAuthToken") || localStorage.getItem("manualAuthToken");
      if (token) setStatus("unlocked");
      else setShowManualLogin(true);
      return;
    }

    if (!isWebAuthnSupported()) {
      alert("WebAuthn not supported on this device/browser.");
      setShowManualLogin(true);
      return;
    }

    const stored = localStorage.getItem("webauthnCredential");
    if (stored) setStatus("locked");
    else setStatus("not-registered");
  }, []);

  // 💫 Reusable Glass Wrapper
  const GlassCard = ({ children }) => (
    <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl rounded-3xl p-8 w-[90%] max-w-sm text-center text-white animate-fadeIn">
      {children}
    </div>
  );

  // 🎨 Gradient Background
  const GradientBG = () => (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 animate-gradient" />
  );

  // --- UI States ---
  if (status === "checking")
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-700 via-indigo-800 to-purple-900 text-white">
        <Loader2 className="animate-spin mr-2" size={28} />
        Checking security...
      </div>
    );

  if (showManualLogin && isAndroid)
    return (
      <>
        <GradientBG />
        <div className="flex flex-col items-center justify-center h-screen relative z-10">
          <GlassCard>
            <Smartphone size={40} className="mx-auto mb-4 text-blue-300" />
            <h1 className="text-2xl font-bold mb-1">Sign in</h1>
            <p className="text-sm text-blue-100 mb-6">Stock Tracker Secure Access</p>

            <div className="flex flex-col gap-3 mb-4">
              <input
                type="text"
                placeholder="Username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="bg-white/20 text-white placeholder-gray-300 border border-white/30 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="bg-white/20 text-white placeholder-gray-300 border border-white/30 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
            </div>

            <button
              onClick={handleManualLogin}
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2 transition"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <button
              onClick={handleGoogleSignIn}
              className="mt-4 text-sm text-blue-200 hover:text-white underline"
            >
              Or continue with Google
            </button>
          </GlassCard>
        </div>
      </>
    );

  if (status === "not-registered" && !isAndroid)
    return (
      <>
        <GradientBG />
        <div className="flex items-center justify-center h-screen relative z-10">
          <GlassCard>
            <Fingerprint size={48} className="mx-auto mb-4 text-blue-300" />
            <h1 className="text-2xl font-bold mb-2">Enable Passkey Login</h1>
            <p className="text-sm text-blue-100 mb-6">
              Secure your Stock Tracker with Face ID or Fingerprint.
            </p>
            <button
              onClick={handleRegister}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-6 py-2 transition font-medium"
            >
              Enable Biometric Unlock
            </button>
          </GlassCard>
        </div>
      </>
    );

  if (status === "locked" && !isAndroid)
    return (
      <>
        <GradientBG />
        <div className="flex items-center justify-center h-screen relative z-10">
          <GlassCard>
            <Lock size={42} className="mx-auto mb-4 text-blue-300" />
            <h1 className="text-2xl font-bold mb-2">Unlock Your Dashboard</h1>
            <p className="text-sm text-blue-100 mb-6">
              Use your registered passkey to continue securely.
            </p>
            <button
              onClick={handleUnlock}
              className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-6 py-2 transition font-medium"
            >
              Unlock with Passkey
            </button>
          </GlassCard>
        </div>
      </>
    );

  return <>{children}</>;
}
