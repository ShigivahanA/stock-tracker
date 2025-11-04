// src/auth/webauthn.js

/**
 * Utility: Generate a random base64url-encoded challenge
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
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function arrayBufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Capability check
 */
export const isWebAuthnSupported = () =>
  typeof window.PublicKeyCredential !== "undefined";

/**
 * Detect if Google Credential Manager API is available (Android only)
 */
function isGoogleCredentialManagerAvailable() {
  return (
    typeof window.google !== "undefined" &&
    window.google.identity &&
    window.google.identity.credentials
  );
}

/**
 * Unified registration (works for iOS, Android, Desktop)
 */
export async function registerCredential() {
  if (!isWebAuthnSupported()) throw new Error("WebAuthn not supported");

  const challenge = generateChallenge();

  const publicKey = {
    challenge: base64urlToArrayBuffer(challenge),
    rp: {
      name: "Stock Tracker",
      id: window.location.hostname, // critical for Android/PWA consistency
    },
    user: {
      id: new TextEncoder().encode("athithan-user"),
      name: "athithan@local",
      displayName: "Athithan",
    },
    pubKeyCredParams: [{ type: "public-key", alg: -7 }], // ES256
    timeout: 60000,
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "required",
      userVerification: "required",
    },
  };

  // ✅ Prefer Google Credential Manager API for Android
  if (isGoogleCredentialManagerAvailable()) {
    console.log("📱 Using Google Credential Manager API for passkey registration...");
    try {
      const cred = await window.google.identity.credentials.create({
        publicKey,
        mediation: "required",
      });
      if (cred) {
        const credentialData = {
          id: cred.id,
          rawId: cred.rawId ? arrayBufferToBase64url(cred.rawId) : "",
          type: cred.type,
        };
        localStorage.setItem("webauthnCredential", JSON.stringify(credentialData));
        return credentialData;
      }
    } catch (err) {
      console.warn("Google Credential Manager registration failed, falling back:", err);
    }
  }

  // fallback: standard WebAuthn
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
 */
export async function verifyCredential() {
  if (!isWebAuthnSupported()) throw new Error("WebAuthn not supported");

  const stored = localStorage.getItem("webauthnCredential");
  if (!stored) throw new Error("No credential registered.");

  const cred = JSON.parse(stored);
  const challenge = generateChallenge();

  const publicKey = {
    challenge: base64urlToArrayBuffer(challenge),
    rpId: window.location.hostname, // match domain
    allowCredentials: [
      {
        id: base64urlToArrayBuffer(cred.rawId),
        type: "public-key",
      },
    ],
    userVerification: "required",
    timeout: 60000,
  };

  // ✅ Try Google Credential Manager API for Android login
  if (isGoogleCredentialManagerAvailable()) {
    console.log("📱 Using Google Credential Manager API for login...");
    try {
      const assertion = await window.google.identity.credentials.get({
        publicKey,
        mediation: "optional",
      });
      if (assertion) return true;
    } catch (err) {
      console.warn("Google Credential Manager login failed, fallback:", err);
    }
  }

  // fallback: standard WebAuthn
  const assertion = await navigator.credentials.get({ publicKey });
  return !!assertion;
}
