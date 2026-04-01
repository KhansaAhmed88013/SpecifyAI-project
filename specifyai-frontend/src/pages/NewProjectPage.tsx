import type { FormEvent } from "react";
import { useState } from "react";
import { motion } from "framer-motion";
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
  const [isFocused, setIsFocused] = useState(false);

  const characterCount = requirement.length;

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
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-black via-gray-900 to-black px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-5xl items-center justify-center">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 sm:p-8"
        >
          <div className="pointer-events-none absolute -left-16 -top-16 h-52 w-52 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-14 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl" />

          <div className="relative space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white transition-all duration-300 sm:text-4xl">
                New Specification
              </h1>
              <p className="text-sm text-white/60 transition-all duration-300 sm:text-base">
                Describe your project idea at a high level and SpecifyAI will refine it
                with intelligent follow-up questions.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <label
                  htmlFor="requirement"
                  className="block text-sm font-medium text-white/80 transition-all duration-300"
                >
                  Project Idea Input
                </label>

                <motion.div
                  animate={{ scale: isFocused ? 1.01 : 1 }}
                  transition={{ duration: 0.2 }}
                  className="transition-all duration-300"
                >
                  <textarea
                    id="requirement"
                    rows={8}
                    placeholder={placeholderText}
                    value={requirement}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onChange={(event) => setRequirement(event.target.value)}
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all duration-300 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
                  />
                </motion.div>

                <div className="flex justify-end">
                  <p className="text-xs text-white/50 transition-all duration-300">
                    {characterCount} characters
                  </p>
                </div>
              </div>

              <div className="flex justify-center sm:justify-start">
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 px-8 py-3 text-base font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.45)] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Analyzing..." : "Analyze Requirement"}
                </motion.button>
              </div>

              {error ? (
                <p className="text-sm text-rose-200 transition-all duration-300">{error}</p>
              ) : null}
            </form>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
