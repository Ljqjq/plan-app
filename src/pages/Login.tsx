
import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { auth, googleProvider } from "../services/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

type LoginFormValues = {
  email: string;
  password: string;
};

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>();
  const navigate = useNavigate();

  const signUp: SubmitHandler<LoginFormValues> = async (data) => {
    createUserWithEmailAndPassword(auth, data.email, data.password)
      .then((userCredential) => {
        console.log("Registered:", userCredential.user);
        navigate("/"); // Redirect to the home page after successful registration
      })
      .catch((error) => console.error("Registration Error:", error.message));
  };

  const signIn: SubmitHandler<LoginFormValues> = async (data) => {
    signInWithEmailAndPassword(auth, data.email, data.password)
      .then((userCredential) => {
        console.log("Logged in:", userCredential.user);
        navigate("/"); // Redirect to the home page after successful login
      })
      .catch((error) => console.error("Login Error:", error.message));
  };

  const signInWithGoogle = async () => {
    signInWithPopup(auth, googleProvider)
      .then((result) => {
        console.log("Google sign in:", result.user);
        navigate("/"); // Redirect to the home page after successful Google sign-in
      })
      .catch((error) => console.error("Google Sign-in Error:", error.message));
  };

  return (
    // Wrapper container: takes full screen height and centers its content both vertically and horizontally.
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {/* Login Card */}
      <div className="flex flex-col gap-4 p-6 max-w-sm w-full bg-white rounded-md shadow-md">
        <h2 className="text-xl font-bold mb-4 text-center">Login / Register</h2>
        <form onSubmit={handleSubmit(signIn)} className="flex flex-col gap-2">
          <input
            className="border p-2 rounded"
            placeholder="Email"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Invalid email format",
              },
            })}
          />
          {errors.email && (
            <p className="text-red-500 text-xs italic">{errors.email.message}</p>
          )}

          <input
            className="border p-2 rounded"
            placeholder="Password"
            type="password"
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
              },
            })}
          />
          {errors.password && (
            <p className="text-red-500 text-xs italic">{errors.password.message}</p>
          )}

          <button
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            type="submit"
          >
            Sign In
          </button>
        </form>

        <button
          className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
          onClick={handleSubmit(signUp)}
        >
          Register
        </button>

        <div className="border-t pt-4">
          <button
            className="bg-red-500 text-white p-2 rounded hover:bg-red-600 w-full"
            onClick={signInWithGoogle}
          >
            Sign In with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
