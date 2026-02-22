import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getErrorMessage, getErrorStatus, resetPasswordWithToken } from "../services/api";
import { clearAuth } from "../services/auth";

const MIN_PASSWORD_LENGTH = 8;

type LocationState = {
  resetToken?: string;
};

type FieldErrors = {
  newPassword?: string;
  confirmPassword?: string;
};

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState | null) ?? null;
  const resetToken = state?.resetToken;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errors: FieldErrors = {};
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedNew) {
      errors.newPassword = "New password is required.";
    }
    if (!trimmedConfirm) {
      errors.confirmPassword = "Please confirm your new password.";
    }
    if (trimmedNew && trimmedNew.length < MIN_PASSWORD_LENGTH) {
      errors.newPassword = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (trimmedNew && trimmedConfirm && trimmedNew !== trimmedConfirm) {
      errors.confirmPassword = "Passwords do not match.";
    }

    return errors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setFormError(null);
    const validationErrors = validate();
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    if (!resetToken) {
      setFormError("Please start the reset flow again.");
      return;
    }

    try {
      setIsSubmitting(true);
      await resetPasswordWithToken({
        newPassword,
        confirmPassword,
        resetToken,
      });
      clearAuth();
      navigate("/login", {
        state: { message: "Password updated successfully. Please log in." },
      });
    } catch (err) {
      console.error(err);
      const status = getErrorStatus(err);
      if (
        (status === 400 || status === 401 || status === 404) &&
        err instanceof Error &&
        err.message
      ) {
        setFormError(err.message);
      } else {
        setFormError(getErrorMessage(err, "Failed to reset password."));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!resetToken) {
    return (
      <div className="max-h-screen bg-white transition-colors dark:bg-slate-950">
        <section className="mx-auto flex max-h-screen max-w-4xl items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full max-w-md space-y-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600 dark:text-teal-400">
              SpecifyAI
            </p>
            <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
              Reset Password
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Please verify your reset code first.
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
              Reset Password
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create a new password for your account.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-md transition-all duration-200 ease-in-out dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="reset-new-password"
                  className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  New Password
                </label>
                <input
                  id="reset-new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 outline-none transition-all duration-200 ease-in-out focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-teal-400"
                  required
                />
                {fieldErrors.newPassword ? (
                  <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">
                    {fieldErrors.newPassword}
                  </p>
                ) : null}
              </div>
              <div>
                <label
                  htmlFor="reset-confirm-password"
                  className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Confirm New Password
                </label>
                <input
                  id="reset-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 outline-none transition-all duration-200 ease-in-out focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-teal-400"
                  required
                />
                {fieldErrors.confirmPassword ? (
                  <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">
                    {fieldErrors.confirmPassword}
                  </p>
                ) : null}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 ease-in-out hover:bg-teal-800"
              >
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </button>
              {formError ? (
                <p className="text-sm text-rose-600 dark:text-rose-400">{formError}</p>
              ) : null}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
