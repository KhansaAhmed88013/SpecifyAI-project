import { useState } from "react";
import { useLocation } from "react-router-dom";
import { getErrorMessage, getErrorStatus } from "../services/api";
import AuthPage from "./AuthPage.jsx";

type LoginPageProps = {
  onLogin: (email: string, password: string) => Promise<void>;
};

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();
  const notice =
    (location.state as { message?: string } | null)?.message ?? null;

  const handleSubmit = async ({ email, password }: { email: string; password: string }) => {
    if (isSubmitting) {
      return;
    }
    setError(null);
    try {
      setIsSubmitting(true);
      await onLogin(email, password);
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
    <AuthPage
      mode="login"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={error}
      notice={notice}
    />
  );
}
