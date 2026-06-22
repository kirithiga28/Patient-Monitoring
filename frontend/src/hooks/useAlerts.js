import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { alertService } from "../services/alertService";

export function useAlerts() {
  const { role, hospitalId } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hospitalId) {
      setLoading(false);
      return;
    }
    const unsubscribe = alertService.listenAlerts(role, hospitalId, (alertList) => {
      setAlerts(alertList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [role, hospitalId]);

  return { alerts, loading };
}
