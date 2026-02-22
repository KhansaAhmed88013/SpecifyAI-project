import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

type NavbarProps = {
  userName: string;
  isLoggedIn: boolean;
  onLogout: () => void;
};

export default function Navbar({ userName, isLoggedIn, onLogout }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) {
        return;
      }
      if (!menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-20 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="text-lg font-semibold text-slate-900 hover:text-slate-700 dark:text-slate-100 dark:hover:text-slate-200"
        >
          SpecifyAI
        </Link>
      </div>
      <div className="flex items-center gap-3">
        {isLoggedIn ? (
          <div
            ref={menuRef}
            className="relative hidden sm:block"
            onMouseEnter={() => setIsMenuOpen(true)}
            onMouseLeave={() => setIsMenuOpen(false)}
            onBlur={(event) => {
              if (menuRef.current?.contains(event.relatedTarget as Node)) {
                return;
              }
              setIsMenuOpen(false);
            }}
          >
            <span className="absolute inset-x-0 top-full h-2" aria-hidden="true" />
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm text-slate-600 transition hover:text-slate-800 focus:outline-none dark:text-slate-300 dark:hover:text-slate-100"
              onFocus={() => setIsMenuOpen(true)}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setIsMenuOpen(false);
                }
              }}
              aria-haspopup="true"
              aria-expanded={isMenuOpen}
            >
              <span>{userName}</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="h-4 w-4 text-slate-400 dark:text-slate-500"
              >
                <path
                  d="M5.5 7.5L10 12l4.5-4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </button>
            {isMenuOpen ? (
              <div className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-md dark:border-slate-800 dark:bg-slate-900">
                <Link
                  to="/settings"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex w-full items-center px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex w-full items-center px-3 py-2 text-left text-sm text-red-500 transition hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
        <button
          type="button"
          onClick={toggleTheme}
          role="switch"
          aria-checked={theme === "dark"}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="relative inline-flex h-6 w-12 items-center rounded-full border border-slate-200 bg-slate-100 px-1 shadow-sm transition hover:bg-slate-200 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
        >
          <span
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-600 shadow-sm transition-transform dark:bg-slate-200 dark:text-slate-700 ${
              theme === "dark" ? "translate-x-7" : "translate-x-0"
            }`}
          >
            {theme === "dark" ? "On" : "Off"}
          </span>
        </button>
        <Link
          to="/new-project"
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
        >
          New Project
        </Link>
      </div>
    </header>
  );
}
