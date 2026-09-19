"use client";

import { useState } from "react";
import {
  Check,
  CheckCircle2,
  Code2,
  FileCode2,
  FileJson,
  RotateCcw,
  Save,
  Send,
  Server,
  Sparkles,
  Star,
} from "lucide-react";
import { cn } from "@/lib/cn";

type CodeTab = "schema" | "server" | "client" | "snapshot";

const schemaCode = `// lib/forms/feedback.ts
import { defineForm } from "@dimah-form/server";

export const feedbackForm = defineForm({
  title: "Developer Feedback",
  slug: "feedback",
  fields: [
    {
      id: "framework",
      type: "select",
      label: "Primary Framework",
      required: true,
      options: [
        { value: "nextjs", label: "Next.js" },
        { value: "hono", label: "Hono" },
        { value: "sveltekit", label: "SvelteKit" },
        { value: "express", label: "Express" },
      ],
    },
    {
      id: "rating",
      type: "number",
      label: "Satisfaction (1-5)",
      required: true,
      min: 1,
      max: 5,
    },
    {
      id: "feedback",
      type: "text",
      label: "What can we improve?",
      showWhen: { field: "rating", lte: 3 },
    },
  ],
});`;

const serverCode = `// app/api/form/[...all]/route.ts
import { dimahForm, memoryAdapter } from "@dimah-form/server";
import { toNextJsHandler } from "@dimah-form/server/next";
import { feedbackForm } from "@/lib/forms/feedback";

export const form = dimahForm({
  database: memoryAdapter(),
  forms: { feedback: feedbackForm },
});

export type Form = typeof form;
export const { GET, POST, PUT, PATCH, DELETE } = toNextJsHandler(form);`;

const clientCode = `// components/survey.tsx
"use client";

import { createFormClient } from "@dimah-form/react";
import type { Form } from "@/lib/form";

const { useFormResponse } = createFormClient<Form>();

export function Survey({ snapshot }) {
  const q = useFormResponse<Form["$Infer"]["answers"]["feedback"]>({
    snapshot,
    onSubmitted: (res) => console.log("Submitted:", res.id),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); q.submit(); }}>
      {q.visibleFields.map((field) => (
        <Field key={field.id} field={field} binding={q.field(field.id)} />
      ))}
      <button type="submit" disabled={q.pending !== null}>
        Submit
      </button>
    </form>
  );
}`;

const snapshotCode = `{
  "id": "snap_01jh9x8q7k...",
  "formId": "feedback",
  "version": 1,
  "title": "Developer Feedback",
  "fields": [
    { "id": "framework", "type": "select", "required": true },
    { "id": "rating", "type": "number", "required": true, "min": 1, "max": 5 },
    { "id": "feedback", "type": "text", "showWhen": { "field": "rating", "lte": 3 } }
  ],
  "frozenAt": "2026-09-19T16:40:00.000Z",
  "note": "Responses strictly validate against this frozen snapshot."
}`;

export function InteractiveDemo() {
  const [activeCodeTab, setActiveCodeTab] = useState<CodeTab>("schema");

  // Interactive Form State
  const [framework, setFramework] = useState<string>("nextjs");
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  // Session State
  const [draftRev, setDraftRev] = useState<number>(1);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [isSavedRecently, setIsSavedRecently] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedResponse, setSubmittedResponse] = useState<{
    id: string;
    snapshotId: string;
    answers: Record<string, unknown>;
  } | null>(null);

  // Dynamic condition: show feedback when rating <= 3
  const showFeedback = rating <= 3;

  const handleSaveDraft = () => {
    setIsSavingDraft(true);
    setTimeout(() => {
      setDraftRev((prev) => prev + 1);
      setIsSavingDraft(false);
      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 2000);
    }, 350);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setSubmittedResponse({
        id: `resp_${Math.random().toString(36).slice(2, 8)}`,
        snapshotId: "snap_8f2a1b9c",
        answers: {
          framework,
          rating,
          ...(showFeedback && feedback ? { feedback } : {}),
          ...(email ? { email } : {}),
        },
      });
      setIsSubmitting(false);
    }, 450);
  };

  const handleReset = () => {
    setFramework("nextjs");
    setRating(5);
    setHoverRating(null);
    setFeedback("");
    setEmail("");
    setDraftRev(1);
    setSubmittedResponse(null);
  };

  const getCodeSnippet = () => {
    switch (activeCodeTab) {
      case "schema":
        return schemaCode;
      case "server":
        return serverCode;
      case "client":
        return clientCode;
      case "snapshot":
        return snapshotCode;
    }
  };

  const currentDisplayRating = hoverRating ?? rating;

  return (
    <div className="relative mx-auto w-full max-w-6xl rounded-2xl border border-fd-border/80 bg-fd-card/50 p-2 shadow-2xl backdrop-blur-xl sm:p-3 lg:p-4">
      {/* Top Window Bar */}
      <div className="flex items-center justify-between border-b border-fd-border/60 px-3 pt-1 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="size-2.5 rounded-full bg-rose-500/70" />
            <div className="size-2.5 rounded-full bg-amber-500/70" />
            <div className="size-2.5 rounded-full bg-emerald-500/70" />
          </div>
          <span className="ms-2 font-mono text-[11px] font-medium text-fd-muted-foreground">
            dimah-form studio preview
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            Snapshot Active
          </span>
          <span className="hidden items-center gap-1 rounded-full border border-fd-border bg-fd-background/60 px-2 py-0.5 font-mono text-[11px] text-fd-muted-foreground sm:inline-flex">
            <Sparkles className="size-3 text-fd-primary" />
            Typed $Infer
          </span>
        </div>
      </div>

      {/* Main Grid: Code on Left, Interactive Form on Right */}
      <div className="mt-3 grid gap-3.5 lg:grid-cols-[1.1fr_0.9fr]">
        {/* LEFT COLUMN: Code Tabs */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-fd-border/70 bg-fd-background/90">
          {/* Tab buttons */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-fd-border/60 bg-fd-muted/30 p-1.5">
            <button
              type="button"
              onClick={() => setActiveCodeTab("schema")}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-xs font-medium transition-all",
                activeCodeTab === "schema"
                  ? "border border-fd-border/70 bg-fd-background text-fd-foreground shadow-xs"
                  : "text-fd-muted-foreground hover:text-fd-foreground",
              )}
            >
              <FileCode2 className="size-3.5 text-amber-500" />
              1. defineForm()
            </button>
            <button
              type="button"
              onClick={() => setActiveCodeTab("server")}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-xs font-medium transition-all",
                activeCodeTab === "server"
                  ? "border border-fd-border/70 bg-fd-background text-fd-foreground shadow-xs"
                  : "text-fd-muted-foreground hover:text-fd-foreground",
              )}
            >
              <Server className="size-3.5 text-blue-500" />
              2. Server Route
            </button>
            <button
              type="button"
              onClick={() => setActiveCodeTab("client")}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-xs font-medium transition-all",
                activeCodeTab === "client"
                  ? "border border-fd-border/70 bg-fd-background text-fd-foreground shadow-xs"
                  : "text-fd-muted-foreground hover:text-fd-foreground",
              )}
            >
              <Code2 className="size-3.5 text-emerald-500" />
              3. useFormResponse
            </button>
            <button
              type="button"
              onClick={() => setActiveCodeTab("snapshot")}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-xs font-medium transition-all",
                activeCodeTab === "snapshot"
                  ? "border border-fd-border/70 bg-fd-background text-fd-foreground shadow-xs"
                  : "text-fd-muted-foreground hover:text-fd-foreground",
              )}
            >
              <FileJson className="size-3.5 text-purple-500" />
              4. Snapshot Protocol
            </button>
          </div>

          {/* Code Body */}
          <div className="relative max-h-[340px] flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed sm:text-[13px] lg:max-h-[400px]">
            <pre className="text-fd-foreground/90 selection:bg-fd-primary/20">
              <code>{getCodeSnippet()}</code>
            </pre>
          </div>

          {/* Tab Note Footer */}
          <div className="border-t border-fd-border/60 bg-fd-muted/20 px-3.5 py-2 text-[11px] text-fd-muted-foreground">
            {activeCodeTab === "schema" && (
              <span>
                💡 Modular TypeScript definitions with conditional{" "}
                <code className="font-semibold text-fd-foreground">
                  showWhen
                </code>{" "}
                rules.
              </span>
            )}
            {activeCodeTab === "server" && (
              <span>
                💡 1-line handlers for Next.js, Hono, Express, Fastify, Elysia,
                and SvelteKit.
              </span>
            )}
            {activeCodeTab === "client" && (
              <span>
                💡 Headless hook managing active fields, drafts, and validation
                without UI opinions.
              </span>
            )}
            {activeCodeTab === "snapshot" && (
              <span>
                💡 Immutable definition snapshot guarantees zero broken forms on
                live updates.
              </span>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Live Form Component */}
        <div className="flex flex-col justify-between rounded-xl border border-fd-border/70 bg-fd-background/95 p-4 shadow-sm sm:p-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-fd-border/60 pb-3">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-fd-primary" />
              <span className="text-xs font-semibold tracking-wide text-fd-foreground">
                Live Questionnaire
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-md border border-fd-border bg-fd-muted/50 px-2 py-0.5 font-mono text-[10px] text-fd-muted-foreground">
                Draft rev #{draftRev}
              </span>
              {submittedResponse && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1 text-[11px] text-fd-muted-foreground transition-colors hover:text-fd-foreground"
                >
                  <RotateCcw className="size-3" />
                  Reset
                </button>
              )}
            </div>
          </div>

          {submittedResponse ? (
            /* Submission Success Inspector */
            <div className="animate-in fade-in zoom-in-95 my-auto flex flex-col items-center justify-center py-5 text-center duration-200">
              <div className="flex size-11 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-5" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-fd-foreground sm:text-base">
                Submission Validated
              </h3>
              <p className="mt-1 text-xs text-fd-muted-foreground">
                Validated server-side against frozen snapshot{" "}
                <code className="font-mono font-semibold text-fd-foreground">
                  {submittedResponse.snapshotId}
                </code>
              </p>

              {/* Verified Payload JSON */}
              <div className="mt-3.5 w-full rounded-lg border border-fd-border/70 bg-fd-muted/40 p-3 text-left font-mono text-xs">
                <div className="mb-1.5 flex items-center justify-between border-b border-fd-border/40 pb-1 text-[11px] text-fd-muted-foreground">
                  <span>ID: {submittedResponse.id}</span>
                  <span className="font-semibold text-emerald-500">
                    200 Valid
                  </span>
                </div>
                <pre className="overflow-x-auto text-[11px] leading-tight text-fd-foreground">
                  {JSON.stringify(submittedResponse.answers, null, 2)}
                </pre>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg border border-fd-border bg-fd-card px-3 py-1.5 text-xs font-medium text-fd-foreground transition-colors hover:bg-fd-muted"
              >
                <RotateCcw className="size-3" />
                Try Another Response
              </button>
            </div>
          ) : (
            /* Active Form Rendering */
            <form
              onSubmit={handleSubmit}
              className="mt-3 flex flex-1 flex-col justify-between gap-3.5"
            >
              <div className="space-y-3.5">
                {/* Field 1: Framework Select */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium text-fd-foreground">
                    <span>
                      1. Primary Framework{" "}
                      <span className="text-rose-500">*</span>
                    </span>
                    <span className="font-mono text-[10px] text-fd-muted-foreground">
                      select
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                    {[
                      { id: "nextjs", label: "Next.js" },
                      { id: "hono", label: "Hono" },
                      { id: "sveltekit", label: "SvelteKit" },
                      { id: "express", label: "Express" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFramework(item.id)}
                        className={cn(
                          "rounded-lg border px-2 py-1.5 text-center text-xs font-medium transition-all",
                          framework === item.id
                            ? "border-fd-primary/70 bg-fd-primary/10 font-semibold text-fd-foreground shadow-xs ring-1 ring-fd-primary/25"
                            : "border-fd-border/70 bg-fd-card/50 text-fd-muted-foreground hover:bg-fd-muted hover:text-fd-foreground",
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Field 2: Satisfaction Star Rating */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium text-fd-foreground">
                    <span>
                      2. Satisfaction Rating{" "}
                      <span className="text-rose-500">*</span>
                    </span>
                    <span className="font-mono text-[10px] text-fd-muted-foreground">
                      number (1-5)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => setRating(star)}
                        className={cn(
                          "flex size-8 items-center justify-center rounded-lg border transition-all",
                          star <= currentDisplayRating
                            ? "border-amber-500/60 bg-amber-500/10 text-amber-500 shadow-xs"
                            : "border-fd-border/70 bg-fd-card/50 text-fd-muted-foreground hover:text-fd-foreground",
                        )}
                      >
                        <Star
                          className={cn(
                            "size-3.5 transition-transform",
                            star <= currentDisplayRating && "fill-amber-500",
                          )}
                        />
                      </button>
                    ))}
                    <span className="ms-2 text-[11px] font-medium text-fd-muted-foreground">
                      {rating === 5 && "5/5 • Excellent 🎉"}
                      {rating === 4 && "4/5 • Great 👍"}
                      {rating === 3 && "3/5 • Neutral (showWhen active)"}
                      {rating <= 2 &&
                        `${rating}/5 • Needs work (showWhen active)`}
                    </span>
                  </div>
                </div>

                {/* Field 3: Dynamic conditional showWhen Field */}
                {showFeedback && (
                  <div className="animate-in fade-in slide-in-from-top-2 space-y-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 duration-150">
                    <label
                      htmlFor="feedback-input"
                      className="flex items-center justify-between text-xs font-medium text-amber-600 dark:text-amber-400"
                    >
                      <span>3. What can we improve?</span>
                      <span className="py-0.2 rounded bg-amber-500/20 px-1 font-mono text-[9px]">
                        showWhen: rating ≤ 3
                      </span>
                    </label>
                    <input
                      id="feedback-input"
                      type="text"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Share your thoughts..."
                      className="w-full rounded-md border border-fd-border/80 bg-fd-background px-2.5 py-1.5 text-xs text-fd-foreground placeholder:text-fd-muted-foreground/60 focus:border-fd-primary focus:ring-1 focus:ring-fd-ring focus:outline-none"
                    />
                  </div>
                )}

                {/* Field 4: Optional Email Field */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="email-input"
                    className="flex items-center justify-between text-xs font-medium text-fd-foreground"
                  >
                    <span>4. Email (optional)</span>
                    <span className="font-mono text-[10px] text-fd-muted-foreground">
                      email
                    </span>
                  </label>
                  <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="developer@example.com"
                    className="w-full rounded-md border border-fd-border/80 bg-fd-background px-2.5 py-1.5 text-xs text-fd-foreground placeholder:text-fd-muted-foreground/60 focus:border-fd-primary focus:ring-1 focus:ring-fd-ring focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-2 flex items-center justify-between gap-2 border-t border-fd-border/60 pt-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft || isSubmitting}
                  className="flex items-center gap-1.5 rounded-lg border border-fd-border bg-fd-card px-3 py-1.5 text-xs font-medium text-fd-muted-foreground transition-all hover:bg-fd-muted hover:text-fd-foreground disabled:opacity-50"
                >
                  {isSavedRecently ? (
                    <>
                      <Check className="size-3 text-emerald-500" />
                      <span className="text-emerald-500">Draft Saved</span>
                    </>
                  ) : (
                    <>
                      <Save className="size-3" />
                      <span>{isSavingDraft ? "Saving..." : "Save Draft"}</span>
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || isSavingDraft}
                  className="flex items-center gap-1.5 rounded-lg bg-fd-primary px-3.5 py-1.5 text-xs font-semibold text-fd-primary-foreground shadow-xs transition-all hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="size-3 animate-spin rounded-full border-2 border-fd-primary-foreground/30 border-t-fd-primary-foreground" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Send className="size-3" />
                      Submit
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
