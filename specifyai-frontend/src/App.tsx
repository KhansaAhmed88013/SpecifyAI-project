import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { useState, type ReactNode } from "react";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import NewProjectPage from "./pages/NewProjectPage";
import ClarificationQuestionsPage from "./pages/ClarificationQuestionsPage";
import SpecPreviewPage from "./pages/SpecPreviewPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import SettingsPage from "./pages/SettingsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import VerifyResetCodePage from "./pages/VerifyResetCodePage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import {
  analyzeRequirement,
  getErrorStatus,
  login,
  signup,
  type AuthUser,
} from "./services/api";
import { clearAuth, getStoredUser, getToken, setAuth } from "./services/auth";

function AppRoutes() {
  const [token, setToken] = useState<string | null>(() => getToken());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() =>
    getStoredUser(),
  );
  const [pendingRequirement, setPendingRequirement] = useState<string | null>(
    null
  );
  const [dashboardNotice, setDashboardNotice] = useState<string | null>(null);
  const navigate = useNavigate();
  const isLoggedIn = Boolean(token);

  const handleCreateProject = async (requirement: string) => {
    if (!isLoggedIn) {
      setPendingRequirement(requirement);
      navigate("/login", {
        state: {
          message: "Please log in to continue generating your specification.",
        },
      });
      return;
    }
    try {
      const response = await analyzeRequirement({ requirement });
      navigate(`/projects/${response.projectId}/clarifications`);
    } catch (err) {
      console.error(err);
      const status = getErrorStatus(err);
      if (status === 401) {
        clearAuth();
        setToken(null);
        setCurrentUser(null);
        navigate("/login", {
          state: { message: "Your session expired. Please log in again." },
        });
      }
      throw err;
    }
  };

  const resumePendingFlow = async () => {
    if (!pendingRequirement) {
      return false;
    }
    const requirement = pendingRequirement;
    setPendingRequirement(null);
    try {
      const response = await analyzeRequirement({ requirement });
      setDashboardNotice(null);
      navigate(`/projects/${response.projectId}/clarifications`);
      return true;
    } catch (err) {
      console.error(err);
      const status = getErrorStatus(err);
      if (status === 401) {
        clearAuth();
        setToken(null);
        setCurrentUser(null);
        navigate("/login", {
          state: { message: "Your session expired. Please log in again." },
        });
        return false;
      }
      setDashboardNotice(
        "We couldn't resume your previous requirement. Please create a new project."
      );
      return false;
    }
  };

  const handleLogin = async (email: string, password: string) => {
    const response = await login({ email, password });
    setAuth(response.token, response.user);
    setToken(response.token);
    setCurrentUser(response.user);

    if (!(await resumePendingFlow())) {
      navigate("/dashboard");
    }
  };

  const handleSignup = async (
    email: string,
    username: string,
    password: string,
  ) => {
    const response = await signup({ email, username, password });
    setAuth(response.token, response.user);
    setToken(response.token);
    setCurrentUser(response.user);

    if (!(await resumePendingFlow())) {
      navigate("/dashboard");
    }
  };

  const handleLoginNavigate = () => {
    navigate("/login");
  };

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (!confirmed) {
      return;
    }
    clearAuth();
    setToken(null);
    setCurrentUser(null);
    navigate("/login");
  };

  const RequireAuth = ({ children }: { children: ReactNode }) => {
    if (!isLoggedIn) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Routes>
      <Route
        element={
          <AppLayout
            userName={currentUser?.username ?? currentUser?.email ?? "Guest"}
            isLoggedIn={isLoggedIn}
            onLogout={handleLogout}
          />
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <DashboardPage
              isLoggedIn={isLoggedIn}
              onLogin={handleLoginNavigate}
              notice={dashboardNotice}
            />
          }
        />
        <Route
          path="/new-project"
          element={<NewProjectPage onCreate={handleCreateProject} />}
        />
        <Route
          path="/login"
          element={<LoginPage onLogin={handleLogin} />}
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-reset-code" element={<VerifyResetCodePage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/signup" element={<SignupPage onSignup={handleSignup} />} />
        <Route
          path="/projects/:id/clarifications"
          element={
            <RequireAuth>
              <ClarificationQuestionsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/projects/:id/spec"
          element={
            <RequireAuth>
              <SpecPreviewPage />
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <SettingsPage />
            </RequireAuth>
          }
        />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
