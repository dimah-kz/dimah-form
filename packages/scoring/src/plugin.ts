import {
  createFormEndpoint,
  definePlugin,
  errors,
  type ResponseRecord,
} from "@dimah-form/server";
import { getResponseQuerySchema } from "@dimah-form/core";

import { SCORING_ERROR_CODES } from "./errors";
import { scoringMetaSchema, SCORING_NAMESPACE, type ScoringMeta } from "./meta";
import { SCORING_ROUTES } from "./routes";
import {
  hasScoringMeta,
  scoreResponse,
  scoringIssuesOrUndefined,
  type ScoreDefinition,
  type ScoreResult,
} from "./score";

export type OnScoreContext = {
  response: ResponseRecord;
  scores: ScoreResult;
  request: Request;
};

export type ScoringPluginOptions = {
  /**
   * After submit persist. Use this to write scores to your own table.
   * Does not run when the snapshot has no `meta.scoring`. Must not mutate
   * `response.answers`. Throwing fails the submit HTTP response after persist.
   */
  onScore?: (context: OnScoreContext) => void | Promise<void>;
};

/**
 * Official scoring plugin. Compute-on-read; persist scores yourself in
 * {@link ScoringPluginOptions.onScore}. Scoring is derived data — it is not
 * answer validation and does not add tables.
 */
export function scoringPlugin(options: ScoringPluginOptions = {}) {
  const onScore = options.onScore;
  return definePlugin({
    id: SCORING_NAMESPACE,
    metaNamespace: SCORING_NAMESPACE,
    $ERROR_CODES: SCORING_ERROR_CODES,
    $Meta: {} as ScoringMeta,
    metaSchema: scoringMetaSchema,
    validateDefinition: (form) =>
      scoringIssuesOrUndefined(form as ScoreDefinition),
    hooks: onScore
      ? {
          afterSubmit: async ({ response, request }) => {
            if (!hasScoringMeta(response.definition)) return;
            const scores = scoreResponse(response.definition, response.answers);
            await onScore({ response, scores, request });
          },
        }
      : undefined,
    endpoints: {
      getResponseScores: createFormEndpoint(
        SCORING_ROUTES.getResponseScores.path,
        {
          method: SCORING_ROUTES.getResponseScores.method,
          query: getResponseQuerySchema,
        },
        async (ctx): Promise<ScoreResult> => {
          const row = await ctx.context.config.database.getResponse(
            ctx.query.responseId,
          );
          if (!row) {
            throw errors.unknownResponse(ctx.query.responseId);
          }
          return scoreResponse(row.definition, row.answers);
        },
      ),
    },
  });
}
