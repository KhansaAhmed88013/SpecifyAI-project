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
      <div className="min-h-screen bg-white transition-colors dark:bg-slate-950">
        <section className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full max-w-md space-y-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600 dark:text-teal-400">
              SpecifyAI
            </p>
            <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
              Verify Reset Code
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Please request a reset code first.
            </p>
            <Link
              to="/forgot-password"
              className="inline-flex text-sm font-semibold text-teal-700 transition-all duration-200 ease-in-out hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300"
            >
              Go to Forgot Password
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white transition-colors dark:bg-slate-950">
      <section className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600 dark:text-teal-400">
              SpecifyAI
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-800 dark:text-slate-100">
              Verify Reset Code
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Enter the 6-digit code sent to your email.
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
                  htmlFor="reset-code"
                  className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
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
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 outline-none transition-all duration-200 ease-in-out focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-teal-400"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 ease-in-out hover:bg-teal-800"
              >
                {isSubmitting ? "Verifying..." : "Verify Code"}
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
