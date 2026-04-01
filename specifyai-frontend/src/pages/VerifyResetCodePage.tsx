import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getErrorMessage, getErrorStatus, verifyResetCode } from "../services/api";

type LocationState = {
  email?: string;
  notice?: string;
};

export default function VerifyResetCodePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState | null) ?? null;
  const email = state?.email;
  const notice = state?.notice;

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }
    setError(null);

    if (!email) {
      setError("Please start the reset flow again.");
      return;
    }

    const trimmedCode = code.trim();
    if (!/^\d{6}$/.test(trimmedCode)) {
      setError("Enter the 6-digit reset code.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await verifyResetCode({ email, code: trimmedCode });
      navigate("/reset-password", { state: { resetToken: response.resetToken } });
    } catch (err) {
      console.error(err);
      const status = getErrorStatus(err);
      if (
        (status === 400 || status === 401 || status === 404) &&
        err instanceof Error &&
        err.message
      ) {
        setError(err.message);
      } else {
        setError(getErrorMessage(err, "Invalid or expired code."));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-black via-gray-900 to-black px-4 py-10 sm:px-6">
        <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-4xl items-center justify-center">
          <div className="w-full max-w-md space-y-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/90">
              SpecifyAI
            </p>
            <h1 className="text-3xl font-semibold text-white">
              Verify Reset Code
            </h1>
            <p className="text-sm text-white/70">
              Please request a reset code first.
            </p>
            <Link
              to="/forgot-password"
              className="inline-flex rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 transition-all duration-300 hover:bg-white/15"
            >
              Go to Forgot Password
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-black via-gray-900 to-black px-4 py-10 sm:px-6">
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-4xl items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/90">
              SpecifyAI
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              Verify Reset Code
            </h1>
            <p className="mt-1 text-sm text-white/70">
              Enter the 6-digit code sent to your email.
            </p>
            {notice ? (
              <p className="mt-2 text-sm text-white/70">
                {notice}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 p-8 text-sm text-white/70 shadow-2xl shadow-blue-900/25 backdrop-blur-xl transition-all duration-300">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="reset-code"
                  className="mb-1 block text-sm font-medium text-white/80"
                >
                  Reset Code
                </label>
                <input
                  id="reset-code"
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white outline-none transition-all duration-300 placeholder:text-white/40 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_22px_rgba(59,130,246,0.45)] transition-all duration-300 hover:scale-105"
              >
                {isSubmitting ? "Verifying..." : "Verify Code"}
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
