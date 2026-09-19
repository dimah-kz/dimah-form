export type DocsSection =
  | "framework"
  | "concepts"
  | "guides"
  | "reference"
  | "examples";

export function getSection(path: string | undefined): DocsSection {
  if (!path) return "framework";
  const [dir] = path.split("/");
  if (dir === "concepts") return "concepts";
  if (dir === "guides") return "guides";
  if (dir === "reference") return "reference";
  if (dir === "examples") return "examples";
  return "framework";
}
