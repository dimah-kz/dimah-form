import { defineForm } from "@dimah-form/server";
import type { FormDefinitionUi } from "@dimah-form/ui";

export const forms = {
  feedback: defineForm({
    title: "Feedback",
    slug: "feedback",
    status: "active",
    description:
      "Built-in fields plus one custom rating. Submit validates the snapshot.",
    fields: [
      {
        id: "name",
        type: "text",
        required: true,
        label: "Name",
        minLength: 2,
        maxLength: 80,
        meta: { placeholder: "Ada Lovelace" },
      },
      {
        id: "email",
        type: "email",
        required: true,
        label: "Email",
      },
      {
        id: "usedOn",
        type: "date",
        label: "Date you tried it",
      },
      {
        id: "role",
        type: "select",
        label: "Role",
        defaultValue: "eng",
        meta: { widget: "radio" },
        options: [
          {
            value: "eng",
            label: "Engineer",
            meta: { description: "Builds the product" },
          },
          { value: "pm", label: "Product" },
          { value: "design", label: "Design" },
        ],
      },
      {
        id: "team",
        type: "text",
        label: "Team",
        description: "Shown when role is Engineer",
        showWhen: { field: "role", equals: "eng" },
      },
      {
        id: "score",
        type: "rating",
        required: true,
        label: "How was this?",
        min: 1,
        max: 5,
      },
      {
        id: "hours",
        type: "number",
        label: "Hours spent",
        description: "0–40",
        min: 0,
        max: 40,
        integer: true,
        meta: { suffix: "h", help: "Whole hours only" },
      },
      {
        id: "highlights",
        type: "multiSelect",
        label: "What stood out?",
        meta: { widget: "chips" },
        options: [
          { value: "api", label: "API" },
          { value: "dx", label: "Developer experience" },
          { value: "docs", label: "Docs" },
        ],
      },
      {
        id: "apiNote",
        type: "text",
        label: "Which API felt rough?",
        showWhen: { field: "highlights", includes: "api" },
      },
      {
        id: "ok",
        type: "boolean",
        required: true,
        label: "This is my own feedback",
        unsetOnOff: true,
        meta: { widget: "switch" },
      },
      {
        id: "note",
        type: "text",
        label: "Anything else?",
        maxLength: 280,
        meta: { multiline: true },
      },
    ],
  } satisfies FormDefinitionUi),
};
