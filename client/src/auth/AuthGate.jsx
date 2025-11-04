import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import ManualLoginForm from "../components/ManualLoginForm";
import {
  isWebAuthnSupported,
  registerCredential,
  verifyCredential,
} from "./webauthn";
import { Fingerprint, Smartphone, Lock, Loader2 } from "lucide-react";

/* 🧠 Bulletproof Android Detection */
function detectAndroid() {
  try {
    if (navigator.userAgentData?.platform?.toLowerCase().includes("android"))
      return true;

    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("android")) return true;

    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const isiOS = /iphone|ipad|ipod|macintosh/i.test(ua);
    const isMobile = /mobile|chrome|safari|wv|version/i.test(ua);
    if (isTouch && isMobile && !isiOS) return true;
  } catch (e) {
    console.warn("Android detection failed:", e);
  }
  return false;
}

export default function AuthGate({ children }) {
  const [status, setStatus] = useState("checking");
  const [isManualLogin, setIsManualLogin] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false); // ✅ ensures init runs once

  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const isAndroidDevice = useMemo(() => detectAndroid(), []);

  /* 🔐 Manual Login (Android only) */
  const handleManualLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post(`${baseURL}/api/auth/login`, form);
      localStorage.setItem("manualAuthToken", res.data.token);
      setStatus("unlocked");
      setIsManualLogin(false);
    } catch {
      alert("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  /* 🔐 Passkey setup / unlock (Desktop + iOS) */
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

  /* 🧭 Initialization Logic */
  useEffect(() => {
    if (initialized) return; // ✅ prevent rerun after login typing
    setInitialized(true);

    try {
      if (isAndroidDevice) {
        const token = localStorage.getItem("manualAuthToken");
        if (token) setStatus("unlocked");
        else {
          setIsManualLogin(true);
          setStatus("locked");
        }
        return;
      }

      if (!isWebAuthnSupported()) {
        console.warn("WebAuthn not supported, skipping biometric lock.");
        setStatus("unlocked");
        return;
      }

      const stored = localStorage.getItem("webauthnCredential");
      if (stored) setStatus("locked");
      else setStatus("not-registered");
    } catch (err) {
      console.error("Auth init error:", err);
      setStatus("unlocked");
    }
  }, [isAndroidDevice, initialized]);

  /* 💫 Glass Wrapper */
  const GlassCard = React.memo(({ children }) => (
    <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl rounded-3xl p-8 w-[90%] max-w-sm text-center text-white animate-fadeIn">
      {children}
    </div>
  ));

  /* 🎨 Background Gradient */
  const GradientBG = React.memo(() => (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 animate-gradient" />
  ));

  /* ⏳ Checking */
  if (status === "checking")
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-700 via-indigo-800 to-purple-900 text-white">
        <Loader2 className="animate-spin mr-2" size={28} />
        Checking security...
      </div>
    );

    const handleLoginSuccess = () => {
  setStatus("unlocked");
  setIsManualLogin(false);
};

  /* 📱 Manual Login (Android) */
  if (isManualLogin && isAndroidDevice)
    return (
      <ManualLoginForm
      GlassCard={GlassCard}
      GradientBG={GradientBG}
      baseURL={baseURL}
      onSuccess={handleLoginSuccess}
    />
    );

  /* 🧩 Passkey setup */
  if (status === "not-registered" && !isAndroidDevice)
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

  /* 🔒 Unlock existing passkey */
  if (status === "locked" && !isAndroidDevice)
    return (
      <>
        <GradientBG />
        <div className="flex items-center justify-center h-screen relative z-10">
          <GlassCard>
            <Lock size={42} className="mx-auto mb-4 text-blue-300" />
            <h1 className="text-2xl font-bold mb-2">Unlock Dashboard</h1>
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

  /* ✅ Authenticated */
  return <>{children}</>;
}
