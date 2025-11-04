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

/**
 * Google Credential Manager availability
 */
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
 * Unified registration — fully stable across Android, iOS, Desktop
 */
export async function registerCredential() {
  if (!isWebAuthnSupported()) throw new Error("WebAuthn not supported on this device.");

  const challenge = generateChallenge();

  // Explicit domain (important for Android)
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
    pubKeyCredParams: [{ type: "public-key", alg: -7 }], // ES256
    timeout: 60000,
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "preferred", // ✅ changed from 'required' → fixes Android block
      userVerification: "preferred",
    },
  };

  // ✅ Prefer Credential Manager API for Android
  const isGoogleReady = await waitForGoogleIdentity();
  if (isGoogleReady) {
    try {
      console.log("📱 Using Google Credential Manager API for passkey registration...");

      const cred = await window.google.identity.credentials.create({
        create: { publicKey }, // ✅ FIXED — correct structure
        mediation: "required",
        signal: AbortSignal.timeout(15000),
      });

      if (cred) {
        const data = {
          id: cred.id,
          rawId: cred.rawId ? arrayBufferToBase64url(cred.rawId) : "",
          type: cred.type,
        };
        localStorage.setItem("webauthnCredential", JSON.stringify(data));
        console.log("✅ Passkey registered successfully (Credential Manager).");
        return data;
      }
    } catch (err) {
      console.warn("Google Credential Manager registration failed:", err);
    }
  }

  // ✅ Fallback: Standard WebAuthn (Safari / Desktop)
  try {
    const credential = await navigator.credentials.create({ publicKey });
    if (!credential) throw new Error("No credential returned");

    const credentialData = {
      id: credential.id,
      rawId: arrayBufferToBase64url(credential.rawId),
      type: credential.type,
    };
    localStorage.setItem("webauthnCredential", JSON.stringify(credentialData));
    console.log("✅ Passkey registered successfully (Standard WebAuthn).");
    return credentialData;
  } catch (err) {
    console.error("❌ WebAuthn registration failed:", err);
    throw new Error("Failed to register credential. Try again.");
  }
}

/**
 * Unified verification / sign-in
 */export async function verifyCredential() {
  if (!isWebAuthnSupported()) throw new Error("WebAuthn not supported on this device.");

  const stored = localStorage.getItem("webauthnCredential");
  const challenge = generateChallenge();

  const rpId =
    window.location.hostname === "localhost"
      ? "localhost"
      : "stock-tracker-ecru-beta.vercel.app";

  const publicKey = {
    challenge: base64urlToArrayBuffer(challenge),
    rpId,
    userVerification: "preferred",
    timeout: 30000,
  };

  // ✅ If Google Credential Manager is available, let it auto-discover credentials
  const isGoogleReady = await waitForGoogleIdentity();
  if (isGoogleReady) {
    try {
      console.log("📱 Using Google Credential Manager API for login...");

      // ⚠️ Important: don't pass `publicKey` here — it blocks auto-discovery
      const assertion = await window.google.identity.credentials.get({
        mediation: "optional",
        signal: AbortSignal.timeout(20000),
      });

      if (assertion) {
        console.log("✅ Credential verified via Google Credential Manager.");
        return true;
      }
    } catch (err) {
      console.warn("⚠️ Google Credential Manager login failed, falling back:", err);
    }
  }

  // ✅ Fallback for standard WebAuthn (Safari / desktop)
  if (stored) {
    const cred = JSON.parse(stored);
    publicKey.allowCredentials = [
      {
        id: base64urlToArrayBuffer(cred.rawId),
        type: "public-key",
      },
    ];
  }

  try {
    const assertion = await navigator.credentials.get({ publicKey });
    if (assertion) {
      console.log("✅ Credential verified via standard WebAuthn fallback.");
      return true;
    }
  } catch (err) {
    console.error("❌ WebAuthn fallback failed:", err);
    throw new Error("Verification failed. Please try again.");
  }

  throw new Error("No credentials available for this app.");
}
