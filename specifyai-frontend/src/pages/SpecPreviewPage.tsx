import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import html2pdf from "html2pdf.js";
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
    "text-base font-semibold uppercase tracking-wide text-slate-800 dark:text-slate-100";
  const sectionBodyClass =
    "mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400";
  const itemTitleClass =
    "text-sm font-semibold uppercase tracking-wide text-slate-800 dark:text-slate-100";
  const listClass =
    "mt-3 list-disc pl-5 text-sm leading-relaxed text-slate-500 dark:text-slate-400";
  const renderStringList = (
    items: Array<string | undefined> | undefined,
    keyPrefix: string,
  ) =>
    (items ?? [])
      .filter((item): item is string => typeof item === "string" && item.trim() !== "")
      .map((item, index) => <li key={`${keyPrefix}-${index}`}>{item}</li>);

  return (
    <div className="min-h-screen bg-white transition-colors dark:bg-slate-950">
      <section className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800 transition-all duration-200 ease-in-out dark:border-teal-500/40 dark:bg-teal-500/10 dark:text-teal-300">
          Specification Generated Successfully
        </div>

        {error ? (
          <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
        ) : null}
        {isLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Loading specification...
          </p>
        ) : null}
        {error && !spec ? (
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center justify-center rounded-xl border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-700 transition-all duration-200 ease-in-out hover:bg-teal-50 dark:border-teal-400 dark:text-teal-400 dark:hover:bg-slate-800"
          >
            Back to Dashboard
          </button>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
              Specification Preview
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Review the AI-generated specification below.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!spec || isLoading}
              className="rounded-xl bg-teal-700 px-5 py-2 text-sm font-semibold text-white transition-all duration-200 ease-in-out hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Download PDF
            </button>
          </div>
        </div>

        <div
          ref={documentRef}
          data-pdf-root
          className="space-y-8 rounded-xl border border-slate-200 bg-white p-8 shadow-md transition-all duration-200 ease-in-out dark:border-slate-800 dark:bg-slate-900"
        >
          <section>
            <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
              Specification Document
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Generated by SpecifyAI
            </p>
          </section>

          <section>
            <h2
              className={`${sectionTitleClass} border-b border-slate-200 pb-2 mb-4 dark:border-slate-800`}
            >
              {spec?.overview?.title ?? "Overview"}
            </h2>
            <p className={sectionBodyClass}>
              {spec?.overview?.description ?? ""}
            </p>
          </section>

          <section>
            <h2
              className={`${sectionTitleClass} border-b border-slate-200 pb-2 mb-4 dark:border-slate-800`}
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
              className={`${sectionTitleClass} border-b border-slate-200 pb-2 mb-4 dark:border-slate-800`}
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
              className={`${sectionTitleClass} border-b border-slate-200 pb-2 mb-4 dark:border-slate-800`}
            >
              {spec?.goals?.title ?? "Goals"}
            </h2>
            <div className="mt-3 space-y-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
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
              className={`${sectionTitleClass} border-b border-slate-200 pb-2 mb-4 dark:border-slate-800`}
            >
              {spec?.user_roles?.title ?? "User Roles"}
            </h2>
            <div className="mt-3 space-y-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
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
              className={`${sectionTitleClass} border-b border-slate-200 pb-2 mb-4 dark:border-slate-800`}
            >
              {spec?.functional_requirements?.title ?? "Functional Requirements"}
            </h2>
            <div className="mt-3 space-y-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
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
              className={`${sectionTitleClass} border-b border-slate-200 pb-2 mb-4 dark:border-slate-800`}
            >
              {spec?.non_functional_requirements?.title ?? "Non-Functional Requirements"}
            </h2>
            <div className="mt-3 space-y-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
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
              className={`${sectionTitleClass} border-b border-slate-200 pb-2 mb-4 dark:border-slate-800`}
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
              className={`${sectionTitleClass} border-b border-slate-200 pb-2 mb-4 dark:border-slate-800`}
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
              className={`${sectionTitleClass} border-b border-slate-200 pb-2 mb-4 dark:border-slate-800`}
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
                className={`${sectionTitleClass} border-b border-slate-200 pb-2 mb-4 dark:border-slate-800`}
              >
                {spec?.risks?.title ?? "Risks & Mitigation"}
              </h2>
              <div className="mt-3 space-y-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
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
    </div>
  );
}
