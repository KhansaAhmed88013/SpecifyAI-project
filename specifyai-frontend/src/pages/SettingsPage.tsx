import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage, getErrorStatus, resetPassword } from "../services/api";
import { clearAuth } from "../services/auth";

const MIN_PASSWORD_LENGTH = 8;

type FieldErrors = {
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errors: FieldErrors = {};
    const trimmedOld = oldPassword.trim();
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedOld) {
      errors.oldPassword = "Old password is required.";
    }
    if (!trimmedNew) {
      errors.newPassword = "New password is required.";
    }
    if (!trimmedConfirm) {
      errors.confirmPassword = "Please confirm your new password.";
    }
    if (trimmedNew && trimmedOld && trimmedNew === trimmedOld) {
      errors.newPassword = "New password must be different from old password.";
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
    setSuccessMessage(null);
    const validationErrors = validate();
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      await resetPassword({
        oldPassword,
        newPassword,
      });
      setSuccessMessage("Password updated successfully.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setFieldErrors({});
    } catch (err) {
      console.error(err);
      const status = getErrorStatus(err);
      if (status === 401) {
        clearAuth();
        navigate("/login", {
          state: { message: "Your session expired. Please log in again." },
        });
        return;
      }
      if (status === 403 && err instanceof Error && err.message) {
        setFormError(err.message);
        return;
      }
      setFormError(getErrorMessage(err, "Failed to update password."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white transition-colors dark:bg-slate-950">
      <section className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Update your password and keep your account secure.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-md transition-all duration-200 ease-in-out dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="settings-old-password"
                className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Old Password
              </label>
              <input
                id="settings-old-password"
                type="password"
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 outline-none transition-all duration-200 ease-in-out focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-teal-400"
                required
              />
              {fieldErrors.oldPassword ? (
                <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">
                  {fieldErrors.oldPassword}
                </p>
              ) : null}
            </div>
            <div>
              <label
                htmlFor="settings-new-password"
                className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                New Password
              </label>
              <input
                id="settings-new-password"
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
                htmlFor="settings-confirm-password"
                className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Confirm New Password
              </label>
              <input
                id="settings-confirm-password"
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
              className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 ease-in-out hover:bg-teal-800"
            >
              {isSubmitting ? "Updating..." : "Reset Password"}
            </button>
            {formError ? (
              <p className="text-sm text-rose-600 dark:text-rose-400">{formError}</p>
            ) : null}
            {successMessage ? (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                {successMessage}
              </p>
            ) : null}
          </form>
        </div>
      </section>
    </div>
  );
}
