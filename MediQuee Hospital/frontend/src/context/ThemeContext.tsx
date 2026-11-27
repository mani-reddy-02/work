import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "dark" | "light";

export type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

export const defaultThemeContext: ThemeContextType = {
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
};

const ThemeContext =
  ((globalThis as unknown as Record<string, unknown>).__MEDIQUEE_THEME_CONTEXT__ as React.Context<ThemeContextType>) ||
  createContext<ThemeContextType>(defaultThemeContext);

(globalThis as unknown as Record<string, unknown>).__MEDIQUEE_THEME_CONTEXT__ = ThemeContext;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const isExplicit = localStorage.getItem("theme_explicit") === "1";
    const saved = localStorage.getItem("theme");
    if (isExplicit && (saved === "dark" || saved === "light")) return saved;
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem("theme_explicit", "1");
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme_explicit", "1");
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  return context ?? defaultThemeContext;
}
