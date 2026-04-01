import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { motion } from "framer-motion";
import { clearAuth } from "../services/auth";
import {
  getErrorMessage,
  getErrorStatus,
  getProjectById,
  type Specification,
} from "../services/api";

export default function SpecPreviewPage() {
  const documentRef = useRef<HTMLDivElement | null>(null);
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [spec, setSpec] = useState<Specification | null>(
    (location.state as { finalSpec?: Specification } | null)?.finalSpec ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (spec || !id) {
      return;
    }

    const loadSpec = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getProjectById(id);
        if (data.screen === "SPEC_VIEW" && data.finalSpec) {
          setSpec(data.finalSpec);
          return;
        }
        setError("Specification is not available yet.");
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
        setError(getErrorMessage(err, "Failed to load specification."));
      } finally {
        setIsLoading(false);
      }
    };

    loadSpec();
  }, [id, navigate, spec]);

  const handleDownload = () => {
    if (!documentRef.current) {
      return;
    }

    const inlineComputedStyles = (
      sourceRoot: HTMLElement,
      cloneRoot: HTMLElement
    ) => {
      const sourceNodes = sourceRoot.querySelectorAll<HTMLElement>("*");
      const cloneNodes = cloneRoot.querySelectorAll<HTMLElement>("*");
      const length = Math.min(sourceNodes.length, cloneNodes.length);

      const properties = [
        "color",
        "backgroundColor",
        "border",
        "borderTop",
        "borderRight",
        "borderBottom",
        "borderLeft",
        "borderRadius",
        "boxShadow",
        "display",
        "flex",
        "flexDirection",
        "alignItems",
        "justifyContent",
        "gap",
        "padding",
        "paddingTop",
        "paddingRight",
        "paddingBottom",
        "paddingLeft",
        "margin",
        "marginTop",
        "marginRight",
        "marginBottom",
        "marginLeft",
        "font",
        "fontFamily",
        "fontSize",
        "fontWeight",
        "lineHeight",
        "letterSpacing",
        "textAlign",
        "textTransform",
        "listStyleType",
        "listStylePosition",
        "listStyleImage",
        "width",
        "maxWidth",
        "minWidth",
      ] as const;

      for (let i = 0; i < length; i += 1) {
        const source = sourceNodes[i];
        const clone = cloneNodes[i];
        const computed = window.getComputedStyle(source);

        properties.forEach((property) => {
          clone.style[property] = computed[property];
        });
      }
    };

    html2pdf()
      .set({
        margin: 12,
        filename: "specification.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          backgroundColor: "#ffffff",
          onclone: (clonedDocument: Document) => {
            const sourceRoot = documentRef.current;
            const cloneRoot = clonedDocument.querySelector(
              "[data-pdf-root]"
            ) as HTMLElement | null;

            if (sourceRoot && cloneRoot) {
              cloneRoot.style.backgroundColor = "#ffffff";
              clonedDocument
                .querySelectorAll("style, link[rel='stylesheet']")
                .forEach((node: Element) => node.remove());
              inlineComputedStyles(sourceRoot, cloneRoot);
              clonedDocument.querySelectorAll("[data-subheading]").forEach((node) => {
                if (!(node instanceof HTMLElement)) {
                  return;
                }
                node.style.fontSize = "12px";
                node.style.fontWeight = "700";
                node.style.textTransform = "uppercase";
                node.style.letterSpacing = "0.08em";
                node.style.color = "#111827";
              });
            }
          },
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(documentRef.current)
      .save();
  };

  const sectionTitleClass =
    "text-base font-semibold uppercase tracking-wide text-white";
  const sectionBodyClass =
    "mt-3 text-sm leading-relaxed text-white/75";
  const itemTitleClass =
    "text-sm font-semibold uppercase tracking-wide text-white";
  const listClass =
    "mt-3 list-disc pl-5 text-sm leading-relaxed text-white/75";
  const renderStringList = (
    items: Array<string | undefined> | undefined,
    keyPrefix: string,
  ) =>
    (items ?? [])
      .filter((item): item is string => typeof item === "string" && item.trim() !== "")
      .map((item, index) => <li key={`${keyPrefix}-${index}`}>{item}</li>);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-[calc(100vh-4rem)] bg-linear-to-br from-black via-gray-900 to-black px-4 py-8 sm:px-6"
    >
      <section className="mx-auto max-w-5xl space-y-6 rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-blue-900/25 backdrop-blur-xl transition-all duration-300 sm:p-8">
        <div className="rounded-xl border border-emerald-300/40 bg-emerald-500/20 px-4 py-3 text-sm font-semibold text-emerald-100 shadow-[0_0_18px_rgba(16,185,129,0.25)] transition-all duration-300">
          Specification Generated Successfully
        </div>

        {error ? (
          <p className="text-sm text-rose-200 transition-all duration-300">{error}</p>
        ) : null}
        {isLoading ? (
          <p className="text-sm text-white/70 transition-all duration-300">
            Loading specification...
          </p>
        ) : null}
        {error && !spec ? (
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 transition-all duration-300 hover:bg-white/15"
          >
            Back to Dashboard
          </button>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white transition-all duration-300">
              Specification Preview
            </h1>
            <p className="mt-1 text-sm text-white/70 transition-all duration-300">
              Review the AI-generated specification below.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!spec || isLoading}
              className="rounded-xl bg-linear-to-r from-blue-500 to-blue-700 px-5 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.45)] transition-all duration-300 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Download PDF
            </button>
          </div>
        </div>

        <div
          ref={documentRef}
          data-pdf-root
          className="space-y-8 rounded-xl border border-white/15 bg-white/10 p-8 shadow-xl shadow-blue-900/20 backdrop-blur-lg transition-all duration-300"
        >
          <section>
            <h1 className="text-2xl font-semibold text-white">
              Specification Document
            </h1>
            <p className="mt-1 text-sm text-white/70">
              Generated by SpecifyAI
            </p>
          </section>

          <section>
            <h2
              className={`${sectionTitleClass} mb-4 border-b border-white/20 pb-2`}
            >
              {spec?.overview?.title ?? "Overview"}
            </h2>
            <p className={sectionBodyClass}>
              {spec?.overview?.description ?? ""}
            </p>
          </section>

          <section>
            <h2
              className={`${sectionTitleClass} mb-4 border-b border-white/20 pb-2`}
            >
              {spec?.problem_statement?.title ?? "Problem Statement"}
            </h2>
            <p className={sectionBodyClass}>
              {spec?.problem_statement?.description ?? ""}
            </p>
            {(spec?.problem_statement?.pain_points ?? []).length > 0 ? (
              <ul className={listClass}>
                {renderStringList(spec?.problem_statement?.pain_points, "pain")}
              </ul>
            ) : null}
          </section>

          <section>
            <h2
              className={`${sectionTitleClass} mb-4 border-b border-white/20 pb-2`}
            >
              {spec?.proposed_solution?.title ?? "Proposed Solution"}
            </h2>
            <p className={sectionBodyClass}>
              {spec?.proposed_solution?.description ?? ""}
            </p>
            {(spec?.proposed_solution?.key_benefits ?? []).length > 0 ? (
              <ul className={listClass}>
                {renderStringList(spec?.proposed_solution?.key_benefits, "benefit")}
              </ul>
            ) : null}
          </section>

          <section>
            <h2
              className={`${sectionTitleClass} mb-4 border-b border-white/20 pb-2`}
            >
              {spec?.goals?.title ?? "Goals"}
            </h2>
            <div className="mt-3 space-y-4 text-sm leading-relaxed text-white/75">
              {(spec?.goals?.items ?? []).map((goal, index) => (
                <div key={`${goal?.title ?? "goal"}-${index}`}>
                  <p className={itemTitleClass} data-subheading>
                    {goal?.title ?? `Goal ${index + 1}`}
                  </p>
                  <p className="mt-1">{goal?.description ?? ""}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2
              className={`${sectionTitleClass} mb-4 border-b border-white/20 pb-2`}
            >
              {spec?.user_roles?.title ?? "User Roles"}
            </h2>
            <div className="mt-3 space-y-4 text-sm leading-relaxed text-white/75">
              {(spec?.user_roles?.roles ?? []).map((role, index) => (
                <div key={`${role?.name ?? "role"}-${index}`}>
                  <p className={itemTitleClass} data-subheading>
                    {role?.name ?? `Role ${index + 1}`}
                  </p>
                  <p className="mt-1">{role?.description ?? ""}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2
              className={`${sectionTitleClass} mb-4 border-b border-white/20 pb-2`}
            >
              {spec?.functional_requirements?.title ?? "Functional Requirements"}
            </h2>
            <div className="mt-3 space-y-4 text-sm leading-relaxed text-white/75">
              {(spec?.functional_requirements?.requirements ?? []).map((item, index) => (
                <div key={`${item?.id ?? "fr"}-${index}`}>
                  <p className={itemTitleClass} data-subheading>
                    {item?.id ? `${item.id} - ${item.title ?? ""}` : item?.title ?? ""}
                  </p>
                  <p className="mt-1">{item?.description ?? ""}</p>
                  {item?.priority ? <p className="mt-1">Priority: {item.priority}</p> : null}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2
              className={`${sectionTitleClass} mb-4 border-b border-white/20 pb-2`}
            >
              {spec?.non_functional_requirements?.title ?? "Non-Functional Requirements"}
            </h2>
            <div className="mt-3 space-y-4 text-sm leading-relaxed text-white/75">
              {(spec?.non_functional_requirements?.requirements ?? []).map(
                (item, index) => (
                  <div key={`${item?.id ?? "nfr"}-${index}`}>
                    <p className={itemTitleClass} data-subheading>
                      {item?.id
                        ? `${item.id} - ${item.category ?? ""}`
                        : item?.category ?? `NFR ${index + 1}`}
                    </p>
                    <p className="mt-1">{item?.description ?? ""}</p>
                  </div>
                )
              )}
            </div>
          </section>

          <section>
            <h2
              className={`${sectionTitleClass} mb-4 border-b border-white/20 pb-2`}
            >
              {spec?.assumptions?.title ?? "Assumptions"}
            </h2>
            <ul className={listClass}>
              {(spec?.assumptions?.items ?? []).map((item, index) => (
                <li key={`assumption-${index}`}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2
              className={`${sectionTitleClass} mb-4 border-b border-white/20 pb-2`}
            >
              {spec?.constraints?.title ?? "Constraints"}
            </h2>
            <ul className={listClass}>
              {(spec?.constraints?.items ?? []).map((item, index) => (
                <li key={`constraint-${index}`}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2
              className={`${sectionTitleClass} mb-4 border-b border-white/20 pb-2`}
            >
              {spec?.dependencies?.title ?? "Dependencies"}
            </h2>
            <ul className={listClass}>
              {renderStringList(spec?.dependencies?.items, "dep")}
            </ul>
          </section>
          {spec?.risks ? (
            <section>
              <h2
                className={`${sectionTitleClass} mb-4 border-b border-white/20 pb-2`}
              >
                {spec?.risks?.title ?? "Risks & Mitigation"}
              </h2>
              <div className="mt-3 space-y-4 text-sm leading-relaxed text-white/75">
                {(spec?.risks?.items ?? []).map((risk, index) => (
                  <div key={`${risk?.risk ?? "risk"}-${index}`}>
                    <p className={itemTitleClass} data-subheading>
                      {risk?.risk ?? `Risk ${index + 1}`}
                    </p>
                    {risk?.impact ? <p className="mt-1">Impact: {risk.impact}</p> : null}
                    {risk?.mitigation ? (
                      <p className="mt-1">Mitigation: {risk.mitigation}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </motion.div>
  );
}
