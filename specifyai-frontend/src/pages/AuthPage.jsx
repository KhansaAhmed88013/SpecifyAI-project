import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AtSign, Lock, User } from "lucide-react";

const cardMotion = {
  initial: { opacity: 0, y: 26, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -18, scale: 0.98 },
  transition: { duration: 0.45, ease: "easeOut" },
};

export default function AuthPage({
  mode,
  onSubmit,
  isSubmitting,
  error,
  notice,
}) {
  const isRegister = mode === "register";
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState(null);

  const title = useMemo(
    () => (isRegister ? "Create Your Account" : "Welcome Back"),
    [isRegister],
  );

  const subtitle = useMemo(
    () =>
      isRegister
        ? "Join SpecifyAI and generate polished specs faster."
        : "Sign in and continue building with your AI workspace.",
    [isRegister],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setLocalError(null);
    if (isRegister && !username.trim()) {
      setLocalError("Username is required.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setLocalError("Please enter a valid email address.");
      return;
    }
    if (password.trim().length < 8) {
      setLocalError("Password must be at least 8 characters.");
      return;
    }

    await onSubmit({
      username: username.trim(),
      email: email.trim(),
      password,
    });
  };

  const sharedInputClasses =
    "w-full rounded-xl border border-white/30 bg-white/20 py-3 pl-11 pr-4 text-white placeholder:text-gray-300 outline-none transition-all duration-300 focus:ring-2 focus:ring-blue-400";

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <AnimatePresence mode="wait">
        <motion.section
          key={mode}
          initial={cardMotion.initial}
          animate={cardMotion.animate}
          exit={cardMotion.exit}
          transition={cardMotion.transition}
          className="relative z-10 w-full max-w-sm space-y-3 rounded-2xl border border-cyan-200/25 bg-white/10 p-6 shadow-2xl shadow-cyan-500/20 backdrop-blur-lg transition-all duration-300"
        >
          <div className="space-y-2 text-center transition-all duration-300">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200/90 transition-all duration-300">
              SpecifyAI
            </p>
            <h1 className="text-3xl font-semibold text-white transition-all duration-300">
              {title}
            </h1>
            <p className="text-sm text-blue-100/90 transition-all duration-300">
              {subtitle}
            </p>
            {notice ? (
              <p className="text-sm text-cyan-100 transition-all duration-300">
                {notice}
              </p>
            ) : null}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isRegister ? (
              <motion.label
                whileFocus={{ scale: 1.01 }}
                className="relative block transition-all duration-300"
              >
                <User
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-100/80"
                />
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className={sharedInputClasses}
                  placeholder="Username"
                  autoComplete="username"
                  required
                />
              </motion.label>
            ) : null}

            <motion.label
              whileFocus={{ scale: 1.01 }}
              className="relative block transition-all duration-300"
            >
              <AtSign
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-100/80"
              />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={sharedInputClasses}
                placeholder="Email"
                autoComplete="email"
                required
              />
            </motion.label>

            <motion.label
              whileFocus={{ scale: 1.01 }}
              className="relative block transition-all duration-300"
            >
              <Lock
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-100/80"
              />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={sharedInputClasses}
                placeholder="Password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                required
              />
            </motion.label>

            {!isRegister ? (
              <div className="text-right transition-all duration-300">
                <Link
                  to="/forgot-password"
                  className="text-sm text-cyan-200 transition-all duration-300 hover:text-cyan-100"
                >
                  Forgot password?
                </Link>
              </div>
            ) : null}

            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 py-3 font-semibold text-white shadow-lg shadow-blue-900/40 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting
                ? isRegister
                  ? "Creating account..."
                  : "Signing in..."
                : isRegister
                  ? "Create Account"
                  : "Login"}
            </motion.button>

            {localError || error ? (
              <p className="text-sm text-rose-200 transition-all duration-300">
                {localError ?? error}
              </p>
            ) : null}

            <p className="pt-1 text-center text-sm text-cyan-100/90 transition-all duration-300">
              {isRegister ? "Already have an account? " : "Need an account? "}
              <Link
                to={isRegister ? "/login" : "/signup"}
                className="font-semibold text-white transition-all duration-300 hover:text-cyan-200"
              >
                {isRegister ? "Login" : "Register"}
              </Link>
            </p>
          </form>
        </motion.section>
      </AnimatePresence>
    </div>
  );
}