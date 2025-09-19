import React, { useState, useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import MainLayout from "./MainLayout";
import LoginScreen, { GoogleUser } from "./LoginScreen";

import "./App.css";

function App() {
  const [user, setUser] = useState<GoogleUser | null>(null);

  // Restore persisted login
  useEffect(() => {
  const storedUser = localStorage.getItem("tuhfah-user");
  const storedYear = localStorage.getItem("tuhfah-year");
  if (storedUser) {
    const parsed = JSON.parse(storedUser);
    if (storedYear) {
      parsed.year = parseInt(storedYear, 10);
    }
    setUser(parsed);
  }
}, []);

  const handleLogin = async (userData: GoogleUser) => {
  // Check if year is already stored
  let storedYear = localStorage.getItem("tuhfah-year");

  if (!storedYear) {
    let year: number | null = null;

    while (year === null) {
      const input = prompt("Enter your year (1-8):");
      if (input === null) break; // user cancelled

      const parsed = parseInt(input, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 8) {
        year = parsed;
      } else {
        alert("Invalid year. Please enter a number between 1 and 8.");
      }
    }

    if (year !== null) {
      storedYear = year.toString();
      localStorage.setItem("tuhfah-year", storedYear);
    }
  }

  const finalUser = {
    ...userData,
    year: storedYear ? parseInt(storedYear, 10) : undefined,
  };

  setUser(finalUser);
  localStorage.setItem("tuhfah-user", JSON.stringify(finalUser));
};


  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("tuhfah-user");
  };

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID!}>
      {user ? (
        <MainLayout user={user} onLogout={handleLogout} setUser={setUser} />
      ) : (
        <LoginScreen onLogin={handleLogin} />
      )}
    </GoogleOAuthProvider>
  );
}

export default App;
