import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getErrorMessage, getErrorStatus } from "../services/api";

type LoginPageProps = {
  onLogin: (email: string, password: string) => Promise<void>;
};

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();
  const notice =
    (location.state as { message?: string } | null)?.message ?? null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }
    setError(null);
    try {
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
        setError("Please enter a valid email address.");
        return;
      }
      if (password.trim().length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      setIsSubmitting(true);
      await onLogin(email.trim(), password);
    } catch (err) {
      console.error(err);
      const status = getErrorStatus(err);
      if (status === 401 && err instanceof Error && err.message) {
        setError(err.message);
      } else {
        setError(getErrorMessage(err, "Login failed."));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-h-screen bg-white transition-colors dark:bg-slate-950">
      <section className="mx-auto flex max-h-screen max-w-4xl items-center justify-center px-4 py-5 sm:px-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600 dark:text-teal-400">
              SpecifyAI
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-800 dark:text-slate-100">
              Log in to SpecifyAI
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Please log in to continue.
            </p>
            {notice ? (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {notice}
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-md transition-all duration-200 ease-in-out dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Email
                </label>
                <input
                  id="email"
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
                  htmlFor="password"
                  className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 outline-none transition-all duration-200 ease-in-out focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-teal-400"
                  required
                />
                <Link
                  to="/forgot-password"
                  className="mt-2 inline-flex text-sm text-teal-700 transition-all duration-200 ease-in-out hover:underline dark:text-teal-400"
                >
                  Forgot password?
                </Link>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 ease-in-out hover:bg-teal-800"
              >
                {isSubmitting ? "Logging in..." : "Log In"}
              </button>
              {error ? (
                <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
              ) : null}
              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                Don&apos;t have an account?{" "}
                <Link
                  to="/signup"
                  className="font-semibold text-teal-700 transition-all duration-200 ease-in-out hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300"
                >
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
