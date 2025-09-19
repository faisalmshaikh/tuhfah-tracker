import React, { useState, useEffect } from 'react'
import logo from './logo.png';
//import { GoogleLogin, googleLogout } from '@react-oauth/google';
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
//import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import MainLayout from './MainLayout';
import { BrowserRouter } from 'react-router-dom';


import './App.css';
type GoogleUser = {
  name: string;
  email: string;
  picture: string;
  token: string; // new
};

function LoginScreen({ onLogin }: { onLogin: (user: GoogleUser) => void }) {
  const login = useGoogleLogin({
    scope: "openid email profile https://www.googleapis.com/auth/drive.readonly",
    onSuccess: async (tokenResponse) => {
      try {
        // Fetch user profile info with access_token
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
		  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
		});
		const userInfo = await res.json();
		
       //const userData: GoogleUser = {
       //  name: userInfo.data.name,
       //  email: userInfo.data.email,
       //  picture: userInfo.data.picture,
       //  token: tokenResponse.access_token, // 👈 keep access token for Drive API
       //};
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

function App() {
  const [user, setUser] = useState<GoogleUser | null>(null);

  // Restore persisted login
  useEffect(() => {
    const stored = localStorage.getItem("tuhfah-user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const handleLogin = (userData: GoogleUser) => {
    setUser(userData);
    localStorage.setItem("tuhfah-user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("tuhfah-user");
  };

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID!}>
      {user ? (
        <MainLayout user={user} onLogout={handleLogout} />
      ) : (
        <LoginScreen onLogin={handleLogin} />
      )}
    </GoogleOAuthProvider>
  );
}

export default App;