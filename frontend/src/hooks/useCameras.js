import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { cameraService } from "../services/cameraService";

export function useCameras() {
  const { role, hospitalId } = useAuth();
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hospitalId) {
      setLoading(false);
      return;
    }
    const unsubscribe = cameraService.listenCameras(role, hospitalId, (cameraList) => {
      setCameras(cameraList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [role, hospitalId]);

  return { cameras, loading };
}
