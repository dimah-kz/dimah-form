import { defineClientPlugin } from "@dimah-form/core";
import { createFormEndpoint, definePlugin } from "@dimah-form/server";

export const demoPlugin = definePlugin({
  id: "demo",
  endpoints: {
    ping: createFormEndpoint(
      "/ping",
      { method: "GET", metadata: { operation: "ping" } },
      async () => ({ ok: true as const, plugin: "demo" }),
    ),
  },
});

export const demoClient = defineClientPlugin({
  id: "demo",
  endpoints: ({ $fetch }) => ({
    ping: () =>
      $fetch<{ ok: true; plugin: string }>("/ping", { method: "GET" }),
  }),
});
