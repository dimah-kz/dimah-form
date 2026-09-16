type Hook<Context> = (context: Context) => Promise<void> | void;

/**
 * Compose hooks into one that awaits each in order.
 * `undefined` entries are skipped.
 */
export function chainHooks<Context>(
  ...hooks: (Hook<Context> | undefined)[]
): ((context: Context) => Promise<void>) | undefined {
  const present = hooks.filter((hook): hook is Hook<Context> => hook != null);
  if (present.length === 0) return undefined;
  return async (context) => {
    for (const hook of present) {
      await hook(context);
    }
  };
}
