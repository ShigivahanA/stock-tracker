// src/auth/AuthGate.jsx
import React, { useEffect, useState } from "react";
import {
  isWebAuthnSupported,
  registerCredential,
  verifyCredential,
} from "./webauthn";
import { toast } from "react-toastify";
import { Loader2, Lock, Fingerprint, RefreshCw } from "lucide-react";

export default function AuthGate({ children }) {
  const [status, setStatus] = useState("checking");
  const [loading, setLoading] = useState(false);

  // 🔐 Register a new passkey
  const handleRegister = async () => {
    setLoading(true);
    try {
      await registerCredential();
      toast.success("Passkey registered successfully 🎉", { autoClose: 2000 });
      setStatus("unlocked");
    } catch (err) {
      console.error("Registration failed:", err);
      toast.error("Failed to register passkey: " + err.message, {
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // 🔓 Verify existing passkey
  const handleUnlock = async () => {
    setLoading(true);
    try {
      const ok = await verifyCredential();
      if (ok) {
        toast.success("Unlocked successfully 🔓", { autoClose: 2000 });
        setStatus("unlocked");
      } else {
        toast.warning("No credential found — re-register.", { autoClose: 2500 });
        setStatus("not-registered");
      }
    } catch (err) {
      console.error("Unlock failed:", err);
      toast.error("Unlock failed: " + err.message, { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  // 🌍 Initial check
  useEffect(() => {
    if (!isWebAuthnSupported()) {
      toast.warning("WebAuthn not supported on this browser.", {
        autoClose: 2500,
      });
      setStatus("unlocked");
      return;
    }

    const stored = localStorage.getItem("webauthnCredential");
    if (stored) setStatus("locked");
    else setStatus("not-registered");
  }, []);

  // 🕓 Status: checking
  if (status === "checking") {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-700">
        <Loader2 className="animate-spin text-blue-600 mb-3" size={32} />
        <p>Checking security settings...</p>
      </div>
    );
  }

  // 🧭 Status: not registered
  if (status === "not-registered") {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-6">
        <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-sm text-center">
          <Lock className="text-blue-600 mx-auto mb-3" size={40} />
          <h1 className="text-xl font-semibold text-gray-800">
            Secure your Stock Tracker
          </h1>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Enable biometric unlock for faster and safer access.
          </p>

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Fingerprint size={18} />
            )}
            {loading ? "Enabling..." : "Enable Biometric Unlock"}
          </button>

          <p className="text-xs text-gray-400 mt-4">
            Managed by your Google Account
          </p>
        </div>
      </div>
    );
  }

  // 🔒 Status: locked
  if (status === "locked") {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-6">
        <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-sm text-center">
          <Fingerprint className="text-green-600 mx-auto mb-3" size={40} />
          <h1 className="text-xl font-semibold text-gray-800">
            Unlock Stock Tracker
          </h1>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Use your fingerprint, Face ID, or screen lock to continue.
          </p>

          <button
            onClick={handleUnlock}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Fingerprint size={18} />
            )}
            {loading ? "Verifying..." : "Unlock Now"}
          </button>

          <div className="mt-4 flex justify-between text-xs text-gray-500">
            <button
              onClick={() => {
                localStorage.removeItem("webauthnCredential");
                toast.info("Passkey removed — please re-register.", {
                  autoClose: 2000,
                });
                setStatus("not-registered");
              }}
              className="hover:underline flex items-center gap-1"
            >
              <RefreshCw size={12} /> Retry Setup
            </button>

            <a
              href="https://passwords.google.com/passkeys"
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              Manage Passkeys
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Unlocked → render main app
  return <>{children}</>;
}
