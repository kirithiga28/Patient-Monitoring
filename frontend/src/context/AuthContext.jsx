import { createContext, useContext, useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Fetch custom role and tenant data from Firestore users collection
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            // If user logged in but doesn't exist in users collection, create a default user record
            // For convenience of testing and setup, we check if email is admin-like
            const email = user.email || "";
            let role = "caregiver";
            if (email.includes("superadmin")) {
              role = "super_admin";
            } else if (email.includes("admin")) {
              role = "hospital_admin";
            } else if (email.includes("doctor")) {
              role = "doctor";
            } else if (email.includes("nurse")) {
              role = "nurse";
            }

            const defaultUserData = {
              uid: user.uid,
              email: user.email,
              name: user.displayName || user.email.split("@")[0],
              role: role,
              hospitalId: "hosp_default", // default multi-tenant hospital id
              assignedPatients: [],
              assignedRooms: [],
              status: "active",
              createdAt: new Date().toISOString()
            };

            await setDoc(userDocRef, defaultUserData);
            setUserData(defaultUserData);
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    await signOut(auth);
    setLoading(false);
  };

  const hasPermission = (requiredRoles) => {
    if (!userData) return false;
    if (userData.role === "super_admin") return true; // Super Admin has access to everything
    return requiredRoles.includes(userData.role);
  };

  const value = {
    currentUser,
    userData,
    loading,
    login,
    logout,
    hasPermission,
    hospitalId: userData?.hospitalId || null,
    role: userData?.role || null
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
