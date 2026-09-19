-- Recommended secondary indexes. FumaDB `generate` / `migrate` does not emit
-- these. Run after the questionnaire + response tables exist.

CREATE INDEX IF NOT EXISTS questionnaire_status_updated_at_idx
  ON questionnaire (status, updated_at);

CREATE INDEX IF NOT EXISTS response_questionnaire_id_updated_at_idx
  ON response (questionnaire_id, updated_at);

CREATE INDEX IF NOT EXISTS response_respondent_id_updated_at_idx
  ON response (respondent_id, updated_at);

CREATE INDEX IF NOT EXISTS response_draft_lookup_idx
  ON response (questionnaire_id, respondent_id, status, updated_at);
