import type { PropsWithChildren } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import backgroundGif from "../assets/Animation-Tech.gif";

type AppLayoutProps = PropsWithChildren<{
  userName: string;
  isLoggedIn: boolean;
  onLogout: () => void;
}>;

export default function AppLayout({
  userName,
  isLoggedIn,
  onLogout,
  children,
}: AppLayoutProps) {
  const location = useLocation();
  const isAuthRoute = location.pathname === "/login" || location.pathname === "/signup";
  const isNewProjectRoute = location.pathname === "/new-project";
  const isSettingsRoute = location.pathname === "/settings";
  const isClarificationRoute = location.pathname.includes("/clarifications");
  const isSpecRoute = location.pathname.includes("/spec");
  const isRecoveryRoute =
    location.pathname === "/forgot-password" ||
    location.pathname === "/verify-reset-code" ||
    location.pathname === "/reset-password";
  const isFullBleedRoute =
    isAuthRoute ||
    isNewProjectRoute ||
    isSettingsRoute ||
    isClarificationRoute ||
    isSpecRoute ||
    isRecoveryRoute;
  const content = children ?? <Outlet />;

  return (
    <div className="relative min-h-screen w-full text-slate-100">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundGif})` }}
      />
      <div className="absolute inset-0 z-10 bg-black/60" />

      <div className="relative z-20">
        <Navbar userName={userName} isLoggedIn={isLoggedIn} onLogout={onLogout} />
        <main className={isFullBleedRoute ? "p-0 pt-16" : "px-4 pb-8 pt-24 md:px-8"}>
          {isFullBleedRoute ? (
            content
          ) : (
            <div className="mx-auto w-full max-w-5xl">{content}</div>
          )}
        </main>
      </div>
    </div>
  );
}
