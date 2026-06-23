import { createContext, useContext, useState, useEffect } from "react";
import { 
  signInAnonymously, 
  signOut 
} from "firebase/auth";
import { auth } from "../firebase/config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("wellcare_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [userData, setUserData] = useState(() => {
    const saved = localStorage.getItem("wellcare_userdata");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Automatically trigger anonymous background login if logged in locally
    const initAuth = async () => {
      if (currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.warn("Background Firebase Auth anonymous sign-in failed:", err);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [currentUser]);

  const login = async (username, password) => {
    setLoading(true);
    const normalizedUsername = username.trim().toLowerCase();
    
    if (normalizedUsername === "doctor" && password === "doctor123") {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.warn("Background anonymous sign-in failed during login:", err);
      }

      const mockUser = {
        uid: "doctor_uid",
        email: "doctor@wellcare.com",
        name: "Dr. Rajesh Mehta"
      };

      const mockUserData = {
        uid: "doctor_uid",
        email: "doctor@wellcare.com",
        name: "Dr. Rajesh Mehta",
        role: "doctor",
        hospitalId: "hosp_default",
        hospitalName: "Well Care Hospital",
        status: "active"
      };

      localStorage.setItem("wellcare_user", JSON.stringify(mockUser));
      localStorage.setItem("wellcare_userdata", JSON.stringify(mockUserData));
      setCurrentUser(mockUser);
      setUserData(mockUserData);
      setLoading(false);
      return mockUser;
    } else {
      setLoading(false);
      throw new Error("Invalid username or password");
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("SignOut error:", err);
    }
    localStorage.removeItem("wellcare_user");
    localStorage.removeItem("wellcare_userdata");
    setCurrentUser(null);
    setUserData(null);
    setLoading(false);
  };

  const hasPermission = (requiredRoles) => {
    return true; // Doctor has access to all remaining pages
  };

  const value = {
    currentUser,
    userData,
    loading,
    login,
    logout,
    hasPermission,
    hospitalId: userData?.hospitalId || "hosp_default",
    role: "doctor"
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

