---
packages:
  group:dimah-form: major
---

### Align dataset, insights, and file answers with one scoring document

`@dimah-form/dataset` and `@dimah-form/insights` depend on `@dimah-form/scoring`. Import the isomorphic helpers from `@dimah-form/scoring/document` (`readScoringFormMeta`, `readScoringFieldMeta`, `tryScoreResponse`). A scoring validation error on one historical row omits scores. Any other error propagates.

`snapshotKey` is SHA-256 of RFC 8785 canonical JSON. Existing keys change.

`file` is a built-in field type. Answers are metadata (`id`, `url`, `name`, `contentType`, `size`) and cannot include inline bytes. Dataset `attachment` is set only for `type: "file"`. There is no built-in file widget.

`toDataPackage()` uses the Frictionless tabular data package profile. The `responses.csv` schema includes `primaryKey`, quote dialect, and codebook constraints.

Plugin `on*` / `after*` hooks receive `getPluginContext`. Insights day series takes an IANA `timeZone` (default `UTC`) and returns it on `series`. Crosstab axes are categorical per response snapshot. A non-categorical live field no longer rejects the query.
