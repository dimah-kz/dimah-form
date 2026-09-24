"use client";

import { useState, type FormEvent } from "react";
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
      label: "What can we improve?",
      showWhen: { field: "rating", lte: 3 },
    },
    {
      id: "email",
      type: "email",
      label: "Email",
    },
  ],
});`;

const serverCode = `import { dimahForm, memoryAdapter } from "@dimah-form/server";
import { toNextJsHandler } from "@dimah-form/server/next";
import { feedbackForm } from "@/lib/forms/feedback";

export const form = dimahForm({
  database: memoryAdapter(),
  forms: { feedback: feedbackForm },
  basePath: "/api/form",
});

export type Form = typeof form;

export const { GET, POST, PUT, PATCH, DELETE } = toNextJsHandler(form);`;

const codeblock = {
  className: "my-0 h-full rounded-none border-0 shadow-none",
  viewportProps: { className: "max-h-[32rem]" },
};

const frameworks = [
  { id: "nextjs", label: "Next.js" },
  { id: "hono", label: "Hono" },
  { id: "sveltekit", label: "SvelteKit" },
  { id: "express", label: "Express" },
] as const;

export function InteractiveDemo() {
  const [framework, setFramework] = useState<string>("nextjs");
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [draftRev, setDraftRev] = useState<number>(1);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [isSavedRecently, setIsSavedRecently] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedResponse, setSubmittedResponse] = useState<{
    id: string;
    snapshotId: string;
    answers: Record<string, unknown>;
  } | null>(null);

  const showFeedback = rating <= 3;
  const currentDisplayRating = hoverRating ?? rating;

  const handleSaveDraft = () => {
    setIsSavingDraft(true);
    setTimeout(() => {
      setDraftRev((prev) => prev + 1);
      setIsSavingDraft(false);
      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 2000);
    }, 350);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
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

  return (
    <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-xl border bg-fd-card shadow-sm">
      <div className="grid items-stretch lg:grid-cols-2">
        <CodeBlockTabs
          defaultValue="schema"
          className="my-0 h-full rounded-none border-0 bg-transparent shadow-none"
        >
          <CodeBlockTabsList>
            <CodeBlockTabsTrigger value="schema" className="font-mono text-xs">
              lib/forms/feedback.ts
            </CodeBlockTabsTrigger>
            <CodeBlockTabsTrigger value="server" className="font-mono text-xs">
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
          <CodeBlockTab value="server">
            <DynamicCodeBlock
              lang="ts"
              code={serverCode}
              codeblock={codeblock}
            />
          </CodeBlockTab>
        </CodeBlockTabs>

        <div className="flex h-full flex-col border-t lg:border-s lg:border-t-0">
          <div className="flex h-9.5 items-center justify-between border-b px-4 text-sm text-fd-muted-foreground">
            <span>Fill session</span>
            <span className="font-mono text-xs">
              {submittedResponse
                ? submittedResponse.snapshotId
                : draftRev > 1
                  ? `draft v${draftRev}`
                  : "draft"}
            </span>
          </div>

          {submittedResponse ? (
            <div className="flex flex-1 flex-col px-4 pt-5 pb-4">
              <div className="flex items-center gap-2 text-sm font-medium text-fd-foreground">
                <CheckCircle2 className="size-4 text-fd-primary" />
                Validated against the snapshot
              </div>
              <div className="mt-4">
                <DynamicCodeBlock
                  lang="json"
                  code={JSON.stringify(submittedResponse.answers, null, 2)}
                  codeblock={{
                    title: submittedResponse.id,
                    className: "my-0",
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="mt-auto inline-flex h-9 items-center gap-1.5 self-start rounded-lg border bg-fd-background px-3 text-sm text-fd-foreground hover:bg-fd-muted"
              >
                <RotateCcw className="size-3.5" />
                Fill again
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-1 flex-col justify-between gap-5 p-4 sm:p-5"
            >
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-fd-foreground">
                    Primary framework <span className="text-rose-500">*</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {frameworks.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFramework(item.id)}
                        className={cn(
                          "h-9 rounded-lg border px-2 text-center text-sm transition-colors",
                          framework === item.id
                            ? "border-fd-primary bg-fd-primary/10 font-medium text-fd-foreground"
                            : "bg-fd-background text-fd-muted-foreground hover:text-fd-foreground",
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-fd-foreground">
                    Satisfaction <span className="text-rose-500">*</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => setRating(star)}
                        className={cn(
                          "flex size-9 items-center justify-center rounded-lg border transition-colors",
                          star <= currentDisplayRating
                            ? "border-fd-primary/50 bg-fd-primary/10 text-fd-primary"
                            : "bg-fd-background text-fd-muted-foreground hover:text-fd-foreground",
                        )}
                      >
                        <Star
                          className={cn(
                            "size-4",
                            star <= currentDisplayRating && "fill-current",
                          )}
                        />
                      </button>
                    ))}
                    <span className="ms-2 font-mono text-xs text-fd-muted-foreground">
                      {rating} / 5
                    </span>
                  </div>
                </div>

                {showFeedback ? (
                  <div className="space-y-2">
                    <label
                      htmlFor="feedback-input"
                      className="text-sm font-medium text-fd-foreground"
                    >
                      What can we improve?
                    </label>
                    <input
                      id="feedback-input"
                      type="text"
                      value={feedback}
                      onChange={(event) => setFeedback(event.target.value)}
                      placeholder="Share your thoughts"
                      className="h-10 w-full rounded-lg border bg-fd-background px-3 text-sm text-fd-foreground placeholder:text-fd-muted-foreground/60 focus:border-fd-primary focus:ring-1 focus:ring-fd-ring focus:outline-none"
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label
                    htmlFor="email-input"
                    className="text-sm font-medium text-fd-foreground"
                  >
                    Email
                  </label>
                  <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="developer@example.com"
                    className="h-10 w-full rounded-lg border bg-fd-background px-3 text-sm text-fd-foreground placeholder:text-fd-muted-foreground/60 focus:border-fd-primary focus:ring-1 focus:ring-fd-ring focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft || isSubmitting}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-fd-background px-3 text-sm text-fd-muted-foreground hover:text-fd-foreground disabled:opacity-50"
                >
                  {isSavedRecently ? (
                    <>
                      <Check className="size-3.5 text-fd-primary" />
                      <span className="text-fd-foreground">Draft saved</span>
                    </>
                  ) : (
                    <>
                      <Save className="size-3.5" />
                      {isSavingDraft ? "Saving…" : "Save draft"}
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || isSavingDraft}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-fd-primary px-4 text-sm font-medium text-fd-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    "Validating…"
                  ) : (
                    <>
                      <Send className="size-3.5" />
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
