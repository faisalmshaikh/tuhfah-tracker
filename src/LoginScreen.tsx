// src/LoginScreen.tsx
import React from "react";
import { useGoogleLogin } from "@react-oauth/google";

export type GoogleUser = {
  name: string;
  email: string;
  picture: string;
  token: string; // 👈 access_token for Drive API
  year?: number;
};

export default function LoginScreen({ onLogin }: { onLogin: (user: GoogleUser) => void }) {
  const login = useGoogleLogin({
    scope: "openid email profile https://www.googleapis.com/auth/drive.readonly",
    onSuccess: async (tokenResponse) => {
      try {
        // Fetch user profile info with access_token
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await res.json();

        onLogin({
          name: userInfo.name,
          email: userInfo.email,
          picture: userInfo.picture,
          token: tokenResponse.access_token, // ✅ access_token, not id_token
        });
      } catch (err) {
        console.error("Error fetching user info", err);
      }
    },
    onError: () => {
      console.error("Login Failed");
    },
  });

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
