import { defineAppForm, type AppForm } from "./define";

const likert = [
  { value: "0", label: "Not at all", meta: { scoring: { points: 0 } } },
  { value: "1", label: "A little", meta: { scoring: { points: 1 } } },
  { value: "2", label: "Mostly", meta: { scoring: { points: 2 } } },
  { value: "3", label: "Completely", meta: { scoring: { points: 3 } } },
];

function pulseItem(id: string, label: string) {
  return {
    id,
    type: "select" as const,
    required: true,
    label,
    options: likert,
    meta: {
      widget: "radio" as const,
      step: 2,
      scoring: { variable: "pulse" },
    },
  };
}

/** Canonical demo form: Likert scoring, `showWhen`, and a custom `rating` field. */
export const pulseForm = defineAppForm({
  title: "Weekly pulse",
  slug: "pulse",
  status: "active",
  description:
    "How this week felt. Four scored items, then a star rating that is stored but not scored. The total is computed from this snapshot — it is never written into answers.",
  meta: {
    submitLabel: "Submit check-in",
    steps: {
      "1": "You",
      "2": "This week",
    },
    scoring: {
      variables: [
        {
          id: "pulse",
          label: "Pulse",
          min: 0,
          max: 12,
        },
      ],
      bands: [
        { variable: "pulse", from: 0, to: 3, label: "Needs attention" },
        { variable: "pulse", from: 4, to: 6, label: "Mixed" },
        { variable: "pulse", from: 7, to: 9, label: "On track" },
        { variable: "pulse", from: 10, to: 12, label: "Strong" },
      ],
    },
  },
  fields: [
    {
      id: "name",
      type: "text",
      required: true,
      label: "Name",
      minLength: 2,
      maxLength: 80,
      meta: {
        step: 1,
        width: "half",
        placeholder: "Ada Lovelace",
        autocomplete: "name",
      },
    },
    {
      id: "role",
      type: "select",
      required: true,
      label: "Role",
      meta: { step: 1, width: "half", widget: "radio" },
      options: [
        { value: "eng", label: "Engineer" },
        { value: "pm", label: "Product" },
        { value: "design", label: "Design" },
      ],
    },
    {
      id: "team",
      type: "text",
      label: "Team",
      description: "Shown when role is Engineer.",
      showWhen: { field: "role", equals: "eng" },
      meta: { step: 1, placeholder: "Platform" },
    },
    pulseItem("clarity", "Work was clear this week"),
    pulseItem("pace", "The pace felt sustainable"),
    pulseItem("support", "I got the support I needed"),
    pulseItem("energy", "I had energy left at the end of the day"),
    {
      id: "overall",
      type: "rating",
      required: true,
      label: "Overall, how was this week?",
      min: 1,
      max: 5,
      meta: { step: 2 },
    },
    {
      id: "note",
      type: "text",
      label: "Anything else?",
      maxLength: 280,
      meta: { step: 2, multiline: true, rows: 3 },
    },
  ],
} satisfies AppForm);

export const PULSE_FORM_ID = "pulse";
