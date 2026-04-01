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
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-black via-gray-900 to-black px-4 py-10 sm:px-6">
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-4xl items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/90">
              SpecifyAI
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              Forgot Password
            </h1>
            <p className="mt-1 text-sm text-white/70">
              Enter your email to receive a reset code.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 p-8 text-sm text-white/70 shadow-2xl shadow-blue-900/25 backdrop-blur-xl transition-all duration-300">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="forgot-email"
                  className="mb-1 block text-sm font-medium text-white/80"
                >
                  Email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="you@gmail.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white outline-none transition-all duration-300 placeholder:text-white/40 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_22px_rgba(59,130,246,0.45)] transition-all duration-300 hover:scale-105"
              >
                {isSubmitting ? "Sending..." : "Send Reset Code"}
              </button>
              {error ? (
                <p className="text-sm text-rose-200">{error}</p>
              ) : null}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
