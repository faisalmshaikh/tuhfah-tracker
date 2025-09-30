// src/LoginScreen.tsx
import React, { useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";

export type GoogleUser = {
  name: string;
  email: string;
  picture: string;
  token: string; // 👈 access_token for Drive API
  year?: number;
};

export default function LoginScreen({ onLogin }: { onLogin: (user: GoogleUser) => void }) {
  // Configure login for redirect flow
  const login = useGoogleLogin({
    scope: "openid email profile https://www.googleapis.com/auth/drive.file",
    ux_mode: "redirect",              // 👈 redirect instead of popup
    redirect_uri: window.location.origin, // 👈 must match your Google Cloud Console settings
    flow: "implicit",
  });

  // On mount, check if Google redirected back with access_token
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");

    if (accessToken) {
      // 1️⃣ Clean up the URL (remove the #access_token part)
      window.history.replaceState({}, document.title, window.location.pathname);

      // 2️⃣ Fetch user profile with access_token
      fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((res) => res.json())
        .then((userInfo) => {
          onLogin({
            name: userInfo.name,
            email: userInfo.email,
            picture: userInfo.picture,
            token: accessToken,
          });
        })
        .catch((err) => {
          console.error("Error fetching user info", err);
        });
    }
  }, [onLogin]);

  return (
    <div className="flex items-center justify-center h-screen">
      <button
        onClick={() => login()}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700"
      >
        Sign in with Google
      </button>
    </div>
  );
}
