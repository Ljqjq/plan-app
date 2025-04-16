
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import TodoApp from "./components/TodoApp";
import PrivateRoute from "./components/PrivateRoute";
import Home from "./pages/Home";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Home>
              <TodoApp />
            </Home>
          </PrivateRoute>
        }
      />
      
      <Route
        path="/todo"
        element={
          <PrivateRoute>
            <Home>
              <TodoApp />
            </Home>
          </PrivateRoute>
        }
      />

      {/* Fallback route for unmatched paths */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
