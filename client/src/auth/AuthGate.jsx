// src/auth/AuthGate.jsx
import React, { useEffect, useState } from "react";
import { isWebAuthnSupported, registerCredential, verifyCredential } from "./webauthn";

export default function AuthGate({ children }) {
  const [status, setStatus] = useState("checking");

  const handleRegister = async () => {
    try {
      await registerCredential();
      setStatus("unlocked");
    } catch (err) {
      alert("Failed to register credential: " + err.message);
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

  useEffect(() => {
    if (!isWebAuthnSupported()) {
      alert("WebAuthn not supported on this device/browser.");
      setStatus("unlocked");
      return;
    }
    const stored = localStorage.getItem("webauthnCredential");
    if (stored) setStatus("locked");
    else setStatus("not-registered");
  }, []);

  if (status === "checking") return <div className="p-4 text-center">Checking security...</div>;
  if (status === "not-registered") {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <h1 className="text-xl font-bold mb-4">Secure your app</h1>
        <button
          onClick={handleRegister}
          className="bg-blue-600 text-white rounded-lg px-4 py-2">
          Enable biometric unlock
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
          className="bg-green-600 text-white rounded-lg px-4 py-2">
          Unlock with Fingerprint / FaceID
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
