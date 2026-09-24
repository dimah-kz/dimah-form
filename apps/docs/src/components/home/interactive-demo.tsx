"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  CodeBlockTab,
  CodeBlockTabs,
  CodeBlockTabsList,
  CodeBlockTabsTrigger,
} from "fumadocs-ui/components/codeblock";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { Check, CheckCircle2, RotateCcw, Save, Send, Star } from "lucide-react";
import { cn } from "@/lib/cn";

const schemaCode = `import { defineForm } from "@dimah-form/server";

export const feedbackForm = defineForm({
  title: "Developer Feedback",
  slug: "feedback",
  fields: [
    {
      id: "framework",
      type: "select",
      label: "Primary framework",
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
      label: "Satisfaction",
      required: true,
      min: 1,
      max: 5,
    },
    {
      id: "feedback",
      type: "text",
      label: "What could we improve?",
      showWhen: { field: "rating", notEquals: [4, 5] },
    },
    {
      id: "email",
      type: "email",
      label: "Email address",
    },
  ],
});`;

const instanceCode = `import { dimahForm, memoryAdapter } from "@dimah-form/server";
import { feedbackForm } from "@/lib/forms/feedback";

export const form = dimahForm({
  database: memoryAdapter(),
  forms: { feedback: feedbackForm },
  basePath: "/api/form",
});

export type Form = typeof form;`;

const routeCode = `import { toNextJsHandler } from "@dimah-form/server/next";
import { form } from "@/lib/form";

export const { GET, POST, PUT, PATCH, DELETE } = toNextJsHandler(form);`;

const codeblock = {
  className: "my-0 h-full rounded-none border-0 bg-transparent shadow-none",
  viewportProps: { className: "max-h-[30rem]" },
};

const frameworks = [
  { id: "nextjs", label: "Next.js" },
  { id: "hono", label: "Hono" },
  { id: "sveltekit", label: "SvelteKit" },
  { id: "express", label: "Express" },
] as const;

export function InteractiveDemo() {
  const [framework, setFramework] =
    useState<(typeof frameworks)[number]["id"]>("nextjs");
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [isSavedRecently, setIsSavedRecently] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedResponse, setSubmittedResponse] = useState<{
    id: string;
    status: "submitted";
    answers: Record<string, unknown>;
  } | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const savedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const submitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const showFeedback = rating <= 3;
  const currentDisplayRating = hoverRating ?? rating;

  const clearTimers = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    if (submitTimer.current) clearTimeout(submitTimer.current);
  };

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      if (submitTimer.current) clearTimeout(submitTimer.current);
    },
    [],
  );

  const handleSaveDraft = () => {
    setIsSavingDraft(true);
    saveTimer.current = setTimeout(() => {
      setIsSavingDraft(false);
      setIsSavedRecently(true);
      savedTimer.current = setTimeout(() => setIsSavedRecently(false), 2000);
    }, 350);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    submitTimer.current = setTimeout(() => {
      setSubmittedResponse({
        id: crypto.randomUUID(),
        status: "submitted",
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
    clearTimers();
    setFramework("nextjs");
    setRating(5);
    setHoverRating(null);
    setFeedback("");
    setEmail("");
    setIsSavingDraft(false);
    setIsSavedRecently(false);
    setIsSubmitting(false);
    setSubmittedResponse(null);
  };

  return (
    <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-fd-border/80 bg-fd-card shadow-lg shadow-fd-foreground/5">
      <div className="grid items-stretch lg:grid-cols-[1.05fr_0.95fr]">
        <section
          aria-labelledby="definition-title"
          className="order-2 min-w-0 lg:order-1"
        >
          <div className="flex h-12 items-center justify-between border-b px-4 sm:px-5">
            <h2
              id="definition-title"
              className="text-sm font-medium text-fd-foreground"
            >
              Form definition
            </h2>
            <span className="font-mono text-xs text-fd-muted-foreground">
              TypeScript
            </span>
          </div>

          <CodeBlockTabs
            defaultValue="schema"
            className="my-0 h-full rounded-none border-0 bg-transparent shadow-none"
          >
            <CodeBlockTabsList>
              <CodeBlockTabsTrigger
                value="schema"
                className="font-mono text-xs"
              >
                feedback.ts
              </CodeBlockTabsTrigger>
              <CodeBlockTabsTrigger
                value="instance"
                className="font-mono text-xs"
              >
                form.ts
              </CodeBlockTabsTrigger>
              <CodeBlockTabsTrigger value="route" className="font-mono text-xs">
                route.ts
              </CodeBlockTabsTrigger>
            </CodeBlockTabsList>
            <CodeBlockTab value="schema">
              <DynamicCodeBlock
                lang="ts"
                code={schemaCode}
                codeblock={codeblock}
              />
            </CodeBlockTab>
            <CodeBlockTab value="instance">
              <DynamicCodeBlock
                lang="ts"
                code={instanceCode}
                codeblock={codeblock}
              />
            </CodeBlockTab>
            <CodeBlockTab value="route">
              <DynamicCodeBlock
                lang="ts"
                code={routeCode}
                codeblock={codeblock}
              />
            </CodeBlockTab>
          </CodeBlockTabs>
        </section>

        <section
          aria-labelledby="session-title"
          className="order-1 flex min-w-0 flex-col border-b bg-fd-background/30 lg:order-2 lg:border-s lg:border-b-0"
        >
          <div className="flex h-12 items-center justify-between border-b px-4 sm:px-5">
            <h2
              id="session-title"
              className="text-sm font-medium text-fd-foreground"
            >
              Response session
            </h2>
            <span className="font-mono text-xs text-fd-muted-foreground">
              {submittedResponse
                ? submittedResponse.status
                : isSavedRecently
                  ? "draft saved"
                  : "draft"}
            </span>
          </div>

          {submittedResponse ? (
            <div
              aria-atomic="true"
              aria-live="polite"
              className="flex flex-1 flex-col p-4 sm:p-5"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-fd-primary/10 text-fd-primary">
                  <CheckCircle2 className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium text-fd-foreground">
                    Response submitted
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-fd-muted-foreground">
                    The stored row keeps the definition it started with.
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <DynamicCodeBlock
                  lang="json"
                  code={JSON.stringify(
                    {
                      status: submittedResponse.status,
                      answers: submittedResponse.answers,
                    },
                    null,
                    2,
                  )}
                  codeblock={{
                    title: submittedResponse.id,
                    className:
                      "my-0 overflow-hidden rounded-xl border bg-fd-background shadow-none",
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="mt-6 inline-flex h-9 items-center gap-1.5 self-start rounded-lg border bg-fd-background px-3 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring"
              >
                <RotateCcw className="size-3.5" aria-hidden />
                Start over
              </button>
            </div>
          ) : (
            <form
              noValidate
              onSubmit={handleSubmit}
              className="flex flex-1 flex-col justify-between gap-6 p-4 sm:p-5"
            >
              <div className="space-y-5">
                <fieldset aria-required="true">
                  <legend className="text-sm font-medium text-fd-foreground">
                    Primary framework{" "}
                    <span aria-hidden className="text-rose-500">
                      *
                    </span>
                    <span className="sr-only">Required</span>
                  </legend>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {frameworks.map((item) => {
                      const isSelected = framework === item.id;

                      return (
                        <div key={item.id} className="relative">
                          <input
                            checked={isSelected}
                            className="peer sr-only"
                            id={`framework-${item.id}`}
                            name="framework"
                            onChange={() => setFramework(item.id)}
                            type="radio"
                            value={item.id}
                          />
                          <label
                            htmlFor={`framework-${item.id}`}
                            className={cn(
                              "flex h-10 cursor-pointer items-center justify-center rounded-lg border px-2 text-sm transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-fd-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-fd-background",
                              isSelected
                                ? "border-fd-primary bg-fd-primary/10 font-medium text-fd-foreground"
                                : "border-fd-border bg-fd-background text-fd-muted-foreground hover:border-fd-primary/40 hover:text-fd-foreground",
                            )}
                          >
                            {item.label}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </fieldset>

                <fieldset aria-required="true">
                  <legend className="text-sm font-medium text-fd-foreground">
                    Satisfaction{" "}
                    <span aria-hidden className="text-rose-500">
                      *
                    </span>
                    <span className="sr-only">Required</span>
                  </legend>
                  <div className="mt-2 flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isHighlighted = star <= currentDisplayRating;

                      return (
                        <div key={star} className="relative">
                          <input
                            checked={rating === star}
                            className="peer sr-only"
                            id={`rating-${star}`}
                            name="rating"
                            onChange={() => setRating(star)}
                            type="radio"
                            value={star}
                          />
                          <label
                            htmlFor={`rating-${star}`}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            className={cn(
                              "flex size-9 cursor-pointer items-center justify-center rounded-lg border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-fd-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-fd-background",
                              isHighlighted
                                ? "border-fd-primary/50 bg-fd-primary/10 text-fd-primary"
                                : "border-fd-border bg-fd-background text-fd-muted-foreground hover:border-fd-primary/40 hover:text-fd-foreground",
                            )}
                          >
                            <Star
                              aria-hidden
                              className={cn(
                                "size-4",
                                isHighlighted && "fill-current",
                              )}
                            />
                            <span className="sr-only">{star} out of 5</span>
                          </label>
                        </div>
                      );
                    })}
                    <span
                      aria-live="polite"
                      className="ms-2 font-mono text-xs text-fd-muted-foreground"
                    >
                      {rating} / 5
                    </span>
                  </div>
                </fieldset>

                {showFeedback ? (
                  <div className="space-y-2">
                    <label
                      htmlFor="feedback-input"
                      className="text-sm font-medium text-fd-foreground"
                    >
                      What could we improve?
                    </label>
                    <input
                      id="feedback-input"
                      type="text"
                      value={feedback}
                      onChange={(event) => setFeedback(event.target.value)}
                      placeholder="Share your thoughts"
                      className="h-10 w-full rounded-lg border border-fd-border bg-fd-background px-3 text-sm text-fd-foreground placeholder:text-fd-muted-foreground/60 focus-visible:border-fd-primary focus-visible:ring-2 focus-visible:ring-fd-ring/30 focus-visible:outline-none"
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label
                    htmlFor="email-input"
                    className="text-sm font-medium text-fd-foreground"
                  >
                    Email address
                  </label>
                  <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="developer@example.com"
                    className="h-10 w-full rounded-lg border border-fd-border bg-fd-background px-3 text-sm text-fd-foreground placeholder:text-fd-muted-foreground/60 focus-visible:border-fd-primary focus-visible:ring-2 focus-visible:ring-fd-ring/30 focus-visible:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft || isSubmitting}
                  aria-busy={isSavingDraft}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-fd-background px-3 text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSavedRecently ? (
                    <>
                      <Check className="size-3.5 text-fd-primary" aria-hidden />
                      <span className="text-fd-foreground">Draft saved</span>
                    </>
                  ) : (
                    <>
                      <Save className="size-3.5" aria-hidden />
                      {isSavingDraft ? "Saving…" : "Save draft"}
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || isSavingDraft}
                  aria-busy={isSubmitting}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-fd-primary px-4 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    "Validating…"
                  ) : (
                    <>
                      <Send className="size-3.5" aria-hidden />
                      Submit response
                    </>
                  )}
                </button>
              </div>
              <p aria-live="polite" className="sr-only">
                {isSavingDraft
                  ? "Saving draft"
                  : isSavedRecently
                    ? "Draft saved"
                    : ""}
              </p>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
