import { defineForm } from "@dimah-form/server";

export const forms = {
  onboarding: defineForm({
    title: "Onboarding",
    slug: "onboarding",
    status: "active",
    description: "Widgets are yours. Submit validates the response snapshot.",
    fields: [
      {
        id: "name",
        type: "text",
        required: true,
        label: "Name",
        minLength: 2,
        maxLength: 80,
      },
      {
        id: "email",
        type: "email",
        required: true,
        label: "Email",
      },
      {
        id: "startDate",
        type: "date",
        label: "Start date",
      },
      {
        id: "age",
        type: "number",
        label: "Age",
        description: "13–120",
        min: 13,
        max: 120,
        integer: true,
      },
      {
        id: "role",
        type: "select",
        label: "Role",
        defaultValue: "eng",
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
        description: "Shown when role is Engineer",
        showWhen: { field: "role", equals: "eng" },
      },
      {
        id: "interests",
        type: "multiSelect",
        label: "Interests",
        options: [
          { value: "forms", label: "Forms" },
          { value: "dx", label: "Developer experience" },
        ],
      },
      {
        id: "ok",
        type: "boolean",
        required: true,
        label: "I agree to the demo terms",
      },
    ],
  }),
};
