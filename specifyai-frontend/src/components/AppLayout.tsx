import { PropsWithChildren } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

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
  const content = children ?? <Outlet />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar userName={userName} isLoggedIn={isLoggedIn} onLogout={onLogout} />
      <main className="px-4 py-8 md:px-8">
        <div className="mx-auto w-full max-w-5xl">{content}</div>
      </main>
    </div>
  );
}
