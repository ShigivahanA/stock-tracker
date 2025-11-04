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

export const isAndroid = /Android/i.test(navigator.userAgent);
export const isWebAuthnSupported =
  typeof window.PublicKeyCredential !== "undefined";

/**
 * Passkey registration (iOS + Desktop)
 */
export async function registerCredential() {
  if (!isWebAuthnSupported) throw new Error("WebAuthn not supported");

  const challenge = generateChallenge();
  const rpId =
    window.location.hostname === "localhost"
      ? "localhost"
      : "stock-tracker-ecru-beta.vercel.app";

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
      residentKey: "preferred",
      userVerification: "preferred",
    },
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

/**
 * Passkey verification (iOS + Desktop)
 */
export async function verifyCredential() {
  if (!isWebAuthnSupported) throw new Error("WebAuthn not supported");

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
    userVerification: "preferred",
    timeout: 20000,
  };

  const assertion = await navigator.credentials.get({ publicKey });
  return !!assertion;
}
