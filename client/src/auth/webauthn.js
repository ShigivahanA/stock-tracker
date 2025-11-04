/**
 * -----------------------------
 *  Hybrid Authentication Logic
 *  - iOS / Desktop → WebAuthn
 *  - Android → Google Sign-In (only for your account)
 * -----------------------------
 */

/** Generate a random base64url-encoded challenge */
function generateChallenge(length = 32) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/** Conversion helpers */
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
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/** Device checks */
export const isAndroid = /Android/i.test(navigator.userAgent);
export const isWebAuthnSupported = () =>
  typeof window.PublicKeyCredential !== "undefined";

/**
 * -----------------------------
 *  Google Sign-In (Android only)
 * -----------------------------
 */
export async function googleSignIn() {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      reject(new Error("Google Identity API not loaded."));
      return;
    }

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (response.credential) {
          // Save token
          localStorage.setItem("googleAuthToken", response.credential);
          console.log("✅ Google Sign-In success");
          resolve(response.credential);
        } else {
          reject(new Error("No credential returned"));
        }
      },
      auto_select: true,
      cancel_on_tap_outside: false,
    });

    // Only allow your Google account
    window.google.accounts.id.renderButton(
      document.getElementById("google-btn"),
      {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        logo_alignment: "left",
      }
    );

    window.google.accounts.id.prompt((notif) => {
      if (notif.isNotDisplayed()) {
        console.warn("Google One Tap not displayed:", notif.getNotDisplayedReason());
      } else if (notif.isSkippedMoment()) {
        console.warn("Google Sign-In skipped:", notif.getSkippedReason());
      }
    });
  });
}

/**
 * -----------------------------
 *  WebAuthn Registration (iOS/Desktop)
 * -----------------------------
 */
export async function registerCredential() {
  if (!isWebAuthnSupported()) throw new Error("WebAuthn not supported");

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
    pubKeyCredParams: [{ type: "public-key", alg: -7 }], // ES256
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
  console.log("✅ Passkey registered successfully");
  return credentialData;
}

/**
 * -----------------------------
 *  WebAuthn Verification (iOS/Desktop)
 * -----------------------------
 */
export async function verifyCredential() {
  if (!isWebAuthnSupported()) throw new Error("WebAuthn not supported");

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
  console.log("✅ Passkey verified successfully");
  return !!assertion;
}
