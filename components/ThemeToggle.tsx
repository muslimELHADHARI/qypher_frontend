"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    // Check if theme is saved in localStorage
    const savedTheme = localStorage.getItem("qypher-theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("qypher-theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl glass-panel hover:border-primary/50 transition-all group relative overflow-hidden"
      title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
    >
      <div className="relative z-10 flex items-center justify-center">
        {theme === "dark" ? (
          <Sun size={18} className="text-primary group-hover:rotate-12 transition-transform" />
        ) : (
          <Moon size={18} className="text-primary group-hover:-rotate-12 transition-transform" />
        )}
      </div>
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
