import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { patientService } from "../services/patientService";

export function usePatients() {
  const { role, hospitalId, userData } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hospitalId) {
      setLoading(false);
      return;
    }
    const unsubscribe = patientService.listenPatients(
      role,
      hospitalId,
      userData?.assignedPatients,
      userData?.assignedRooms,
      (patientList) => {
        setPatients(patientList);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [role, hospitalId, userData]);

  return { patients, loading };
}
