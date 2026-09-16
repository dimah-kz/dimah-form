import { defineForm } from "@dimah-form/core";

export const forms = {
  onboarding: defineForm({
    title: "Onboarding",
    slug: "onboarding",
    status: "active",
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
        label: "Work email",
      },
      {
        id: "age",
        type: "number",
        label: "Age",
        min: 13,
        max: 120,
        integer: true,
      },
      {
        id: "role",
        type: "select",
        label: "Role",
        options: [
          { value: "eng", label: "Engineer" },
          { value: "pm", label: "Product" },
          { value: "design", label: "Design" },
        ],
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
