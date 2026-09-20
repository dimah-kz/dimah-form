import { createDefineForm } from "@dimah-form/server";
import type { FormDefinitionUi } from "@dimah-form/ui/types";

import { fieldTypes } from "./field-types";

const defineAppForm = createDefineForm({ fieldTypes });

export const forms = {
  feedback: defineAppForm({
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
  } satisfies FormDefinitionUi<typeof fieldTypes>),
  onboarding: defineAppForm({
    title: "Onboarding",
    slug: "onboarding",
    status: "active",
    description:
      "Stepped wizard. Next validates the current page; submit uses the snapshot.",
    meta: {
      submitLabel: "Finish onboarding",
      steps: {
        "1": "About you",
        "2": "Work",
        "3": "Setup",
        "4": "Confirm",
      },
    },
    fields: [
      {
        id: "fullName",
        type: "text",
        required: true,
        label: "Full name",
        minLength: 2,
        maxLength: 80,
        meta: { step: 1, placeholder: "Ada Lovelace", width: "half" },
      },
      {
        id: "email",
        type: "email",
        required: true,
        label: "Work email",
        meta: { step: 1, width: "half" },
      },
      {
        id: "city",
        type: "text",
        label: "City",
        meta: { step: 1, placeholder: "Optional" },
      },
      {
        id: "role",
        type: "select",
        required: true,
        label: "Role",
        defaultValue: "eng",
        meta: { step: 2, widget: "radio" },
        options: [
          {
            value: "eng",
            label: "Engineer",
            meta: { description: "Builds the product" },
          },
          { value: "pm", label: "Product" },
          { value: "ops", label: "Operations" },
        ],
      },
      {
        id: "team",
        type: "text",
        label: "Team",
        description: "Shown when role is Engineer",
        showWhen: { field: "role", equals: "eng" },
        meta: { step: 2, placeholder: "Platform" },
      },
      {
        id: "startDate",
        type: "date",
        required: true,
        label: "Start date",
        meta: { step: 3 },
      },
      {
        id: "tracks",
        type: "multiSelect",
        label: "What do you want to set up first?",
        meta: { step: 3, widget: "chips" },
        options: [
          { value: "api", label: "API" },
          { value: "ui", label: "UI" },
          { value: "db", label: "Database" },
        ],
      },
      {
        id: "apiNote",
        type: "text",
        label: "Which API surface?",
        showWhen: { field: "tracks", includes: "api" },
        meta: { step: 3 },
      },
      {
        id: "hours",
        type: "number",
        label: "Hours this week",
        min: 0,
        max: 40,
        integer: true,
        meta: { step: 3, suffix: "h", help: "Whole hours only" },
      },
      {
        id: "ok",
        type: "boolean",
        required: true,
        label: "I can be contacted about this setup",
        unsetOnOff: true,
        meta: { step: 4, widget: "switch" },
      },
      {
        id: "notes",
        type: "text",
        label: "Anything we should know?",
        maxLength: 280,
        meta: { step: 4, multiline: true },
      },
    ],
  } satisfies FormDefinitionUi<typeof fieldTypes>),
};
