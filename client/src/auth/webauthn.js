// src/auth/webauthn.js

/**
 * Generate a random base64url-encoded challenge
 */
function generateChallenge(length = 32) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Conversion helpers
 */
function base64urlToArrayBuffer(base64url) {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function arrayBufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Capability checks
 */
export const isWebAuthnSupported = () =>
  typeof window.PublicKeyCredential !== "undefined";

function isGoogleCredentialManagerAvailable() {
  return (
    typeof window.google !== "undefined" &&
    window.google.identity &&
    window.google.identity.credentials
  );
}

/**
 * Wait until Google Identity script is loaded
 */
async function waitForGoogleIdentity(maxWaitMs = 4000) {
  if (isGoogleCredentialManagerAvailable()) return true;
  return new Promise((resolve) => {
    const start = Date.now();
    const timer = setInterval(() => {
      if (isGoogleCredentialManagerAvailable() || Date.now() - start > maxWaitMs) {
        clearInterval(timer);
        resolve(isGoogleCredentialManagerAvailable());
      }
    }, 200);
  });
}

/**
 * Unified registration — works across Android, iOS, Desktop
 */
export async function registerCredential() {
  if (!isWebAuthnSupported()) throw new Error("WebAuthn not supported on this device.");

  const challenge = generateChallenge();
  const rpId =
    window.location.hostname === "localhost"
      ? "localhost"
      : "stock-tracker-ecru-beta.vercel.app"; // ✅ explicit production domain

  const publicKey = {
    challenge: base64urlToArrayBuffer(challenge),
    rp: { name: "Stock Tracker", id: rpId },
    user: {
      id: new TextEncoder().encode("athithan-user"),
      name: "athithan@local",
      displayName: "Athithan",
    },
    pubKeyCredParams: [{ type: "public-key", alg: -7 }],
    timeout: 60000,
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "required",
      userVerification: "required",
    },
  };

  // ✅ Android: Prefer Google Credential Manager API
  const isGoogleReady = await waitForGoogleIdentity();
  if (isGoogleReady) {
    try {
      console.log("📱 Using Google Credential Manager API for passkey registration...");
      const cred = await window.google.identity.credentials.create({
        publicKey,
        mediation: "required",
        signal: AbortSignal.timeout(15000), // prevent hanging
      });
      if (cred) {
        const data = {
          id: cred.id,
          rawId: cred.rawId ? arrayBufferToBase64url(cred.rawId) : "",
          type: cred.type,
        };
        localStorage.setItem("webauthnCredential", JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn("Google Credential Manager registration failed, fallback:", err);
    }
  }

  // Fallback → Standard WebAuthn (Safari, desktop, etc.)
  const credential = await navigator.credentials.create({ publicKey });
  const credentialData = {
    id: credential.id,
    rawId: arrayBufferToBase64url(credential.rawId),
    type: credential.type,
  };
  localStorage.setItem("webauthnCredential", JSON.stringify(credentialData));
  return credentialData;
}

/**
 * Unified verification / sign-in
 * - Works across Android, iOS, and desktop
 * - Adds user-gesture & timeout support
 */
export async function verifyCredential() {
  if (!isWebAuthnSupported()) throw new Error("WebAuthn not supported on this device.");

  const stored = localStorage.getItem("webauthnCredential");
  if (!stored) throw new Error("No credential registered.");

  const cred = JSON.parse(stored);
  const challenge = generateChallenge();

  const rpId =
    window.location.hostname === "localhost"
      ? "localhost"
      : "stock-tracker-ecru-beta.vercel.app";

  const publicKey = {
    challenge: base64urlToArrayBuffer(challenge),
    rpId,
    allowCredentials: [
      {
        id: base64urlToArrayBuffer(cred.rawId),
        type: "public-key",
      },
    ],
    userVerification: "required",
    timeout: 15000,
  };

  // ✅ Android: Try Credential Manager first
  const isGoogleReady = await waitForGoogleIdentity();
  if (isGoogleReady) {
    try {
      console.log("📱 Using Google Credential Manager API for login...");
      const assertion = await window.google.identity.credentials.get({
        publicKey,
        mediation: "optional", // “optional” = user gesture not required
        signal: AbortSignal.timeout(10000),
      });
      if (assertion) return true;
    } catch (err) {
      console.warn("Google Credential Manager login failed, fallback:", err);
    }
  }

  // Fallback → Standard WebAuthn
  const assertion = await navigator.credentials.get({ publicKey });
  return !!assertion;
}
