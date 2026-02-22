import { getToken } from "./auth";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
const DEFAULT_TIMEOUT_MS = 60000; // 60 seconds for AI operations

type ApiErrorResponse = {
  message?: string;
  code?: string;
  details?: unknown;
};

export type ApiError = Error & { status?: number; code?: string; details?: unknown };

const createApiError = (
  message: string,
  status?: number,
  code?: string,
  details?: unknown,
): ApiError => {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.code = code;
  error.details = details;
  return error;
};

export const getErrorStatus = (err: unknown): number | undefined =>
  (err as ApiError | undefined)?.status;

export const getErrorMessage = (
  err: unknown,
  fallback = "Something went wrong. Please try again.",
) => {
  const status = getErrorStatus(err);
  if (status === 401) {
    return "Please log in to continue.";
  }
  if (status === 403) {
    return "Access denied.";
  }
  if (status === 404) {
    return "Not found.";
  }
  if (status === 500) {
    return "Server error. Please try again later.";
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
};

const request = async <T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
  tokenOverride?: string,
) => {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = tokenOverride ?? getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw createApiError("Request timed out. Please try again.");
    }
    throw createApiError("Network error. Please check your connection.");
  } finally {
    window.clearTimeout(timeoutId);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const apiError = data as ApiErrorResponse | null;
    const message =
      apiError?.message || `Request failed with status ${response.status}`;
    throw createApiError(message, response.status, apiError?.code, apiError?.details);
  }

  return data as T;
};

export type AuthUser = {
  id: string;
  email: string;
  username: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type ProjectStatus = "IN_PROGRESS" | "READY_FOR_SPEC" | "COMPLETED";

export type ProjectResponse = {
  projectId: string;
  requirement: string;
  status: ProjectStatus;
  createdAt: string;
};

export type Question = {
  id: string;
  text: string;
};

export type AnalyzeRequirementResponse = {
  projectId: string;
  round: number;
  questions: Question[];
};

export type ProjectDetailResponse = {
  projectId: string;
  status?: ProjectStatus;
  screen: string;
  currentRound?: number;
  totalRounds?: number;
  requirement?: string;
  questions?: Question[];
  answers?: Record<string, string>;
  finalSpec?: Specification;
};

export type Specification = {
  overview?: {
    title?: string;
    description?: string;
  };
  problem_statement?: {
    title?: string;
    description?: string;
    pain_points?: string[];
  };
  proposed_solution?: {
    title?: string;
    description?: string;
    key_benefits?: string[];
  };
  goals?: {
    title?: string;
    items?: Array<{ title?: string; description?: string }>;
  };
  user_roles?: {
    title?: string;
    roles?: Array<{ name?: string; description?: string }>;
  };
  functional_requirements?: {
    title?: string;
    requirements?: Array<{
      id?: string;
      title?: string;
      description?: string;
      priority?: string;
    }>;
  };
  non_functional_requirements?: {
    title?: string;
    requirements?: Array<{
      id?: string;
      category?: string;
      description?: string;
    }>;
  };
  assumptions?: {
    title?: string;
    items?: string[];
  };
  constraints?: {
    title?: string;
    items?: string[];
  };
  dependencies?: {
    title?: string;
    items?: string[];
  };
  risks?: {
    title?: string;
    items?: Array<{
      risk?: string;
      impact?: string;
      mitigation?: string;
    }>;
  };
};

export type ClarificationResponse = {
  projectId: string;
  round?: number;
  questions?: Question[];
  screen?: string;
  status?: ProjectStatus;
  currentRound?: number;
  totalRounds?: number;
  finalSpec?: Specification;
  options?: string[];
  message?: string;
};

export const signup = (payload: {
  username: string;
  email: string;
  password: string;
}) =>
  request<AuthResponse>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const login = (payload: { email: string; password: string }) =>
  request<AuthResponse>("/users/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getProjects = () => request<ProjectResponse[]>("/projects/user/me");

export const analyzeRequirement = (payload: { requirement: string }) =>
  request<AnalyzeRequirementResponse>("/projects/analyze-requirement", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getProjectById = (projectId: string) =>
  request<ProjectDetailResponse>(`/projects/project/${projectId}`);

export const submitClarifications = (
  projectId: string,
  payload: { answers?: Record<string, string>; action?: string },
) => {
  const timeoutMs = payload.action === "GENERATE" ? 120000 : DEFAULT_TIMEOUT_MS;
  return request<ClarificationResponse>(
    `/projects/clarifications/${projectId}`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    timeoutMs,
  );
};

export const deleteProject = (projectId: string) =>
  request<void>(`/projects/project/${projectId}`, {
    method: "DELETE",
  });

export const resetPassword = (payload: {
  oldPassword: string;
  newPassword: string;
}) =>
  request<{ message?: string }>("/users/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const forgotPassword = (payload: { email: string }) =>
  request<{ message?: string }>("/users/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const verifyResetCode = (payload: { email: string; code: string }) =>
  request<{ resetToken: string }>("/users/verify-reset-code", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const resetPasswordWithToken = (payload: {
  newPassword: string;
  confirmPassword: string;
  resetToken: string;
}) =>
  request<{ message?: string }>(
    "/users/reset-password",
    {
      method: "POST",
      body: JSON.stringify({
        newPassword: payload.newPassword,
        confirmPassword: payload.confirmPassword,
      }),
    },
    DEFAULT_TIMEOUT_MS,
    payload.resetToken
  );
