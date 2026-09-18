export type DocsSection = "framework" | "core" | "server" | "db" | "react";

export function getSection(path: string | undefined): DocsSection {
  if (!path) return "framework";
  const [dir] = path.split("/");
  if (dir === "core") return "core";
  if (dir === "server") return "server";
  if (dir === "db") return "db";
  if (dir === "react") return "react";
  return "framework";
}
