import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply saved theme immediately to prevent flash
try {
  const stored = localStorage.getItem('poker-club-theme');
  if (stored) {
    const { theme, mode } = JSON.parse(stored);
    document.documentElement.classList.add(`theme-${theme}`, mode);
  } else {
    document.documentElement.classList.add('theme-default', 'dark');
  }
} catch {
  document.documentElement.classList.add('theme-default', 'dark');
}

createRoot(document.getElementById("root")!).render(<App />);
