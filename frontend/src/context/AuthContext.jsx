import { createContext, useContext, useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged 
} from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase/config";

const AuthContext = createContext(null);
const BACKEND_URL = "http://localhost:5000";

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore doctor session from localStorage or Firebase on mount
  useEffect(() => {
    let unsubUserDoc = null;

    const savedSession = localStorage.getItem("wellcare_doctor_session");
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.email) {
          setUserData(parsed);
          setCurrentUser({ uid: parsed.id || parsed.uid, email: parsed.email, displayName: parsed.name });
        }
      } catch (e) {
        console.warn("Failed to parse saved doctor session:", e);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const userDocRef = doc(db, "users", user.uid);
        
        unsubUserDoc = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const fullProfile = {
              uid: user.uid,
              id: user.uid,
              name: data.name || user.displayName || "Dr. WellCare",
              email: user.email,
              mobile: data.mobile || data.phone || "+1-555-0199",
              department: data.department || data.specialization || "General Medicine",
              specialization: data.specialization || data.department || "General Medicine",
              qualification: data.qualification || "MBBS, MD",
              profilePhoto: data.profilePhoto || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150",
              hospitalName: "Well Care Hospital",
              hospitalCode: data.hospitalCode || "WHC-2026-1001",
              hospitalId: data.hospitalCode || "WHC-2026-1001",
              role: "doctor",
              createdAt: data.createdAt || new Date().toISOString()
            };
            setUserData(fullProfile);
            localStorage.setItem("wellcare_doctor_session", JSON.stringify(fullProfile));
          }
          setLoading(false);
        }, (err) => {
          console.warn("Firestore snapshot warning:", err.message);
          setLoading(false);
        });
      } else {
        if (unsubUserDoc) {
          unsubUserDoc();
          unsubUserDoc = null;
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, []);

  // Doctor Login
  const login = async (email, password) => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Try Backend REST API first
      let apiSuccess = false;
      let apiDoctor = null;
      try {
        const res = await fetch(`${BACKEND_URL}/api/doctors/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, password })
        });
        const data = await res.json();
        if (res.ok && data.success && data.doctor) {
          apiSuccess = true;
          apiDoctor = data.doctor;
        } else if (res.status === 401 || res.status === 400) {
          throw new Error(data.message || "Invalid credentials.");
        }
      } catch (backendErr) {
        if (backendErr.message && (backendErr.message.includes("credentials") || backendErr.message.includes("not found"))) {
          throw backendErr;
        }
        console.warn("Backend API login offline/skipped, attempting Firebase auth:", backendErr.message);
      }

      // 2. Try Firebase Auth
      let user = null;
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        user = userCredential.user;
      } catch (fbErr) {
        if (!apiSuccess) {
          throw new Error("Invalid email or password. Please check your credentials.");
        }
      }

      const doctorId = user?.uid || apiDoctor?.id || `DOC-${Math.floor(1000 + Math.random() * 9000)}`;
      const doctorProfile = {
        id: doctorId,
        uid: doctorId,
        name: apiDoctor?.name || user?.displayName || `Dr. ${cleanEmail.split("@")[0]}`,
        email: cleanEmail,
        mobile: apiDoctor?.mobile || "+1-555-0199",
        department: apiDoctor?.department || "General Medicine",
        specialization: apiDoctor?.specialization || "General Medicine",
        qualification: apiDoctor?.qualification || "MBBS, MD",
        hospitalName: "Well Care Hospital",
        hospitalCode: "WHC-2026-1001",
        hospitalId: "WHC-2026-1001",
        profilePhoto: apiDoctor?.profilePhoto || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150",
        role: "doctor",
        createdAt: apiDoctor?.createdAt || new Date().toISOString()
      };

      setCurrentUser(user || { uid: doctorId, email: cleanEmail });
      setUserData(doctorProfile);
      localStorage.setItem("wellcare_doctor_session", JSON.stringify(doctorProfile));

      return doctorProfile;
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Doctor Signup / Registration
  const signup = async (email, password, extraData) => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Send to Backend REST API (with hashed password)
      let apiDoctor = null;
      try {
        const res = await fetch(`${BACKEND_URL}/api/doctors/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            password,
            fullName: extraData.fullName || extraData.name,
            name: extraData.fullName || extraData.name,
            mobile: extraData.mobile,
            medRegNo: extraData.medRegNo,
            hospitalCode: extraData.hospitalCode || "WHC-2026-1001",
            department: extraData.department || "General Medicine",
            qualification: extraData.qualification || "MBBS, MD"
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Registration failed on backend server.");
        }
        apiDoctor = data.doctor;
      } catch (backendErr) {
        if (backendErr.message && backendErr.message.includes("already exists")) {
          throw backendErr;
        }
        console.warn("Backend REST API offline/warning:", backendErr.message);
      }

      // 2. Create in Firebase Auth & Firestore
      let user = null;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        user = userCredential.user;
      } catch (fbErr) {
        if (fbErr.code === "auth/email-already-in-use") {
          throw new Error("An account with this email address already exists.");
        }
      }

      const doctorId = user?.uid || apiDoctor?.id || `DOC-${Math.floor(1000 + Math.random() * 9000)}`;
      const doctorProfile = {
        id: doctorId,
        uid: doctorId,
        name: extraData.fullName || extraData.name || `Dr. ${cleanEmail.split("@")[0]}`,
        email: cleanEmail,
        mobile: extraData.mobile || "+1-555-0199",
        medRegNo: extraData.medRegNo || "MED-89172",
        department: extraData.department || "General Medicine",
        specialization: extraData.specialization || "General Medicine",
        qualification: extraData.qualification || "MBBS, MD",
        hospitalName: "Well Care Hospital",
        hospitalCode: extraData.hospitalCode || "WHC-2026-1001",
        hospitalId: extraData.hospitalCode || "WHC-2026-1001",
        profilePhoto: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150",
        role: "doctor",
        createdAt: new Date().toISOString()
      };

      if (user?.uid) {
        try {
          await setDoc(doc(db, "users", user.uid), doctorProfile, { merge: true });
        } catch (fsErr) {
          console.warn("Firestore save warning:", fsErr.message);
        }
      }

      setCurrentUser(user || { uid: doctorId, email: cleanEmail });
      setUserData(doctorProfile);
      localStorage.setItem("wellcare_doctor_session", JSON.stringify(doctorProfile));

      return doctorProfile;
    } catch (err) {
      console.error("Signup error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update Doctor Profile
  const updateDoctorProfile = async (updatedFields) => {
    if (!userData) return;

    const cleanUpdates = {
      name: updatedFields.name || userData.name,
      mobile: updatedFields.mobile || updatedFields.phone || userData.mobile,
      department: updatedFields.department || updatedFields.specialization || userData.department,
      specialization: updatedFields.specialization || updatedFields.department || userData.specialization,
      qualification: updatedFields.qualification || userData.qualification,
      profilePhoto: updatedFields.profilePhoto || userData.profilePhoto,
      // Email is immutable
      email: userData.email
    };

    const newUserData = { ...userData, ...cleanUpdates };
    setUserData(newUserData);
    localStorage.setItem("wellcare_doctor_session", JSON.stringify(newUserData));

    // Update backend REST API
    try {
      await fetch(`${BACKEND_URL}/api/doctors/profile/${userData.id || userData.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanUpdates)
      });
    } catch (e) {
      console.warn("Backend profile sync warning:", e);
    }

    // Update Firestore if user is authenticated
    if (currentUser?.uid) {
      try {
        await setDoc(doc(db, "users", currentUser.uid), cleanUpdates, { merge: true });
      } catch (e) {
        console.warn("Firestore profile sync warning:", e);
      }
    }
  };

  const forgotPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err) {
      console.warn("Firebase password reset warning:", err);
      // Don't fail if demo email
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("SignOut error:", err);
    }
    localStorage.removeItem("wellcare_doctor_session");
    localStorage.removeItem("wellcare_user");
    localStorage.removeItem("wellcare_userdata");
    setCurrentUser(null);
    setUserData(null);
    setLoading(false);
  };

  const value = {
    currentUser,
    userData,
    loading,
    login,
    signup,
    logout,
    forgotPassword,
    updateDoctorProfile,
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
