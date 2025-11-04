import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  isWebAuthnSupported,
  registerCredential,
  verifyCredential,
  isAndroid,
} from "./webauthn";

export default function AuthGate({ children }) {
  const [status, setStatus] = useState("checking");
  const [showManualLogin, setShowManualLogin] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const baseURL = import.meta.env.VITE_API_BASE_URL;

  // Manual login handler
  const handleManualLogin = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${baseURL}/api/auth/login`, form);
      localStorage.setItem("manualAuthToken", res.data.token);
      setStatus("unlocked");
      setShowManualLogin(false);
    } catch (err) {
      alert("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  // --- Google Sign-In (Android only) ---
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

        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            reject(new Error("User closed or canceled Google Sign-In"));
          }
        });
      });

      setStatus("unlocked");
    } catch (err) {
      alert("Google Sign-In failed: " + err.message);
    }
  };

  // --- WebAuthn Registration (iOS/Desktop) ---
  const handleRegister = async () => {
    try {
      await registerCredential();
      setStatus("unlocked");
    } catch (err) {
      alert("Failed to register passkey: " + err.message);
    }
  };

  // --- WebAuthn / Google Unlock ---
  const handleUnlock = async () => {
    try {
      if (isAndroid) {
        await handleGoogleSignIn();
      } else {
        const ok = await verifyCredential();
        if (ok) setStatus("unlocked");
      }
    } catch (err) {
      alert("Unlock failed: " + err.message);
    }
  };

  // --- Initialization ---
  useEffect(() => {
    if (isAndroid) {
      const token = localStorage.getItem("googleAuthToken");
      if (token) setStatus("unlocked");
      else setStatus("locked");
      return;
    }

    const manualToken = localStorage.getItem("manualAuthToken");
    if (manualToken) {
      setStatus("unlocked");
      return;
    }

    if (!isWebAuthnSupported()) {
      setShowManualLogin(true);
      return;
    }

    const stored = localStorage.getItem("webauthnCredential");
    if (stored) setStatus("locked");
    else setStatus("not-registered");
  }, []);

  // --- UI States ---
  if (status === "checking")
    return <div className="p-4 text-center">Checking security...</div>;

  if (showManualLogin)
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <h1 className="text-xl font-bold mb-4">Manual Login</h1>
        <div className="flex flex-col w-72 gap-3">
          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="border rounded-lg p-2 text-sm"
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="border rounded-lg p-2 text-sm"
          />
          <button
            onClick={handleManualLogin}
            disabled={loading}
            className="bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </div>
    );

  if (isAndroid) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <h1 className="text-xl font-bold mb-4">Sign in to Stock Tracker</h1>
        <button
          onClick={handleGoogleSignIn}
          className="bg-red-500 text-white rounded-lg px-4 py-2"
        >
          Continue with Google
        </button>
      </div>
    );
  }

  if (status === "not-registered") {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <h1 className="text-xl font-bold mb-4">Secure your app</h1>
        <button
          onClick={handleRegister}
          className="bg-blue-600 text-white rounded-lg px-4 py-2"
        >
          Enable biometric unlock
        </button>
        <button
          onClick={() => setShowManualLogin(true)}
          className="mt-3 text-blue-600 text-sm underline"
        >
          Use manual login instead
        </button>
      </div>
    );
  }

  if (status === "locked") {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <h1 className="text-xl font-bold mb-4">Unlock Stock Tracker</h1>
        <button
          onClick={handleUnlock}
          className="bg-green-600 text-white rounded-lg px-4 py-2"
        >
          Unlock with Fingerprint / Face ID
        </button>
        <button
          onClick={() => setShowManualLogin(true)}
          className="mt-3 text-blue-600 text-sm underline"
        >
          Use manual login instead
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
