import React, { useState, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  SafeAreaView, 
  StatusBar 
} from "react-native";
import { initializeApp, getApps } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  signOut 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  onSnapshot 
} from "firebase/firestore";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

// Use exact same Web Firebase credentials mapping
const firebaseConfig = {
  apiKey: "AIzaSyB1u587I1xB7XoegaU0Wv9UyR8_B7LKcxU",
  authDomain: "well-care-hospital.firebaseapp.com",
  projectId: "well-care-hospital",
  storageBucket: "well-care-hospital.firebasestorage.app",
  messagingSenderId: "451983806107",
  appId: "1:451983806107:web:34146d0b886c194c64803e",
  measurementId: "G-DS0H6M55ED"
};

// Initialize Firebase once
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
}
const auth = getAuth();
const db = getFirestore();

// Expo Notifications Configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [error, setError] = useState("");

  // Check auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      if (usr) {
        // Load additional user meta
        const userDocRef = collection(db, "users");
        const q = query(userDocRef, where("uid", "==", usr.uid));
        onSnapshot(q, (snap) => {
          if (!snap.empty) {
            setUserData(snap.docs[0].data());
          }
        });
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    registerForPushNotificationsAsync();

    return () => unsubscribe();
  }, []);

  // Sync real-time metrics
  useEffect(() => {
    if (!user || !userData) return;

    const hospId = userData.hospitalId || "hosp_default";
    const patientQuery = query(collection(db, "patients"), where("hospitalId", "==", hospId));
    const alertQuery = query(collection(db, "alerts"), where("hospitalId", "==", hospId));
    const cameraQuery = query(collection(db, "cameras"), where("hospitalId", "==", hospId));

    const unsubPatients = onSnapshot(patientQuery, (snapshot) => {
      setPatients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubAlerts = onSnapshot(alertQuery, (snapshot) => {
      setAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubCameras = onSnapshot(cameraQuery, (snapshot) => {
      setCameras(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubPatients();
      unsubAlerts();
      unsubCameras();
    };
  }, [user, userData]);

  const handleLogin = async () => {
    setError("");
    if (!email || !password) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("Invalid credentials. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const registerForPushNotificationsAsync = async () => {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        console.warn("Failed to get push token for push notification!");
        return;
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.card}>
          <Text style={styles.logo}>🏥</Text>
          <Text style={styles.title}>Well Care Hospital</Text>
          <Text style={styles.subtitle}>Mobile AI Patient Monitor</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TextInput
            placeholder="Email"
            placeholderTextColor="#64748b"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#64748b"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity onPress={handleLogin} style={styles.button}>
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.appContainer}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.hospitalName}>{userData?.hospitalName || "Well Care Hospital"}</Text>
          <Text style={styles.headerTitle}>Mobile Dashboard</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Exit</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs Content */}
      {activeTab === "dashboard" && (
        <View style={styles.tabContent}>
          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { borderLeftColor: "#3b82f6" }]}>
              <Text style={styles.statLabel}>Patients</Text>
              <Text style={styles.statVal}>{patients.length}</Text>
            </View>
            <View style={[styles.statBox, { borderLeftColor: "#ef4444" }]}>
              <Text style={styles.statLabel}>Critical</Text>
              <Text style={styles.statVal}>{patients.filter(p => p.status === "Critical").length}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>⚠️ Active Alerts</Text>
          <FlatList
            data={alerts.filter(a => a.status === "Open")}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.alertCard}>
                <Text style={styles.alertTitle}>{item.alertType} - Room {item.room}</Text>
                <Text style={styles.alertMeta}>Patient: {item.patientName} • {item.severity}</Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No open alerts at this time.</Text>
            }
          />
        </View>
      )}

      {activeTab === "patients" && (
        <View style={styles.tabContent}>
          <Text style={styles.sectionTitle}>👩‍⚕️ Patients Census</Text>
          <FlatList
            data={patients}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.patientCard}>
                <View style={styles.patientMain}>
                  <Text style={styles.patientName}>{item.name}</Text>
                  <Text style={styles.patientMeta}>Room: {item.room} • Age: {item.age} yrs</Text>
                  <Text style={styles.patientMeta}>Diagnosis: {item.diagnosis}</Text>
                </View>
                <Text style={[styles.statusBadge, {
                  color: item.status === "Critical" ? "#ef4444" : item.status === "Observation" ? "#eab308" : "#10b981"
                }]}>{item.status}</Text>
              </View>
            )}
          />
        </View>
      )}

      {activeTab === "cameras" && (
        <View style={styles.tabContent}>
          <Text style={styles.sectionTitle}>📹 Ward Camera Nodes</Text>
          <FlatList
            data={cameras}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.patientCard}>
                <View style={styles.patientMain}>
                  <Text style={styles.patientName}>{item.name}</Text>
                  <Text style={styles.patientMeta}>Room: {item.room} • Type: {item.type}</Text>
                  <Text style={styles.patientMeta}>Assigned Patient ID: {item.patientId || "None"}</Text>
                </View>
                <Text style={[styles.statusBadge, {
                  color: item.status === "Active" ? "#10b981" : "#ef4444"
                }]}>{item.status}</Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No camera devices registered.</Text>
            }
          />
        </View>
      )}

      {activeTab === "reports" && (
        <View style={styles.tabContent}>
          <Text style={styles.sectionTitle}>📄 Live Roster & Audits Center</Text>
          <View style={styles.card}>
            <Text style={styles.hospitalName}>Clinical Overview Summary</Text>
            <View style={{ width: "100%", marginVertical: 10 }}>
              <Text style={styles.patientMeta}>• Total Registered Patients: {patients.length}</Text>
              <Text style={styles.patientMeta}>• Mapped Ward Cameras: {cameras.length}</Text>
              <Text style={styles.patientMeta}>• Active Incident Alerts: {alerts.filter(a => a.status === "Open").length}</Text>
              <Text style={styles.patientMeta}>• Total Critical Health Statuses: {patients.filter(p => p.status === "Critical").length}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Bottom Nav Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity 
          onPress={() => setActiveTab("dashboard")} 
          style={[styles.navBtn, activeTab === "dashboard" && styles.activeNavBtn]}
        >
          <Text style={styles.navBtnText}>📊 Metrics</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab("patients")} 
          style={[styles.navBtn, activeTab === "patients" && styles.activeNavBtn]}
        >
          <Text style={styles.navBtnText}>👨‍⚕️ Patients</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab("cameras")} 
          style={[styles.navBtn, activeTab === "cameras" && styles.activeNavBtn]}
        >
          <Text style={styles.navBtnText}>📹 Cameras</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab("reports")} 
          style={[styles.navBtn, activeTab === "reports" && styles.activeNavBtn]}
        >
          <Text style={styles.navBtnText}>📄 Reports</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center"
  },
  loginContainer: {
    flex: 1,
    backgroundColor: "#020617",
    justifyContent: "center",
    padding: 20
  },
  card: {
    backgroundColor: "#0f172a",
    borderColor: "#1e293b",
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    alignItems: "center"
  },
  logo: {
    fontSize: 50,
    marginBottom: 10
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center"
  },
  subtitle: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 20
  },
  input: {
    width: "100%",
    backgroundColor: "#020617",
    borderColor: "#1e293b",
    borderWidth: 1,
    borderRadius: 12,
    color: "#ffffff",
    padding: 14,
    fontSize: 14,
    marginBottom: 12
  },
  button: {
    width: "100%",
    backgroundColor: "#2563eb",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 10
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold"
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginBottom: 10
  },
  appContainer: {
    flex: 1,
    backgroundColor: "#020617"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#0f172a",
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b"
  },
  hospitalName: {
    color: "#3b82f6",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase"
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 2
  },
  logoutButton: {
    backgroundColor: "#1e293b",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  logoutText: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "bold"
  },
  tabContent: {
    flex: 1,
    padding: 20
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20
  },
  statBox: {
    flex: 1,
    backgroundColor: "#0f172a",
    borderColor: "#1e293b",
    borderWidth: 1,
    borderLeftWidth: 5,
    borderRadius: 14,
    padding: 16
  },
  statLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase"
  },
  statVal: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "extrabold",
    marginTop: 4
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10
  },
  alertCard: {
    backgroundColor: "#0f172a",
    borderColor: "#ef4444",
    borderLeftWidth: 4,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10
  },
  alertTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold"
  },
  alertMeta: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 4
  },
  emptyText: {
    color: "#475569",
    fontSize: 12,
    textAlign: "center",
    marginTop: 20
  },
  patientCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderColor: "#1e293b",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10
  },
  patientMain: {
    flex: 1
  },
  patientName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold"
  },
  patientMeta: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 3
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: "black",
    textTransform: "uppercase"
  },
  navBar: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    borderTopColor: "#1e293b",
    borderTopWidth: 1,
    padding: 10
  },
  navBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10
  },
  activeNavBtn: {
    backgroundColor: "#1e293b"
  },
  navBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold"
  }
});
