import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

type NavbarProps = {
  userName: string;
  isLoggedIn: boolean;
  onLogout: () => void;
};

export default function Navbar({ userName, isLoggedIn, onLogout }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const headerClasses = isScrolled
    ? "fixed left-0 top-0 z-50 h-16 w-full border-b border-white/10 bg-slate-900/60 shadow-[0_0_25px_rgba(59,130,246,0.25)] backdrop-blur-xl transition-all duration-300"
    : "fixed left-0 top-0 z-50 h-16 w-full border-b border-white/10 bg-white/5 backdrop-blur-lg transition-all duration-300";

  return (
    <motion.header
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={headerClasses}
    >
      {!isScrolled ? (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" />
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5" />
      <motion.div
        className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent"
        animate={{ opacity: [0.35, 0.85, 0.35] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 sm:px-6 md:px-8">
        <Link
          to="/dashboard"
          className="text-lg font-semibold tracking-wide text-white transition-all duration-300 hover:text-white"
        >
          SpecifyAI
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
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
              className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white transition-all duration-300 hover:text-white focus:outline-none"
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
                className="h-4 w-4 text-white/70"
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
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-white/10 bg-slate-950/90 py-1 shadow-2xl shadow-blue-900/30 backdrop-blur-lg">
                <Link
                  to="/settings"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex w-full items-center px-3 py-2 text-left text-sm text-white/80 transition-all duration-300 hover:bg-white/10 hover:text-white"
                >
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex w-full items-center px-3 py-2 text-left text-sm text-rose-300 transition-all duration-300 hover:bg-rose-500/10 hover:text-rose-200"
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
          {/*<motion.button
            type="button"
            onClick={toggleTheme}
            whileHover={{ scale: 1.04 }}
            role="switch"
            aria-checked={theme === "dark"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="relative inline-flex h-7 w-14 items-center rounded-full border border-white/20 bg-white/10 px-1 text-[10px] font-semibold uppercase tracking-wide text-white transition-all duration-300 hover:text-white focus:outline-none"
          >
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[9px] font-bold text-slate-700 transition-all duration-300 ${
                theme === "dark" ? "translate-x-7" : "translate-x-0"
              }`}
            >
              {theme === "dark" ? "On" : "Off"}
            </span>
          </motion.button>
          */}

          <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
            <Link
              to="/new-project"
              className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_22px_rgba(59,130,246,0.45)] transition-all duration-300 hover:shadow-[0_0_28px_rgba(59,130,246,0.65)]"
            >
              New Project
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
