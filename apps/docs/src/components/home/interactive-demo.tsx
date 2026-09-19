"use client";

import { useState } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  FileCode2,
  RotateCcw,
  Save,
  Send,
  Server,
  Star,
} from "lucide-react";
import { cn } from "@/lib/cn";

type CodeTab = "schema" | "server";

const schemaCode = `import { defineForm } from "@dimah-form/server";

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

const serverCode = `import { dimahForm, memoryAdapter } from "@dimah-form/server";
import { toNextJsHandler } from "@dimah-form/server/next";
import { feedbackForm } from "@/lib/forms/feedback";

export const form = dimahForm({
  database: memoryAdapter(),
  forms: { feedback: feedbackForm },
});

export type Form = typeof form;
export const { GET, POST, PUT, PATCH, DELETE } = toNextJsHandler(form);`;

type TokenType =
  | "keyword"
  | "fn"
  | "type"
  | "prop"
  | "string"
  | "number"
  | "punct"
  | "ident"
  | "plain";

type Token = {
  type: TokenType;
  text: string;
};

function tokenizeTsLine(input: string): Token[] {
  if (!input) return [];

  const tokens: Token[] = [];
  const tokenRegex =
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b(?:import|from|export|const|let|var|type|typeof|return|true|false|as|default)\b)|(\b(?:defineForm|dimahForm|memoryAdapter|toNextJsHandler)\b)|(\b(?:Form|GET|POST|PUT|PATCH|DELETE)\b)|(\b[a-zA-Z_$][\w$]*(?=\s*:))|(\b\d+(?:\.\d+)?\b)|([{}[\](),.:;=><!+*/-])|(\b[a-zA-Z_$][\w$]*\b)|\s+|[^\s\w"'`]+/g;

  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(input)) !== null) {
    if (match[1]) {
      tokens.push({ type: "string", text: match[1] });
    } else if (match[2]) {
      tokens.push({ type: "keyword", text: match[2] });
    } else if (match[3]) {
      tokens.push({ type: "fn", text: match[3] });
    } else if (match[4]) {
      tokens.push({ type: "type", text: match[4] });
    } else if (match[5]) {
      tokens.push({ type: "prop", text: match[5] });
    } else if (match[6]) {
      tokens.push({ type: "number", text: match[6] });
    } else if (match[7]) {
      tokens.push({ type: "punct", text: match[7] });
    } else if (match[8]) {
      tokens.push({ type: "ident", text: match[8] });
    } else {
      tokens.push({ type: "plain", text: match[0] });
    }
  }

  return tokens;
}

function getTokenClass(type: TokenType): string {
  switch (type) {
    case "keyword":
      return "text-purple-400 font-medium";
    case "fn":
      return "text-blue-400 font-medium";
    case "type":
      return "text-amber-300 font-medium";
    case "prop":
      return "text-sky-300";
    case "string":
      return "text-emerald-400";
    case "number":
      return "text-orange-400";
    case "punct":
      return "text-zinc-400";
    case "ident":
      return "text-zinc-100";
    case "plain":
    default:
      return "text-zinc-300";
  }
}

function HighlightedCode({ code }: { code: string }) {
  const lines = code.split("\n");

  return (
    <div className="font-mono text-xs leading-relaxed sm:text-[13px]">
      {lines.map((line, lineIndex) => {
        const commentIdx = line.indexOf("//");
        let codePart = line;
        let commentPart = "";

        if (commentIdx !== -1) {
          codePart = line.slice(0, commentIdx);
          commentPart = line.slice(commentIdx);
        }

        const tokens = tokenizeTsLine(codePart);

        return (
          <div key={lineIndex} className="group table-row">
            <span className="table-cell pr-4 text-right font-mono text-[11px] text-zinc-600 select-none group-hover:text-zinc-500">
              {(lineIndex + 1).toString().padStart(2, "0")}
            </span>
            <span className="table-cell font-mono whitespace-pre">
              {tokens.map((token, i) => (
                <span key={i} className={getTokenClass(token.type)}>
                  {token.text}
                </span>
              ))}
              {commentPart && (
                <span className="text-zinc-500 italic">{commentPart}</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function HighlightedJson({ data }: { data: Record<string, unknown> }) {
  const jsonString = JSON.stringify(data, null, 2);
  const lines = jsonString.split("\n");

  return (
    <div className="font-mono text-xs leading-relaxed sm:text-[12px]">
      {lines.map((line, lineIdx) => {
        const tokenRegex =
          /("(?:[^"\\]|\\.)*")\s*(:)|("(?:[^"\\]|\\.)*")|(\b(?:true|false|null)\b)|(-?\b\d+(?:\.\d+)?\b)|([{}[\]:,])/g;

        const renderedTokens: React.ReactNode[] = [];
        let lastIdx = 0;
        let match: RegExpExecArray | null;

        while ((match = tokenRegex.exec(line)) !== null) {
          if (match.index > lastIdx) {
            renderedTokens.push(line.slice(lastIdx, match.index));
          }
          if (match[1] && match[2]) {
            renderedTokens.push(
              <span key={match.index} className="text-sky-300">
                {match[1]}
              </span>,
            );
            renderedTokens.push(
              <span key={`${match.index}-c`} className="text-zinc-400">
                :
              </span>,
            );
          } else if (match[3]) {
            renderedTokens.push(
              <span key={match.index} className="text-emerald-400">
                {match[3]}
              </span>,
            );
          } else if (match[4]) {
            renderedTokens.push(
              <span key={match.index} className="font-medium text-purple-400">
                {match[4]}
              </span>,
            );
          } else if (match[5]) {
            renderedTokens.push(
              <span key={match.index} className="text-orange-400">
                {match[5]}
              </span>,
            );
          } else if (match[6]) {
            renderedTokens.push(
              <span key={match.index} className="text-zinc-400">
                {match[6]}
              </span>,
            );
          }
          lastIdx = tokenRegex.lastIndex;
        }
        if (lastIdx < line.length) {
          renderedTokens.push(line.slice(lastIdx));
        }

        return (
          <div key={lineIdx} className="whitespace-pre">
            {renderedTokens}
          </div>
        );
      })}
    </div>
  );
}

export function InteractiveDemo() {
  const [activeCodeTab, setActiveCodeTab] = useState<CodeTab>("schema");
  const [copied, setCopied] = useState<boolean>(false);

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

  const currentCode = activeCodeTab === "schema" ? schemaCode : serverCode;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

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

  const currentDisplayRating = hoverRating ?? rating;

  return (
    <div className="relative mx-auto w-full max-w-6xl rounded-2xl border border-fd-border/70 bg-fd-card/40 p-3 shadow-2xl backdrop-blur-xl sm:p-5">
      {/* Top Window Bar - Minimal */}
      <div className="flex items-center justify-between border-b border-fd-border/50 px-2 pb-3.5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="size-2.5 rounded-full bg-rose-500/70" />
            <div className="size-2.5 rounded-full bg-amber-500/70" />
            <div className="size-2.5 rounded-full bg-emerald-500/70" />
          </div>
          <span className="ms-1.5 font-mono text-[11px] text-fd-muted-foreground/70">
            playground
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-fd-muted-foreground/70">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span>live snapshot</span>
        </div>
      </div>

      {/* Main Grid: Code on Left, Live Form on Right */}
      <div className="mt-4 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        {/* LEFT COLUMN: Clean Minimal Code Editor */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-800/90 bg-[#0c0e14] shadow-sm">
          {/* Editor Header: Tabs + Copy */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 bg-[#11131a] px-3 py-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveCodeTab("schema")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1 font-mono text-xs font-medium transition-colors",
                  activeCodeTab === "schema"
                    ? "border border-zinc-700/80 bg-[#1a1e2b] text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-200",
                )}
              >
                <FileCode2 className="size-3.5 text-amber-400" />
                <span>feedback.ts</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCodeTab("server")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1 font-mono text-xs font-medium transition-colors",
                  activeCodeTab === "server"
                    ? "border border-zinc-700/80 bg-[#1a1e2b] text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-200",
                )}
              >
                <Server className="size-3.5 text-blue-400" />
                <span>route.ts</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => void handleCopyCode()}
              aria-label={copied ? "Copied code" : "Copy code"}
              className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 font-mono text-[11px] text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              {copied ? (
                <>
                  <Check className="size-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3 opacity-70" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Editor Body: Syntax Highlighted Code with Line Numbers */}
          <div className="relative max-h-[420px] min-h-[380px] flex-1 overflow-auto p-4 sm:p-5">
            <HighlightedCode code={currentCode} />
          </div>
        </div>

        {/* RIGHT COLUMN: Spacious & Clean Live Form Preview */}
        <div className="flex flex-col justify-between rounded-xl border border-fd-border/70 bg-fd-background/95 p-5 shadow-sm sm:p-6 lg:p-7">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-fd-border/50 pb-3.5">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold tracking-wide text-fd-foreground">
                Live Questionnaire
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {draftRev > 1 && !submittedResponse && (
                <span className="font-mono text-[11px] text-fd-muted-foreground/80">
                  draft v{draftRev}
                </span>
              )}
              {submittedResponse && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1 text-xs text-fd-muted-foreground transition-colors hover:text-fd-foreground"
                >
                  <RotateCcw className="size-3" />
                  Reset
                </button>
              )}
            </div>
          </div>

          {submittedResponse ? (
            /* Submission Success Inspector */
            <div className="animate-in fade-in zoom-in-95 my-auto flex flex-col items-center justify-center py-6 text-center duration-200">
              <div className="flex size-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-5" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-fd-foreground sm:text-base">
                Submission Validated
              </h3>
              <p className="mt-1 font-mono text-xs text-fd-muted-foreground">
                snapshot: {submittedResponse.snapshotId}
              </p>

              {/* Verified Payload JSON */}
              <div className="mt-4 w-full rounded-xl border border-zinc-800 bg-[#0c0e14] p-4 text-left">
                <div className="mb-2 flex items-center justify-between border-b border-zinc-800/80 pb-1.5 font-mono text-[11px] text-zinc-400">
                  <span>response: {submittedResponse.id}</span>
                  <span className="text-emerald-400">200 OK</span>
                </div>
                <HighlightedJson data={submittedResponse.answers} />
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-fd-border bg-fd-card px-4 py-2 text-xs font-medium text-fd-foreground shadow-xs transition-colors hover:bg-fd-muted"
              >
                <RotateCcw className="size-3" />
                Fill Again
              </button>
            </div>
          ) : (
            /* Active Form Rendering */
            <form
              onSubmit={handleSubmit}
              className="mt-4 flex flex-1 flex-col justify-between gap-5"
            >
              <div className="space-y-5">
                {/* Field 1: Framework Select */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-fd-foreground sm:text-sm">
                    Primary Framework <span className="text-rose-500">*</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                          "h-9 rounded-lg border px-3 text-center text-xs font-medium transition-all sm:text-sm",
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
                <div className="space-y-2">
                  <div className="text-xs font-medium text-fd-foreground sm:text-sm">
                    Satisfaction Rating <span className="text-rose-500">*</span>
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
                          "flex size-9 items-center justify-center rounded-lg border transition-all",
                          star <= currentDisplayRating
                            ? "border-amber-500/60 bg-amber-500/10 text-amber-500 shadow-xs"
                            : "border-fd-border/70 bg-fd-card/50 text-fd-muted-foreground hover:text-fd-foreground",
                        )}
                      >
                        <Star
                          className={cn(
                            "size-4 transition-transform",
                            star <= currentDisplayRating && "fill-amber-500",
                          )}
                        />
                      </button>
                    ))}
                    <span className="ms-2 font-mono text-xs text-fd-muted-foreground">
                      {rating} / 5
                    </span>
                  </div>
                </div>

                {/* Field 3: Dynamic conditional showWhen Field */}
                {showFeedback && (
                  <div className="animate-in fade-in slide-in-from-top-2 space-y-2 duration-150">
                    <label
                      htmlFor="feedback-input"
                      className="text-xs font-medium text-fd-foreground sm:text-sm"
                    >
                      What can we improve?
                    </label>
                    <input
                      id="feedback-input"
                      type="text"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Share your thoughts..."
                      className="h-10 w-full rounded-lg border border-fd-border/80 bg-fd-background px-3 text-xs text-fd-foreground placeholder:text-fd-muted-foreground/50 focus:border-fd-primary focus:ring-1 focus:ring-fd-ring focus:outline-none sm:text-sm"
                    />
                  </div>
                )}

                {/* Field 4: Optional Email Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="email-input"
                    className="text-xs font-medium text-fd-foreground sm:text-sm"
                  >
                    Email (optional)
                  </label>
                  <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="developer@example.com"
                    className="h-10 w-full rounded-lg border border-fd-border/80 bg-fd-background px-3 text-xs text-fd-foreground placeholder:text-fd-muted-foreground/50 focus:border-fd-primary focus:ring-1 focus:ring-fd-ring focus:outline-none sm:text-sm"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-fd-border/50 pt-4">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft || isSubmitting}
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-fd-border bg-fd-card px-3.5 text-xs font-medium text-fd-muted-foreground transition-all hover:bg-fd-muted hover:text-fd-foreground disabled:opacity-50 sm:text-sm"
                >
                  {isSavedRecently ? (
                    <>
                      <Check className="size-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Draft Saved</span>
                    </>
                  ) : (
                    <>
                      <Save className="size-3.5" />
                      <span>{isSavingDraft ? "Saving..." : "Save Draft"}</span>
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || isSavingDraft}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-fd-primary px-4 text-xs font-semibold text-fd-primary-foreground shadow-xs transition-all hover:opacity-90 disabled:opacity-50 sm:text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <span className="size-3.5 animate-spin rounded-full border-2 border-fd-primary-foreground/30 border-t-fd-primary-foreground" />
                      Validating...
                    </>
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
