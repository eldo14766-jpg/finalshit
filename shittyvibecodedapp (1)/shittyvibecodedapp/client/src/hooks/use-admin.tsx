import { useState, useEffect } from "react";

export function useAdmin() {
  const [isAdminMode, setIsAdminMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cryptoalerts_admin_mode");
    if (stored === "true") {
      setIsAdminMode(true);
    }
  }, []);

  const toggleAdminMode = () => {
    const newMode = !isAdminMode;
    setIsAdminMode(newMode);
    localStorage.setItem("cryptoalerts_admin_mode", newMode.toString());
  };

  return {
    isAdminMode,
    toggleAdminMode,
  };
}
