import { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import logo from "../assets/logo.png";

export default function Login({ setLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const auth = getAuth();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      setLoggedIn(true);
    } catch (err) {
      setError("Invalid email or password");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96">

        <div className="flex justify-center mb-4">
          <img
            src={logo}
            alt="Hospital Logo"
            className="w-24 h-24"
          />
        </div>

        <h1 className="text-3xl font-bold text-blue-600 mb-2 text-center">
          Well Care Hospital
        </h1>

        <p className="text-center text-gray-500 mb-6">
          AI Patient Monitoring System
        </p>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="w-full border p-3 rounded-lg mb-3"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full border p-3 rounded-lg mb-3"
        />

        <select className="w-full border p-3 rounded-lg mb-4">
          <option>Doctor</option>
          <option>Nurse</option>
          <option>Admin</option>
        </select>

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
        >
          Login
        </button>
      </div>
    </div>
  );
}