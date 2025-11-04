// src/auth/webauthn.js

// Generate a random base64url-encoded challenge
function generateChallenge(length = 32) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// Convert from base64url string to ArrayBuffer
function base64urlToArrayBuffer(base64url) {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// Convert from ArrayBuffer to base64url
function arrayBufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// Check if device supports WebAuthn
export const isWebAuthnSupported = () =>
  window.PublicKeyCredential !== undefined;

// Register new credential
export async function registerCredential() {
  if (!isWebAuthnSupported()) throw new Error("WebAuthn not supported.");

  const challenge = generateChallenge();

  const publicKey = {
    challenge: base64urlToArrayBuffer(challenge),
    rp: { name: "Stock Tracker" },
    user: {
      id: new TextEncoder().encode("local-user"),
      name: "local@user",
      displayName: "Local User",
    },
    pubKeyCredParams: [{ type: "public-key", alg: -7 }],
    timeout: 60000,
    authenticatorSelection: { userVerification: "required" },
  };

  const credential = await navigator.credentials.create({ publicKey });

  const credentialData = {
    id: credential.id,
    rawId: arrayBufferToBase64url(credential.rawId),
    type: credential.type,
  };

  localStorage.setItem("webauthnCredential", JSON.stringify(credentialData));
  return credentialData;
}

// Authenticate existing credential
export async function verifyCredential() {
  if (!isWebAuthnSupported()) throw new Error("WebAuthn not supported.");

  const stored = localStorage.getItem("webauthnCredential");
  if (!stored) throw new Error("No credential registered.");

  const cred = JSON.parse(stored);

  const challenge = generateChallenge();

  const publicKey = {
  challenge: base64urlToArrayBuffer(challenge),
  rp: {
    name: "Stock Tracker",
    id: window.location.hostname, // auto use vercel domain (important!)
  },
  user: {
    id: new TextEncoder().encode("local-user"),
    name: "local@user",
    displayName: "Local User",
  },
  pubKeyCredParams: [{ type: "public-key", alg: -7 }],
  timeout: 60000,
  authenticatorSelection: {
    authenticatorAttachment: "platform", // ✅ uses fingerprint / Face ID
    userVerification: "required",
  },
};


  const assertion = await navigator.credentials.get({ publicKey });
  return !!assertion;
}
