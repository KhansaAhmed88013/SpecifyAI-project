import { useState } from "react";
import { getErrorMessage } from "../services/api";
import AuthPage from "./AuthPage.jsx";

type SignupPageProps = {
  onSignup: (email: string, username: string, password: string) => Promise<void>;
};

export default function SignupPage({ onSignup }: SignupPageProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async ({
    username,
    email,
    password,
  }: {
    username: string;
    email: string;
    password: string;
  }) => {
    if (isSubmitting) {
      return;
    }
    setError(null);
    try {
      setIsSubmitting(true);
      await onSignup(email, username, password);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Signup failed."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPage
      mode="register"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={error}
    />
  );
}
