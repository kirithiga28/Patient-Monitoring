import { useAuth } from "../context/AuthContext";

export default function RoleGuard({ allowedRoles, children, fallback = null }) {
  const { hasPermission } = useAuth();

  if (hasPermission(allowedRoles)) {
    return children;
  }

  return fallback;
}
