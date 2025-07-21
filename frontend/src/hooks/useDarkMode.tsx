// frontend/src/hooks/useDarkMode.tsx

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function useDarkMode(): [Theme, () => void] {
  // Read saved theme or default to “dark”
  const [theme, setTheme] = useState<Theme>(
    (localStorage.getItem("theme") as Theme) || "dark"
  );

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Toggle function
  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return [theme, toggleTheme];
}
