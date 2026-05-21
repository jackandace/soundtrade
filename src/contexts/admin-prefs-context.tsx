"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type FontSize = "sm" | "md" | "lg";

type Ctx = {
  size: FontSize;
  setSize: (s: FontSize) => void;
};

const AdminPrefsContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "sound-trade-admin-font-size";

export function AdminPrefsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [size, setSizeState] = useState<FontSize>("md");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "sm" || raw === "md" || raw === "lg") {
        setSizeState(raw);
        document.documentElement.setAttribute("data-size", raw);
      } else {
        document.documentElement.setAttribute("data-size", "md");
      }
    } catch {
      // ignore
    }
  }, []);

  const setSize = useCallback((s: FontSize) => {
    setSizeState(s);
    try {
      localStorage.setItem(STORAGE_KEY, s);
    } catch {
      // ignore
    }
    document.documentElement.setAttribute("data-size", s);
  }, []);

  return (
    <AdminPrefsContext.Provider value={{ size, setSize }}>
      {children}
    </AdminPrefsContext.Provider>
  );
}

export function useAdminPrefs() {
  const ctx = useContext(AdminPrefsContext);
  if (!ctx) {
    throw new Error("useAdminPrefs must be used inside <AdminPrefsProvider>");
  }
  return ctx;
}
