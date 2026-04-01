import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-black via-gray-900 to-black px-4 py-8 sm:px-6"
    >
      <section className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-blue-900/25 backdrop-blur-xl transition-all duration-300 sm:p-8">
        <div>
          <h1 className="text-3xl font-semibold text-white transition-all duration-300">
            Settings
          </h1>
          <p className="mt-1 text-sm text-white/70 transition-all duration-300">
            Update your password and keep your account secure.
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/10 p-6 text-sm text-white/70 shadow-xl shadow-blue-900/20 backdrop-blur-lg transition-all duration-300 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="settings-old-password"
                className="mb-2 block text-sm font-medium text-white/80 transition-all duration-300"
              >
                Old Password
              </label>
              <input
                id="settings-old-password"
                type="password"
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white outline-none transition-all duration-300 placeholder:text-white/50 focus:ring-2 focus:ring-blue-500"
                required
              />
              {fieldErrors.oldPassword ? (
                <p className="mt-2 text-xs text-rose-200 transition-all duration-300">
                  {fieldErrors.oldPassword}
                </p>
              ) : null}
            </div>
            <div>
              <label
                htmlFor="settings-new-password"
                className="mb-2 block text-sm font-medium text-white/80 transition-all duration-300"
              >
                New Password
              </label>
              <input
                id="settings-new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white outline-none transition-all duration-300 placeholder:text-white/50 focus:ring-2 focus:ring-blue-500"
                required
              />
              {fieldErrors.newPassword ? (
                <p className="mt-2 text-xs text-rose-200 transition-all duration-300">
                  {fieldErrors.newPassword}
                </p>
              ) : null}
            </div>
            <div>
              <label
                htmlFor="settings-confirm-password"
                className="mb-2 block text-sm font-medium text-white/80 transition-all duration-300"
              >
                Confirm New Password
              </label>
              <input
                id="settings-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white outline-none transition-all duration-300 placeholder:text-white/50 focus:ring-2 focus:ring-blue-500"
                required
              />
              {fieldErrors.confirmPassword ? (
                <p className="mt-2 text-xs text-rose-200 transition-all duration-300">
                  {fieldErrors.confirmPassword}
                </p>
              ) : null}
            </div>
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(59,130,246,0.45)] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Updating..." : "Reset Password"}
            </motion.button>
            {formError ? (
              <p className="text-sm text-rose-200 transition-all duration-300">{formError}</p>
            ) : null}
            {successMessage ? (
              <p className="text-sm text-emerald-200 transition-all duration-300">
                {successMessage}
              </p>
            ) : null}
          </form>
        </div>
      </section>
    </motion.div>
  );
}
