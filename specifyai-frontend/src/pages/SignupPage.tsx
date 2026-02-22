import type { FormEvent } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { getErrorMessage } from "../services/api";

type SignupPageProps = {
  onSignup: (email: string, username: string, password: string) => Promise<void>;
};

export default function SignupPage({ onSignup }: SignupPageProps) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }
    setError(null);
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.trim().length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    try {
      setIsSubmitting(true);
      await onSignup(email.trim(), username.trim(), password);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Signup failed."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPasswordMismatch =
    password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="min-h-screen bg-white transition-colors dark:bg-slate-950">
      <section className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600 dark:text-teal-400">
              SpecifyAI
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-800 dark:text-slate-100">
              Create an Account
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create your demo account to continue.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-md transition-all duration-200 ease-in-out dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="signup-username"
                  className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Username
                </label>
                <input
                  id="signup-username"
                  type="text"
                  placeholder="yourusername"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 outline-none transition-all duration-200 ease-in-out focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-teal-400"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="signup-email"
                  className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  placeholder="you@gmail.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 outline-none transition-all duration-200 ease-in-out focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-teal-400"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="signup-password"
                  className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 outline-none transition-all duration-200 ease-in-out focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-teal-400"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="signup-confirm-password"
                  className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Confirm Password
                </label>
                <input
                  id="signup-confirm-password"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 outline-none transition-all duration-200 ease-in-out focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-teal-400"
                  required
                />
                {isPasswordMismatch ? (
                  <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">
                    Passwords do not match.
                  </p>
                ) : null}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 ease-in-out hover:bg-teal-800"
              >
                {isSubmitting ? "Creating..." : "Sign Up"}
              </button>
              {error ? (
                <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
              ) : null}
              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-teal-700 transition-all duration-200 ease-in-out hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300"
                >
                  Log in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
