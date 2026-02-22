import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword, getErrorMessage, getErrorStatus } from "../services/api";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }
    setError(null);

    const trimmedEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await forgotPassword({ email: trimmedEmail });
      navigate("/verify-reset-code", {
        state: {
          email: trimmedEmail,
          notice:
            response?.message ?? "Reset code sent",
        },
      });
    } catch (err) {
      console.error(err);
      const status = getErrorStatus(err);
      if ((status === 400 || status === 404) && err instanceof Error && err.message) {
        setError(err.message);
      } else {
        setError(getErrorMessage(err, "Failed to send reset code."));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-h-screen bg-white transition-colors dark:bg-slate-950">
      <section className="mx-auto flex max-h-screen max-w-4xl items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600 dark:text-teal-400">
              SpecifyAI
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-800 dark:text-slate-100">
              Forgot Password
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Enter your email to receive a reset code.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-md transition-all duration-200 ease-in-out dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="forgot-email"
                  className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="you@gmail.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 outline-none transition-all duration-200 ease-in-out focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-teal-400"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 ease-in-out hover:bg-teal-800"
              >
                {isSubmitting ? "Sending..." : "Send Reset Code"}
              </button>
              {error ? (
                <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
              ) : null}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
