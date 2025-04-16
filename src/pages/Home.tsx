// src/pages/Home.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { useAuth } from "../hooks/useAuth";

interface HomeProps {
  children: React.ReactNode;
}

const Home: React.FC<HomeProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login"); // Redirect to login after sign off
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-purple-700 text-white py-4 shadow-md">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Event Planner</h1>
          <div>
            {loading ? (
              <span>Loading...</span>
            ) : user ? (
              <button
                onClick={handleSignOut}
                className="bg-red-600 px-4 py-2 rounded"
              >
                Sign Off
              </button>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="bg-green-600 px-4 py-2 rounded"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="container mx-auto p-6">{children}</main>
      <footer className="bg-gray-200 text-gray-600 py-2 text-center">
        <p>&copy; {new Date().getFullYear()} My Event Planner</p>
      </footer>
    </div>
  );
};

export default Home;
