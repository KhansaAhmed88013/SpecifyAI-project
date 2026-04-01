import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  getProjectById,
  getProjects,
  deleteProject,
  type ProjectResponse,
  getErrorMessage,
  getErrorStatus,
} from "../services/api";
import { clearAuth, getToken } from "../services/auth";

type ProjectStatus = "IN_PROGRESS" | "READY_FOR_SPEC" | "COMPLETED";

type Project = {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
};

type DashboardPageProps = {
  isLoggedIn: boolean;
  onLogin: () => void;
  notice?: string | null;
};

const pageMotion = {
  initial: { opacity: 0, y: 26 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
};

const cardsContainerMotion = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
};

const cardMotion = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export default function DashboardPage({
  isLoggedIn,
  onLogin,
  notice,
}: DashboardPageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const showToast = (message: string) => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 3000);
  };

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProjects();
      if (!Array.isArray(data)) {
        throw new Error("Unexpected response from server.");
      }
      const mapped = data.map((project: ProjectResponse, index: number) => ({
        id: project.projectId,
        title: `Project ${index + 1}`,
        description: project.requirement,
        status: project.status,
      }));
      setProjects(mapped);
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
      setError(getErrorMessage(err, "Failed to load projects."));
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setProjects([]);
      setError(null);
      return;
    }

    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const handleOpenProject = async (projectId: string) => {
    setError(null);
    setLoadingProjectId(projectId);
    try {
      const data = await getProjectById(projectId);

      if (data.screen === "SPEC_VIEW" && data.finalSpec) {
        navigate(`/projects/${projectId}/spec`, {
          state: { finalSpec: data.finalSpec },
        });
        return;
      }

      navigate(`/projects/${projectId}/clarifications`);
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
      if (status === 403) {
        clearAuth();
        navigate("/login", {
          state: { message: "Your session expired. Please log in again." },
        });
        return;
      }
      if (status === 404) {
        showToast("Project no longer exists.");
        await fetchProjects();
        return;
      }
      setError(getErrorMessage(err, "Failed to open project."));
    } finally {
      setLoadingProjectId(null);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const confirmed = window.confirm("Delete this project? This cannot be undone.");
    if (!confirmed) {
      return;
    }

    setDeletingProjectId(projectId);
    try {
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((project) => project.id !== projectId));
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
      setError(getErrorMessage(err, "Failed to delete project."));
    } finally {
      setDeletingProjectId(null);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch = project.title
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  const formatStatus = (status: ProjectStatus) => {
    if (status === "READY_FOR_SPEC") {
      return "READY TO GENERATE";
    }
    return status.replaceAll("_", " ");
  };

  return (
    <motion.div
      initial={pageMotion.initial}
      animate={pageMotion.animate}
      transition={pageMotion.transition}
      className="min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6"
    >
      <section className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-blue-900/30 backdrop-blur-xl transition-all duration-300 sm:p-8">
        <div>
          <h1 className="text-2xl font-semibold text-white transition-all duration-300">
            My Projects
          </h1>
          <p className="mt-1 mb-1 text-sm text-white/70 transition-all duration-300">
            Track and resume your requirement-to-specification projects.
          </p>
        </div>
        {!isLoggedIn ? (
          <div className="flex justify-center">
            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              className="w-full max-w-md rounded-xl border border-white/10 bg-white/10 p-8 text-center shadow-xl shadow-blue-900/20 backdrop-blur-lg transition-all duration-300"
            >
              <p className="text-sm text-white/70 transition-all duration-300">
                You don't have any projects yet. Start by creating a new specification.
              </p>
              <motion.button
                type="button"
                onClick={onLogin}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="mt-5 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 px-5 py-2 text-sm font-semibold text-white shadow-[0_0_22px_rgba(59,130,246,0.45)] transition-all duration-300"
              >
                Log In
              </motion.button>
            </motion.div>
          </div>
        ) : (
          <>
            {notice ? (
              <div className="rounded-xl border border-rose-300/40 bg-rose-500/15 px-4 py-2 text-sm text-rose-100 backdrop-blur-md transition-all duration-300">
                {notice}
              </div>
            ) : null}
            {toastMessage ? (
              <div className="rounded-xl border border-amber-300/40 bg-amber-500/15 px-4 py-2 text-sm text-amber-100 backdrop-blur-md transition-all duration-300">
                {toastMessage}
              </div>
            ) : null}
            {error ? (
              <p className="text-sm text-rose-200 transition-all duration-300">{error}</p>
            ) : null}
            {isLoading ? (
              <p className="text-sm text-white/70 transition-all duration-300">
                Loading projects...
              </p>
            ) : null}
            <div className="flex  mb-3 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <label className="sr-only" htmlFor="project-search">
                  Search projects
                </label>
                <input
                  id="project-search"
                  type="text"
                  placeholder="Search projects"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white outline-none transition-all duration-300 placeholder:text-white/50 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="w-full sm:w-56">
                <label className="sr-only" htmlFor="status-filter">
                  Filter by status
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white outline-none transition-all duration-300 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            {!isLoading && filteredProjects.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/10 p-8 text-center text-sm text-white/70 shadow-xl shadow-blue-900/20 backdrop-blur-lg transition-all duration-300">
                No projects yet. Create your first requirement to get started.
              </div>
            ) : (
              <motion.div
                variants={cardsContainerMotion}
                initial="hidden"
                animate="show"
                className="grid gap-4 sm:grid-cols-2"
              >
                {filteredProjects.map((project) => {
                  const isCompleted = project.status === "COMPLETED";
                  const actionLabel = isCompleted ? "View" : "Resume";
                  const statusBadgeClass = isCompleted
                    ? "border border-emerald-300/40 bg-emerald-500/20 text-emerald-100 shadow-[0_0_16px_rgba(16,185,129,0.35)]"
                    : "border border-amber-300/40 bg-amber-500/20 text-amber-100 shadow-[0_0_16px_rgba(245,158,11,0.35)]";

                  return (
                    <motion.div
                      key={project.id}
                      variants={cardMotion}
                      whileHover={{ y: -8, scale: 1.02 }}
                      className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/10 p-5 shadow-xl shadow-blue-900/20 backdrop-blur-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.35)]"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-lg font-semibold text-white transition-all duration-300">
                            {project.title}
                          </h3>
                          <motion.span
                            animate={{ opacity: [0.8, 1, 0.8] }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass}`}
                          >
                            {formatStatus(project.status)}
                          </motion.span>
                        </div>
                        <p className="mt-3 text-sm text-white/70 transition-all duration-300">
                          {project.description}
                        </p>
                      </div>
                      <div className="mt-6 flex flex-wrap gap-2">
                        <motion.button
                          type="button"
                          onClick={() => handleOpenProject(project.id)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={
                            loadingProjectId === project.id ||
                            deletingProjectId === project.id
                          }
                          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.45)] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {loadingProjectId === project.id ? "Opening..." : actionLabel}
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => handleDeleteProject(project.id)}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={
                            deletingProjectId === project.id ||
                            loadingProjectId === project.id
                          }
                          className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 transition-all duration-300 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {deletingProjectId === project.id ? "Deleting..." : "Delete"}
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </>
        )}
      </section>
    </motion.div>
  );
}
