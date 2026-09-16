import { column, idColumn, schema, table } from "fumadb/schema";

/**
 * Live questionnaire (current definition). Old responses keep their own
 * snapshot on `response.definition` — there is no version table.
 */
const questionnaire = table("questionnaire", {
  id: idColumn("id", "varchar(255)").defaultTo$("auto"),
  slug: column("slug", "varchar(255)").unique().nullable(),
  title: column("title", "string"),
  definition: column("definition", "json"),
  status: column("status", "string"),
  createdAt: column("created_at", "timestamp").defaultTo$("now"),
  updatedAt: column("updated_at", "timestamp").defaultTo$("now"),
});

const response = table("response", {
  id: idColumn("id", "varchar(255)").defaultTo$("auto"),
  questionnaireId: column("questionnaire_id", "varchar(255)"),
  status: column("status", "string"),
  /** Definition copy at start — submit validates against this, not live. */
  definition: column("definition", "json"),
  answers: column("answers", "json"),
  submittedAt: column("submitted_at", "timestamp").nullable(),
  createdAt: column("created_at", "timestamp").defaultTo$("now"),
  updatedAt: column("updated_at", "timestamp").defaultTo$("now"),
});

export const v1 = schema({
  version: "1.0.0",
  tables: {
    questionnaire,
    response,
  },
  relations: {
    questionnaire: ({ many }) => ({
      responses: many("response"),
    }),
    response: ({ one }) => ({
      questionnaire: one("questionnaire", [
        "questionnaireId",
        "id",
      ]).foreignKey(),
    }),
  },
});
