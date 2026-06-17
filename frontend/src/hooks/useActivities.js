import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { activityService } from "../services/activityService";

export function useActivities(limitCount = 50) {
  const { role, hospitalId } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hospitalId) {
      setLoading(false);
      return;
    }
    const unsubscribe = activityService.listenActivities(role, hospitalId, (activitiesList) => {
      setActivities(activitiesList);
      setLoading(false);
    }, limitCount);
    return () => unsubscribe();
  }, [role, hospitalId, limitCount]);

  return { activities, loading };
}
