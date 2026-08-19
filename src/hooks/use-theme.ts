import { useEffect, useState } from "react";

export type Theme = "light" | "dark";
const KEY = "haggl.theme";

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

/** Day/night theme, persisted in localStorage and defaulting to the OS setting. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY) as Theme | null;
    const initial: Theme =
      stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
    apply(initial);
  }, []);

  const set = (next: Theme) => {
    setTheme(next);
    window.localStorage.setItem(KEY, next);
    apply(next);
  };

  return { theme, setTheme: set, toggle: () => set(theme === "dark" ? "light" : "dark") };
}
