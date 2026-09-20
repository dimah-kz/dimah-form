import { defineAppForm, type AppForm } from "./define";

const gad7Options = [
  { value: "0", label: "Not at all", meta: { scoring: { points: 0 } } },
  { value: "1", label: "Several days", meta: { scoring: { points: 1 } } },
  {
    value: "2",
    label: "More than half the days",
    meta: { scoring: { points: 2 } },
  },
  { value: "3", label: "Nearly every day", meta: { scoring: { points: 3 } } },
];

function gad7Item(id: string, label: string) {
  return {
    id,
    type: "select" as const,
    required: true,
    label,
    options: gad7Options,
    meta: {
      widget: "radio" as const,
      scoring: { variable: "gad7" },
    },
  };
}

export const gad7Form = defineAppForm({
  title: "GAD-7",
  slug: "gad7",
  status: "active",
  description:
    "Over the last 2 weeks, how often have you been bothered by the following problems? Screening score only — not a diagnosis.",
  meta: {
    submitLabel: "See my score",
    scoring: {
      variables: [
        {
          id: "gad7",
          label: "GAD-7",
          min: 0,
          max: 21,
        },
      ],
      bands: [
        { variable: "gad7", from: 0, to: 4, label: "Minimal" },
        { variable: "gad7", from: 5, to: 9, label: "Mild" },
        { variable: "gad7", from: 10, to: 14, label: "Moderate" },
        { variable: "gad7", from: 15, to: 21, label: "Severe" },
      ],
    },
  },
  fields: [
    gad7Item("q1", "Feeling nervous, anxious, or on edge"),
    gad7Item("q2", "Not being able to stop or control worrying"),
    gad7Item("q3", "Worrying too much about different things"),
    gad7Item("q4", "Trouble relaxing"),
    gad7Item("q5", "Being so restless that it is hard to sit still"),
    gad7Item("q6", "Becoming easily annoyed or irritable"),
    gad7Item("q7", "Feeling afraid as if something awful might happen"),
  ],
} satisfies AppForm);
