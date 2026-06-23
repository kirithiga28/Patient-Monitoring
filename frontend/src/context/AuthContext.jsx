import { createContext, useContext, useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged 
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
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setCurrentUser(user);
            setUserData({ uid: user.uid, ...data });
            localStorage.setItem("wellcare_user", JSON.stringify(user));
            localStorage.setItem("wellcare_userdata", JSON.stringify({ uid: user.uid, ...data }));
          } else {
            setCurrentUser(user);
            // Default placeholder if firestore doc isn't written yet
            setUserData({
              uid: user.uid,
              name: user.displayName || "Doctor",
              email: user.email,
              role: "doctor",
              hospitalId: "WHC-2026-1001",
              hospitalCode: "WHC-2026-1001"
            });
          }
        } catch (err) {
          console.error("Error loading user profile on state change:", err);
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
        localStorage.removeItem("wellcare_user");
        localStorage.removeItem("wellcare_userdata");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Fetch Firestore metadata
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        // Force role to doctor for application access
        if (data.role !== "doctor") {
          await signOut(auth);
          throw new Error("Access denied. Only doctors can access this application.");
        }
        setUserData({ uid: user.uid, ...data });
      } else {
        throw new Error("Doctor profile not found in database.");
      }
      
      setCurrentUser(user);
      return user;
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, extraData) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const newUserData = {
        name: extraData.fullName,
        email: email.trim().toLowerCase(),
        mobile: extraData.mobile || "",
        medRegNo: extraData.medRegNo || "",
        hospitalCode: extraData.hospitalCode || "WHC-2026-1001",
        hospitalId: extraData.hospitalCode || "WHC-2026-1001",
        role: "doctor",
        status: "active",
        createdAt: new Date().toISOString()
      };
      
      // Save doctor details in users collection
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, newUserData);
      
      // Trigger hospital tenant setup defaults in Firestore if needed
      try {
        const hospDocRef = doc(db, "hospitals", newUserData.hospitalId);
        const hospSnap = await getDoc(hospDocRef);
        if (!hospSnap.exists()) {
          await setDoc(hospDocRef, {
            id: newUserData.hospitalId,
            name: "Well Care Hospital",
            code: newUserData.hospitalCode,
            createdAt: new Date().toISOString()
          });
        }
      } catch (hospErr) {
        console.warn("Could not register hospital tenant:", hospErr);
      }

      setUserData({ uid: user.uid, ...newUserData });
      setCurrentUser(user);
      return user;
    } catch (err) {
      console.error("Signup error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      console.error("Password reset error:", err);
      throw err;
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
    return true; // Doctor role has complete access
  };

  const value = {
    currentUser,
    userData,
    loading,
    login,
    signup,
    logout,
    forgotPassword,
    hasPermission,
    hospitalId: userData?.hospitalId || "WHC-2026-1001",
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

