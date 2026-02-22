import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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

  const fetchProjects = async () => {
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
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setProjects([]);
      setError(null);
      return;
    }

    fetchProjects();
  }, [navigate]);

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
    return status.replace("_", " ");
  };

  return (
    <div className="min-h-screen bg-white transition-colors dark:bg-slate-950">
      <section className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
            My Projects
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track and resume your requirement-to-specification projects.
          </p>
        </div>
        {!isLoggedIn ? (
          <div className="flex justify-center">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-md transition-all duration-200 ease-in-out dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                You don't have any projects yet. Start by creating a new specification.
              </p>
              <button
                type="button"
                onClick={onLogin}
                className="mt-5 inline-flex items-center justify-center rounded-xl bg-teal-700 px-5 py-2 text-sm font-semibold text-white transition-all duration-200 ease-in-out hover:bg-teal-800"
              >
                Log In
              </button>
            </div>
          </div>
        ) : (
          <>
            {notice ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 transition-all duration-200 ease-in-out dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
                {notice}
              </div>
            ) : null}
            {toastMessage ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 transition-all duration-200 ease-in-out dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                {toastMessage}
              </div>
            ) : null}
            {error ? (
              <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
            ) : null}
            {isLoading ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Loading projects...
              </p>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 outline-none transition-all duration-200 ease-in-out focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-teal-400"
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
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 outline-none transition-all duration-200 ease-in-out focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-teal-400"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            {!isLoading && filteredProjects.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-md transition-all duration-200 ease-in-out dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                No projects yet. Create your first requirement to get started.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredProjects.map((project) => {
                  const isCompleted = project.status === "COMPLETED";
                  const actionLabel = isCompleted ? "View" : "Resume";
                  const statusBadgeClass = isCompleted
                    ? "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";

                  return (
                    <div
                      key={project.id}
                      className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-md transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                            {project.title}
                          </h3>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass}`}
                          >
                            {formatStatus(project.status)}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                          {project.description}
                        </p>
                      </div>
                      <div className="mt-6 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenProject(project.id)}
                          disabled={
                            loadingProjectId === project.id ||
                            deletingProjectId === project.id
                          }
                          className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 ease-in-out hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {loadingProjectId === project.id ? "Opening..." : actionLabel}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(project.id)}
                          disabled={
                            deletingProjectId === project.id ||
                            loadingProjectId === project.id
                          }
                          className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition-all duration-200 ease-in-out hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          {deletingProjectId === project.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
