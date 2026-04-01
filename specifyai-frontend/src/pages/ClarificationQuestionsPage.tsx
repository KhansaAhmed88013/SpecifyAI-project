import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  getProjectById,
  submitClarifications,
  type ClarificationResponse,
  type ProjectDetailResponse,
  type Question,
  getErrorMessage,
  getErrorStatus,
} from "../services/api";
import { clearAuth } from "../services/auth";

export default function ClarificationQuestionsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [requirement, setRequirement] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [screen, setScreen] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState<number | null>(null);
  const [totalRounds, setTotalRounds] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const progressPercent =
    currentRound && totalRounds
      ? Math.round((currentRound / totalRounds) * 100)
      : 0;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    // Reset validation state when questions change
    setSubmitAttempted(false);
    setValidationErrors({});
    setError(null);
  }, [questions]);

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadProject = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = (await getProjectById(id)) as ProjectDetailResponse;
        if (!data.screen) {
          throw new Error("Unexpected response from server.");
        }
        setRequirement(data.requirement ?? "");
        setQuestions(data.questions ?? []);
        setAnswers(data.answers ?? {});
        setScreen(data.screen ?? null);
        setStatus(data.status ?? null);
        setCurrentRound(data.currentRound ?? null);
        setTotalRounds(data.totalRounds ?? null);
        if (data.screen === "SPEC_VIEW" && data.finalSpec) {
          navigate(`/projects/${id}/spec`, {
            state: { finalSpec: data.finalSpec },
          });
        }
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
        setError(getErrorMessage(err, "Failed to load project."));
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [id, navigate]);

  const handleChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleGenerate = async () => {
    if (!id) {
      setError("Project not found.");
      return;
    }
    setError(null);
    setSubmitAttempted(true);
    if (questions.length > 0) {
      const nextValidationErrors: Record<string, string> = {};
      questions.forEach((question) => {
        const value = answers[question.id] ?? "";
        if (!value.trim()) {
          nextValidationErrors[question.id] = "This answer is required.";
        }
      });
      if (Object.keys(nextValidationErrors).length > 0) {
        setValidationErrors(nextValidationErrors);
        setError("Please answer all questions before continuing.");
        return;
      }
    }
    setValidationErrors({});
    try {
      setIsSubmitting(true);
      const response = (await submitClarifications(id, {
        answers,
      })) as ClarificationResponse;

      // Clear answers FIRST when new questions arrive
      if (response.screen === "QUESTIONS" && response.questions) {
        setAnswers({});
        scrollToTop();
      }

      setQuestions(response.questions ?? []);
      setScreen(response.screen ?? null);
      setStatus(response.status ?? null);
      setCurrentRound(response.currentRound ?? null);
      setTotalRounds(response.totalRounds ?? null);

      if (response.screen === "SPEC_VIEW" && response.finalSpec) {
        navigate(`/projects/${id}/spec`, {
          state: { finalSpec: response.finalSpec },
        });
        return;
      }
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
      setError(getErrorMessage(err, "Failed to submit answers."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecision = async (action: "GENERATE" | "EXTRA_ROUND") => {
    if (!id) {
      setError("Project not found.");
      return;
    }
    setError(null);
    try {
      setIsSubmitting(true);
      const response = (await submitClarifications(id, {
        action,
      })) as ClarificationResponse;

      // Clear answers FIRST when new questions arrive
      if (response.screen === "QUESTIONS" && response.questions) {
        setAnswers({});
        scrollToTop();
      }

      setQuestions(response.questions ?? []);
      setScreen(response.screen ?? null);
      setStatus(response.status ?? null);
      setCurrentRound(response.currentRound ?? null);
      setTotalRounds(response.totalRounds ?? null);

      if (response.screen === "SPEC_VIEW" && response.finalSpec) {
        navigate(`/projects/${id}/spec`, {
          state: { finalSpec: response.finalSpec },
        });
        return;
      }

      if (response.screen === "QUESTIONS") {
        setSubmitAttempted(false);
      }
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
      setError(getErrorMessage(err, "Failed to submit decision."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-black via-gray-900 to-black px-4 py-8 sm:px-6"
    >
      <section className="mx-auto max-w-5xl space-y-6 rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-blue-900/25 backdrop-blur-xl transition-all duration-300 sm:p-8">
        <div>
          <h1 className="text-3xl font-semibold text-white transition-all duration-300">
            Clarification Required
          </h1>
          <p className="mt-1 text-sm text-white/70 transition-all duration-300">
            Answer these questions so we can produce a precise specification.
          </p>
        </div>

        {requirement ? (
          <div className="rounded-xl border border-white/10 bg-white/10 p-6 text-sm text-white/75 shadow-xl shadow-blue-900/20 backdrop-blur-lg transition-all duration-300">
            <span className="font-semibold text-white transition-all duration-300">
              Requirement:
            </span>{" "}
            {requirement}
          </div>
        ) : null}

        {error ? (
          <p className="text-sm text-rose-200 transition-all duration-300">{error}</p>
        ) : null}
        {isLoading ? (
          <p className="text-sm text-white/70 transition-all duration-300">
            Loading questions...
          </p>
        ) : null}

        {screen === "DECISION" ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/10 p-6 text-sm text-white/75 shadow-xl shadow-blue-900/20 backdrop-blur-lg transition-all duration-300">
              <p className="text-sm text-white/70 transition-all duration-300">
                You already have enough information to generate a complete
                specification.
              </p>
              <p className="mt-2 text-sm text-white/70 transition-all duration-300">
                If you choose "Generate Specification Document", SpecifyAI will
                generate a professional software specification based on your
                current answers.
              </p>
              <p className="mt-2 text-sm text-white/70 transition-all duration-300">
                If you choose "Ask One More Round", SpecifyAI will ask a final
                set of focused questions to make your document more precise,
                detailed, and closer to real-world industry standards.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => handleDecision("GENERATE")}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.45)] transition-all duration-300 hover:scale-105"
              >
                {isSubmitting ? "Processing..." : "Generate Specification Document"}
              </button>
              <button
                type="button"
                onClick={() => handleDecision("EXTRA_ROUND")}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/85 transition-all duration-300 hover:bg-white/15"
              >
                Ask One More Round (Recommended for better accuracy)
              </button>
            </div>
          </div>
        ) : (
          <>
            {screen === "REQUIREMENT_ONLY" ? (
              <div className="rounded-xl border border-white/10 bg-white/10 p-6 text-sm text-white/70 shadow-xl shadow-blue-900/20 backdrop-blur-lg transition-all duration-300">
                Questions have not been generated yet.
                <button
                  type="button"
                  onClick={() => {
                    if (!id) {
                      return;
                    }
                    setIsLoading(true);
                    setError(null);
                    getProjectById(id)
                      .then((data) => {
                        if (!data.screen) {
                          throw new Error("Unexpected response from server.");
                        }
                        setRequirement(data.requirement ?? "");
                        setQuestions(data.questions ?? []);
                        setAnswers(data.answers ?? {});
                        setScreen(data.screen ?? null);
                        setStatus(data.status ?? null);
                        setCurrentRound(data.currentRound ?? null);
                        setTotalRounds(data.totalRounds ?? null);
                      })
                      .catch((err) => {
                        console.error(err);
                        const status = getErrorStatus(err);
                        if (status === 401) {
                          clearAuth();
                          navigate("/login", {
                            state: {
                              message: "Your session expired. Please log in again.",
                            },
                          });
                          return;
                        }
                        setError(getErrorMessage(err, "Failed to refresh."));
                      })
                      .finally(() => setIsLoading(false));
                  }}
                  className="ml-2 inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-3 py-1 text-sm font-semibold text-white/85 transition-all duration-300 hover:bg-white/15"
                >
                  Retry
                </button>
              </div>
            ) : null}
            {!isLoading && screen !== "REQUIREMENT_ONLY" && questions.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/10 p-6 text-sm text-white/70 shadow-xl shadow-blue-900/20 backdrop-blur-lg transition-all duration-300">
                No questions available right now. Please try again in a moment.
              </div>
            ) : null}
            {currentRound && totalRounds && questions.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/70 transition-all duration-300">
                  Clarification Round {currentRound} of {totalRounds}
                </p>
                <div className="h-2 w-full rounded-full bg-white/15">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            ) : null}
            <div className="grid gap-4">
              {questions.map((question) => (
                <motion.div
                  key={question.id}
                  whileHover={{ y: -6, scale: 1.01 }}
                  className="rounded-xl border border-white/10 bg-white/10 p-6 shadow-xl shadow-blue-900/20 backdrop-blur-lg transition-all duration-300 hover:shadow-[0_0_22px_rgba(59,130,246,0.35)]"
                >
                  <p className="text-sm font-semibold text-white transition-all duration-300">
                    {question.text}
                  </p>
                  <textarea
                    rows={3}
                    value={answers[question.id] ?? ""}
                    onChange={(event) => handleChange(question.id, event.target.value)}
                    readOnly={status === "READY_FOR_SPEC" || screen === "QUESTIONS_REVIEW"}
                    disabled={status === "READY_FOR_SPEC" || screen === "QUESTIONS_REVIEW"}
                    className="mt-3 w-full resize-none rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all duration-300 placeholder:text-white/40 focus:ring-2 focus:ring-blue-500"
                  />
                  {submitAttempted && validationErrors[question.id] ? (
                    <p className="mt-2 text-xs text-rose-200 transition-all duration-300">
                      {validationErrors[question.id]}
                    </p>
                  ) : null}
                </motion.div>
              ))}
            </div>

            {status === "READY_FOR_SPEC" || screen === "QUESTIONS_REVIEW" ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/10 p-6 text-sm text-white/70 shadow-xl shadow-blue-900/20 backdrop-blur-lg transition-all duration-300">
                  Your answers are locked. You can now generate the specification
                  or optionally refine it further.
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => handleDecision("GENERATE")}
                    disabled={isSubmitting || isLoading}
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.45)] transition-all duration-300 hover:scale-105"
                  >
                    {isSubmitting ? "Processing..." : "Generate Specification Document"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision("EXTRA_ROUND")}
                    disabled={isSubmitting || isLoading}
                    className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/85 transition-all duration-300 hover:bg-white/15"
                  >
                    Ask One More Round (Recommended for better accuracy)
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isSubmitting || isLoading}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.45)] transition-all duration-300 hover:scale-105"
                >
                  {isSubmitting ? "Submitting..." : "Generate Specification"}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </motion.div>
  );
}
