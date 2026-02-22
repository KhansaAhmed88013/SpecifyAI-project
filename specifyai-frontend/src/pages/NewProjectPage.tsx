import type { FormEvent } from "react";
import { useState } from "react";
import { getErrorMessage } from "../services/api";

const placeholderText =
  "Example: Build a web app that helps students track assignments and get reminders.";

type NewProjectPageProps = {
  onCreate: (requirement: string) => Promise<void>;
};

export default function NewProjectPage({ onCreate }: NewProjectPageProps) {
  const [requirement, setRequirement] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }
    setError(null);
    if (!requirement.trim()) {
      setError("Please enter a requirement.");
      return;
    }
    try {
      setIsSubmitting(true);
      await onCreate(requirement.trim());
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Request failed."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white transition-colors dark:bg-slate-950">
      <section className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
            Start a New Specification
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Describe your idea at a high level. SpecifyAI will ask follow-up
            questions to refine the requirement.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-md transition-all duration-200 ease-in-out dark:border-slate-800 dark:bg-slate-900">
            <label
              htmlFor="requirement"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Requirement
            </label>
            <textarea
              id="requirement"
              rows={8}
              placeholder={placeholderText}
              value={requirement}
              onChange={(event) => setRequirement(event.target.value)}
              className="w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all duration-200 ease-in-out placeholder:text-slate-400 focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-teal-400"
            />
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-8 py-3 text-base font-semibold text-white transition-all duration-200 ease-in-out hover:bg-teal-800"
            >
              {isSubmitting ? "Analyzing..." : "Analyze Requirement"}
            </button>
          </div>
          {error ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
          ) : null}
        </form>
      </section>
    </div>
  );
}
