import type { JSX } from "react";

export type AuthMode = "login" | "register";

export type AuthFormPayload = {
  username: string;
  email: string;
  password: string;
};

export type AuthPageProps = {
  mode: AuthMode;
  onSubmit: (payload: AuthFormPayload) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  notice?: string | null;
};

declare function AuthPage(props: AuthPageProps): JSX.Element;

export default AuthPage;