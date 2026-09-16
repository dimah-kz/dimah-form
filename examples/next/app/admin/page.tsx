"use client";

import type {
  FormSnapshot,
  ResponseList,
  ResponseSummary,
} from "@dimah-form/core";
import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  isDemoAdmin,
  setDemoAdmin,
  subscribeDemoAdmin,
  useDemoFormClient,
} from "@/lib/client";
import { formatFormError } from "@/lib/format-error";

const feedbackFields = [
  {
    id: "note",
    type: "text" as const,
    required: true,
    label: "How was it?",
    minLength: 3,
  },
  {
    id: "score",
    type: "number" as const,
    label: "Score",
    min: 1,
    max: 5,
    integer: true,
  },
];

function isSummary(
  row: ResponseList["responses"][number],
): row is ResponseSummary {
  return !("answers" in row);
}

export default function AdminPage() {
  const client = useDemoFormClient();
  const admin = useSyncExternalStore(
    subscribeDemoAdmin,
    isDemoAdmin,
    () => false,
  );
  const [title, setTitle] = useState("Feedback");
  const [slug, setSlug] = useState("feedback");
  const [forms, setForms] = useState<FormSnapshot[]>([]);
  const [responses, setResponses] = useState<ResponseList["responses"]>([]);
  const [includeFull, setIncludeFull] = useState(false);
  const [ping, setPing] = useState<string>();
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    try {
      const [formPage, responsePage] = await Promise.all([
        client.listForms({ limit: 20 }),
        client.listResponses({
          limit: 20,
          include: includeFull ? "full" : "summary",
        }),
      ]);
      setForms(formPage.forms);
      setResponses(responsePage.responses);
    } catch (caught) {
      setError(formatFormError(caught, "Could not load catalog"));
    }
  }, [client, includeFull]);

  useEffect(() => {
    if (!admin) return;
    let cancelled = false;
    void (async () => {
      try {
        const [formPage, responsePage] = await Promise.all([
          client.listForms({ limit: 20 }),
          client.listResponses({
            limit: 20,
            include: includeFull ? "full" : "summary",
          }),
        ]);
        if (cancelled) return;
        setForms(formPage.forms);
        setResponses(responsePage.responses);
      } catch (caught) {
        if (!cancelled) {
          setError(formatFormError(caught, "Could not load catalog"));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [admin, client, includeFull]);

  async function enableAdmin() {
    setDemoAdmin(true);
    window.location.reload();
  }

  async function saveDynamic(status: "active" | "archived") {
    setError(undefined);
    try {
      await client.saveForm({
        id: slug,
        slug,
        status,
        title,
        fields: feedbackFields,
      });
      await refresh();
    } catch (caught) {
      setError(formatFormError(caught, "Could not save form"));
    }
  }

  async function onDeleteForm(formId: string) {
    setError(undefined);
    try {
      await client.deleteForm({ formId });
      await refresh();
    } catch (caught) {
      setError(formatFormError(caught, "Could not delete form"));
    }
  }

  async function onPing() {
    const result = await client.ping();
    setPing(JSON.stringify(result));
  }

  if (!admin) {
    return (
      <div className="grid max-w-md gap-3 text-sm">
        <h1 className="font-medium">Admin</h1>
        <p className="text-muted-foreground">
          Demo guard: list/save/delete need the <code>x-demo-admin</code>{" "}
          header.
        </p>
        <Button type="button" onClick={enableAdmin}>
          Enable admin header
        </Button>
      </div>
    );
  }

  return (
    <div className="grid max-w-xl gap-6 text-sm">
      <div>
        <h1 className="font-medium">Admin</h1>
        <p className="text-muted-foreground">
          Dynamic forms, response summaries, plugin ping. Code-authored forms
          and forms with responses cannot be deleted — archive them instead.
        </p>
      </div>
      <div className="grid gap-2">
        <label className="grid gap-1">
          Title
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="grid gap-1">
          Slug / id
          <Input
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => saveDynamic("active")}>
            Save dynamic form
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => saveDynamic("archived")}
          >
            Archive
          </Button>
          <Button type="button" variant="outline" onClick={onPing}>
            Ping plugin
          </Button>
          <Button type="button" variant="outline" onClick={refresh}>
            Load catalog
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              setIncludeFull((current) => !current);
            }}
          >
            {includeFull ? "Summaries" : "Include answers"}
          </Button>
        </div>
        {ping ? <p className="font-mono text-xs">{ping}</p> : null}
        {error ? <p className="text-destructive">{error}</p> : null}
      </div>
      <section className="grid gap-2">
        <h2 className="font-medium">Forms</h2>
        <ul className="grid gap-2">
          {forms.map((form) => (
            <li key={form.id} className="flex flex-wrap items-center gap-2">
              <Link className="underline" href={`/f/${form.slug}`}>
                {form.title}
              </Link>
              <span className="text-muted-foreground">
                {form.slug} · {form.status}
              </span>
              <Button
                type="button"
                size="xs"
                variant="destructive"
                onClick={() => onDeleteForm(form.id)}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      </section>
      <section className="grid gap-2">
        <h2 className="font-medium">Responses</h2>
        <ul className="grid gap-2">
          {responses.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-2">
              <Link className="underline" href={`/r/${row.id}`}>
                {row.id.slice(0, 8)}
              </Link>
              <span className="text-muted-foreground">
                {row.formId} · {row.status}
              </span>
              {!isSummary(row) ? (
                <span className="font-mono text-xs text-muted-foreground">
                  {JSON.stringify(row.answers)}
                </span>
              ) : null}
              {row.status === "draft" ? (
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await client.abandonResponse({ responseId: row.id });
                      await refresh();
                    } catch (caught) {
                      setError(formatFormError(caught, "Could not abandon"));
                    }
                  }}
                >
                  Abandon
                </Button>
              ) : (
                <Button
                  type="button"
                  size="xs"
                  variant="destructive"
                  onClick={async () => {
                    try {
                      await client.deleteResponse({ responseId: row.id });
                      await refresh();
                    } catch (caught) {
                      setError(formatFormError(caught, "Could not delete"));
                    }
                  }}
                >
                  Delete
                </Button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
