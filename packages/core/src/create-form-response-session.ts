import {
  applyAnswerPatch,
  collectAnswerIssues,
  isFieldVisible,
  seedDefaultAnswers,
  stripHiddenAnswers,
  type AnswerValidationMode,
} from "./answers";
import type { FormClientApi } from "./create-form-client";
import type { FieldTypeDefinition } from "./define";
import { APIError, FORM_ERROR_CODES, isFormErrorCode } from "./error";
import { createFieldTypeRegistry } from "./field-types";
import { formErrorMessage, issuesByField, visibleFields } from "./field-view";
import type { FormField, FormSnapshot } from "./schema/definition";
import type {
  FormAnswers,
  ResponseRecord,
  ResponseStatus,
} from "./schema/protocol";
import type { ValidationIssue } from "./schema/error";

/** Protocol methods the fill session needs. */
export type FormResponseSessionClient = Pick<
  FormClientApi,
  | "startResponse"
  | "getResponse"
  | "saveDraft"
  | "submitResponse"
  | "reopenResponse"
  | "abandonResponse"
> & {
  fieldTypes?: readonly FieldTypeDefinition[];
};

export type FormResponsePending =
  "save" | "submit" | "reopen" | "abandon" | "refresh";

export type FormResponseValidateMode = "submit" | "change";

export type FormResponseSessionHooks = {
  /** After `startResponse` — do not navigate here if a save/submit follows. */
  onStarted?: (record: ResponseRecord) => void;
  onSaved?: (record: ResponseRecord) => void;
  onSubmitted?: (record: ResponseRecord) => void;
  onReopened?: (record: ResponseRecord) => void;
  onAbandoned?: (record: ResponseRecord) => void;
};

export type FormResponseFieldTypes =
  readonly FieldTypeDefinition[] | ReadonlyMap<string, FieldTypeDefinition>;

export type CreateFormResponseSessionOptions = {
  client: FormResponseSessionClient;
  snapshot: FormSnapshot;
  /** Existing row — omit when starting a new response. */
  response?: Pick<
    ResponseRecord,
    "id" | "answers" | "status" | "updatedAt" | "definition"
  >;
  respondentId?: string | (() => string);
  /**
   * Extra field types (same list as `dimahForm({ fieldTypes })`). A prepared
   * registry Map is also accepted. Falls back to `client.fieldTypes`.
   */
  fieldTypes?: FormResponseFieldTypes;
  /**
   * `"submit"` validates on submit (and after a failed submit).
   * `"change"` also validates on each `setAnswer`.
   */
  validate?: FormResponseValidateMode;
} & FormResponseSessionHooks;

export type FormResponseSessionState = {
  snapshot: FormSnapshot;
  responseId: string | undefined;
  answers: FormAnswers;
  status: ResponseStatus;
  updatedAt: string | undefined;
  issues: Record<string, string>;
  error: string | undefined;
  pending: FormResponsePending | undefined;
  locked: boolean;
  dirty: boolean;
  /** No existing row and the live form is not `active`. */
  inactive: boolean;
  visibleFields: FormField[];
};

/** Headless binding for one field — the contract a UI package would wrap. */
export type FormFieldBinding = {
  id: string;
  field: FormField | undefined;
  value: unknown;
  error: string | undefined;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
  visible: boolean;
  onChange: (value: unknown) => void;
};

export type FormResponseActions = {
  setAnswer: (fieldId: string, value: unknown) => void;
  setAnswers: (patch: FormAnswers) => void;
  field: (fieldId: string) => FormFieldBinding;
  validate: (mode?: AnswerValidationMode) => ValidationIssue[];
  saveDraft: () => Promise<ResponseRecord | undefined>;
  submit: () => Promise<ResponseRecord | undefined>;
  reopen: () => Promise<ResponseRecord | undefined>;
  abandon: () => Promise<ResponseRecord | undefined>;
  refresh: () => Promise<ResponseRecord | undefined>;
};

/** State + actions. `useFormResponse` returns this; a UI package consumes it. */
export type FormResponseApi = FormResponseSessionState & FormResponseActions;

export type FormResponseSession = FormResponseActions & {
  subscribe: (listener: () => void) => () => void;
  getState: () => FormResponseSessionState;
  /**
   * Update client / callbacks / field types without resetting answers.
   * Does not notify subscribers.
   */
  sync: (
    options: Partial<
      Omit<CreateFormResponseSessionOptions, "snapshot" | "response">
    >,
  ) => void;
};

type InternalState = {
  responseId: string | undefined;
  answers: FormAnswers;
  status: ResponseStatus;
  updatedAt: string | undefined;
  issues: Record<string, string>;
  error: string | undefined;
  pending: FormResponsePending | undefined;
  dirty: boolean;
};

type SessionConfig = {
  client: FormResponseSessionClient;
  respondentId: string | (() => string) | undefined;
  validate: FormResponseValidateMode;
  fieldTypes: FormResponseFieldTypes | undefined;
} & FormResponseSessionHooks;

const FALLBACK: Record<FormResponsePending, string> = {
  save: "Could not save draft",
  submit: "Could not submit",
  reopen: "Could not reopen",
  abandon: "Could not abandon",
  refresh: "Could not refresh",
};

function isLocked(status: ResponseStatus) {
  return status === "submitted" || status === "abandoned";
}

function resolveRegistry(fieldTypes: FormResponseFieldTypes | undefined) {
  if (
    fieldTypes &&
    !Array.isArray(fieldTypes) &&
    typeof (fieldTypes as Map<string, FieldTypeDefinition>).get === "function"
  ) {
    return fieldTypes as ReadonlyMap<string, FieldTypeDefinition>;
  }
  return createFieldTypeRegistry(
    fieldTypes as readonly FieldTypeDefinition[] | undefined,
  );
}

function resolveRespondentId(value: string | (() => string) | undefined) {
  if (value == null) return undefined;
  return typeof value === "function" ? value() : value;
}

function answersPatch(from: FormAnswers, to: FormAnswers): FormAnswers {
  const patch: FormAnswers = {};
  const keys = new Set(Object.keys(from)).union(new Set(Object.keys(to)));
  for (const key of keys) {
    const prev = from[key];
    const next = to[key];
    if (Object.is(prev, next)) continue;
    patch[key] = next === undefined ? null : next;
  }
  return patch;
}

function withConcurrency<T extends { responseId: string }>(
  payload: T,
  updatedAt: string | undefined,
): T {
  return updatedAt === undefined ? payload : { ...payload, updatedAt };
}

/**
 * Headless fill session — answers, visibility, local validation, and the
 * start / draft / submit / reopen loop. No widgets.
 */
export function createFormResponseSession(
  options: CreateFormResponseSessionOptions,
): FormResponseSession {
  const initialSnapshot = options.response?.definition ?? options.snapshot;
  const initialAnswers = options.response
    ? { ...options.response.answers }
    : seedDefaultAnswers(initialSnapshot);

  let snapshot = initialSnapshot;
  const config: SessionConfig = {
    client: options.client,
    respondentId: options.respondentId,
    validate: options.validate ?? "submit",
    fieldTypes: options.fieldTypes ?? options.client.fieldTypes,
    onStarted: options.onStarted,
    onSaved: options.onSaved,
    onSubmitted: options.onSubmitted,
    onReopened: options.onReopened,
    onAbandoned: options.onAbandoned,
  };
  let registry = resolveRegistry(config.fieldTypes);

  const internal: InternalState = {
    responseId: options.response?.id,
    answers: initialAnswers,
    status: options.response?.status ?? "draft",
    updatedAt: options.response?.updatedAt,
    issues: {},
    error: undefined,
    pending: undefined,
    dirty: false,
  };

  let lastSaved: FormAnswers = { ...initialAnswers };
  let submitAttempted = false;
  let cached: FormResponseSessionState | undefined;
  const listeners = new Set<() => void>();
  const onChangeById = new Map<string, (value: unknown) => void>();

  function emit() {
    cached = undefined;
    for (const listener of listeners) listener();
  }

  function getState(): FormResponseSessionState {
    if (!cached) {
      cached = {
        snapshot,
        responseId: internal.responseId,
        answers: internal.answers,
        status: internal.status,
        updatedAt: internal.updatedAt,
        issues: internal.issues,
        error: internal.error,
        pending: internal.pending,
        locked: isLocked(internal.status),
        dirty: internal.dirty,
        inactive:
          internal.responseId === undefined && snapshot.status !== "active",
        visibleFields: visibleFields(snapshot, internal.answers),
      };
    }
    return cached;
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function sync(
    next: Partial<
      Omit<CreateFormResponseSessionOptions, "snapshot" | "response">
    >,
  ) {
    if (next.client !== undefined) config.client = next.client;
    if (next.respondentId !== undefined)
      config.respondentId = next.respondentId;
    if (next.validate !== undefined) config.validate = next.validate;
    if (next.onStarted !== undefined) config.onStarted = next.onStarted;
    if (next.onSaved !== undefined) config.onSaved = next.onSaved;
    if (next.onSubmitted !== undefined) config.onSubmitted = next.onSubmitted;
    if (next.onReopened !== undefined) config.onReopened = next.onReopened;
    if (next.onAbandoned !== undefined) config.onAbandoned = next.onAbandoned;
    if (
      next.fieldTypes !== undefined &&
      next.fieldTypes !== config.fieldTypes
    ) {
      config.fieldTypes = next.fieldTypes;
      registry = resolveRegistry(next.fieldTypes);
    } else if (
      next.client !== undefined &&
      next.fieldTypes === undefined &&
      next.client.fieldTypes !== undefined &&
      next.client.fieldTypes !== config.fieldTypes
    ) {
      config.fieldTypes = next.client.fieldTypes;
      registry = resolveRegistry(next.client.fieldTypes);
    }
  }

  function applyRecord(row: ResponseRecord) {
    snapshot = row.definition;
    internal.responseId = row.id;
    internal.answers = { ...row.answers };
    internal.status = row.status;
    internal.updatedAt = row.updatedAt;
    internal.issues = {};
    internal.error = undefined;
    internal.dirty = false;
    lastSaved = { ...row.answers };
  }

  function acceptStart(row: ResponseRecord) {
    snapshot = row.definition;
    internal.responseId = row.id;
    internal.status = row.status;
    internal.updatedAt = row.updatedAt;
    lastSaved = { ...row.answers };
    config.onStarted?.(row);
  }

  function collect(mode: AnswerValidationMode) {
    return collectAnswerIssues(snapshot, internal.answers, mode, registry);
  }

  function writeIssues(issues: readonly ValidationIssue[]) {
    internal.issues = issuesByField(issues);
  }

  function applyPatch(patch: FormAnswers) {
    if (isLocked(internal.status)) return;
    const answers = stripHiddenAnswers(
      snapshot,
      applyAnswerPatch(internal.answers, patch),
    );
    internal.answers = answers;
    internal.dirty = true;
    internal.error = undefined;
    if (config.validate === "change" || submitAttempted) {
      writeIssues(collect(config.validate === "change" ? "draft" : "submit"));
    } else {
      const next = { ...internal.issues };
      for (const key of Object.keys(patch)) delete next[key];
      internal.issues = next;
    }
    emit();
  }

  function setAnswer(fieldId: string, value: unknown) {
    applyPatch({ [fieldId]: value });
  }

  function setAnswers(patch: FormAnswers) {
    applyPatch(patch);
  }

  function field(fieldId: string): FormFieldBinding {
    let onChange = onChangeById.get(fieldId);
    if (!onChange) {
      onChange = (value: unknown) => setAnswer(fieldId, value);
      onChangeById.set(fieldId, onChange);
    }
    const current = getState();
    const fieldDef = current.snapshot.fields.find(
      (item) => item.id === fieldId,
    );
    const error = current.issues[fieldId];
    return {
      id: fieldId,
      field: fieldDef,
      value: current.answers[fieldId],
      error,
      invalid: Boolean(error),
      required: fieldDef?.required === true,
      disabled: current.locked || current.pending != null,
      visible: fieldDef ? isFieldVisible(fieldDef, current.answers) : false,
      onChange,
    };
  }

  function validate(mode: AnswerValidationMode = "submit"): ValidationIssue[] {
    const issues = collect(mode);
    if (mode === "submit") submitAttempted = true;
    writeIssues(issues);
    emit();
    return issues;
  }

  async function recover(caught: unknown, fallback: string) {
    if (isFormErrorCode(caught, "STALE_UPDATE") && internal.responseId) {
      try {
        const row = await config.client.getResponse({
          responseId: internal.responseId,
        });
        applyRecord(row);
        internal.error = formErrorMessage(caught, fallback);
        return;
      } catch {
        // Fall through to the original error.
      }
    }
    const nextIssues = issuesByField(caught);
    if (Object.keys(nextIssues).length > 0) {
      internal.issues = nextIssues;
      internal.error = undefined;
      return;
    }
    internal.error = formErrorMessage(caught, fallback);
  }

  async function ensureResponse() {
    if (internal.responseId) return;
    if (snapshot.status !== "active") {
      throw APIError.from("CONFLICT", FORM_ERROR_CODES.FORM_INACTIVE);
    }
    const respondentId = resolveRespondentId(config.respondentId);
    const started = await config.client.startResponse({
      formId: snapshot.id,
      ...(respondentId !== undefined ? { respondentId } : {}),
    });
    acceptStart(started);
  }

  function canMutateDraft() {
    return !isLocked(internal.status);
  }

  async function run(
    kind: FormResponsePending,
    fn: () => Promise<ResponseRecord | undefined>,
  ): Promise<ResponseRecord | undefined> {
    if (internal.pending) return undefined;
    internal.pending = kind;
    internal.error = undefined;
    emit();
    try {
      return await fn();
    } catch (caught) {
      await recover(caught, FALLBACK[kind]);
      return undefined;
    } finally {
      internal.pending = undefined;
      emit();
    }
  }

  async function saveDraft() {
    if (!canMutateDraft()) return undefined;
    return run("save", async () => {
      await ensureResponse();
      const responseId = internal.responseId;
      if (!responseId) return undefined;
      const saved = await config.client.saveDraft(
        withConcurrency(
          {
            responseId,
            answers: answersPatch(lastSaved, internal.answers),
          },
          internal.updatedAt,
        ),
      );
      applyRecord(saved);
      config.onSaved?.(saved);
      return saved;
    });
  }

  async function submit() {
    if (!canMutateDraft()) return undefined;
    return run("submit", async () => {
      const issues = collect("submit");
      if (issues.length > 0) {
        submitAttempted = true;
        writeIssues(issues);
        return undefined;
      }
      await ensureResponse();
      const responseId = internal.responseId;
      if (!responseId) return undefined;
      const submitted = await config.client.submitResponse(
        withConcurrency(
          { responseId, answers: internal.answers },
          internal.updatedAt,
        ),
      );
      applyRecord(submitted);
      submitAttempted = false;
      config.onSubmitted?.(submitted);
      return submitted;
    });
  }

  async function reopen() {
    if (!internal.responseId || !isLocked(internal.status)) return undefined;
    return run("reopen", async () => {
      const reopened = await config.client.reopenResponse(
        withConcurrency(
          { responseId: internal.responseId as string },
          internal.updatedAt,
        ),
      );
      applyRecord(reopened);
      submitAttempted = false;
      config.onReopened?.(reopened);
      return reopened;
    });
  }

  async function abandon() {
    if (!internal.responseId || !canMutateDraft()) return undefined;
    return run("abandon", async () => {
      const abandoned = await config.client.abandonResponse(
        withConcurrency(
          { responseId: internal.responseId as string },
          internal.updatedAt,
        ),
      );
      applyRecord(abandoned);
      config.onAbandoned?.(abandoned);
      return abandoned;
    });
  }

  async function refresh() {
    if (!internal.responseId) return undefined;
    return run("refresh", async () => {
      const row = await config.client.getResponse({
        responseId: internal.responseId as string,
      });
      applyRecord(row);
      return row;
    });
  }

  return {
    subscribe,
    getState,
    sync,
    setAnswer,
    setAnswers,
    field,
    validate,
    saveDraft,
    submit,
    reopen,
    abandon,
    refresh,
  };
}
