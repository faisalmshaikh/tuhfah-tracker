import React, { useState, useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import MainLayout from "./MainLayout";
import LoginScreen, { GoogleUser } from "./LoginScreen";

import "./App.css";

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
