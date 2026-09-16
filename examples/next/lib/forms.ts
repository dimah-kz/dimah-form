import { defineForm } from "@dimah-form/server";

export const forms = {
  feedback: defineForm({
    title: "Feedback",
    slug: "feedback",
    status: "active",
    description:
      "Custom `rating` type. Widgets are yours; submit validates the snapshot.",
    fields: [
      {
        id: "score",
        type: "rating",
        required: true,
        label: "How was this?",
        min: 1,
        max: 5,
      },
      {
        id: "note",
        type: "text",
        label: "Anything else?",
        maxLength: 280,
        multiline: true,
      },
    ],
  }),
};
