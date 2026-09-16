import {
  sqliteTable,
  text,
  blob,
  integer,
  foreignKey,
} from "drizzle-orm/sqlite-core";
import { defineRelations } from "drizzle-orm";

export const questionnaire = sqliteTable("questionnaire", {
  id: text("id", { length: 255 })
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug", { length: 255 }).unique(),
  title: text("title").notNull(),
  definition: blob("definition", { mode: "json" }).notNull(),
  status: text("status").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .defaultNow(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .defaultNow(),
});

export const response = sqliteTable(
  "response",
  {
    id: text("id", { length: 255 })
      .primaryKey()
      .notNull()
      .$defaultFn(() => crypto.randomUUID()),
    questionnaireId: text("questionnaire_id", { length: 255 }).notNull(),
    status: text("status").notNull(),
    definition: blob("definition", { mode: "json" }).notNull(),
    answers: blob("answers", { mode: "json" }).notNull(),
    respondentId: text("respondent_id", { length: 255 }),
    submittedAt: integer("submitted_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .defaultNow(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.questionnaireId],
      foreignColumns: [questionnaire.id],
      name: "response_questionnaire_questionnaire_fk",
    })
      .onUpdate("restrict")
      .onDelete("restrict"),
  ],
);

export const private_dimah_form_settings = sqliteTable(
  "private_dimah_form_settings",
  {
    id: text("id", { length: 255 }).primaryKey().notNull(),
    version: text("version", { length: 255 }).notNull().default("1.0.0"),
  },
);

export const relations = defineRelations(
  { questionnaire, response, private_dimah_form_settings },
  (r) => ({
    questionnaire: {
      responses: r.many.response({
        alias: "response_questionnaire",
      }),
    },
    response: {
      questionnaire: r.one.questionnaire({
        from: r.response.questionnaireId,
        to: r.questionnaire.id,
        alias: "response_questionnaire",
      }),
    },
  }),
);
