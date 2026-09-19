const INVALID_CONTROL = "[aria-invalid=true]";
const INVALID_FIELD = "[data-invalid=true]";
const NESTED_CONTROL =
  "input, textarea, button, [tabindex]:not([tabindex='-1'])";

/** Focus (and scroll to) the first invalid control under `root`. */
export function focusInvalidField(root: ParentNode): boolean {
  const control = root.querySelector<HTMLElement>(INVALID_CONTROL);
  const field = root.querySelector<HTMLElement>(INVALID_FIELD);
  const target =
    control ?? field?.querySelector<HTMLElement>(NESTED_CONTROL) ?? field;
  if (!target) return false;
  target.focus();
  target.scrollIntoView({ block: "nearest", inline: "nearest" });
  return true;
}

/** Wait for the session re-render after `submit()` before focusing. */
export function scheduleFocusInvalidField(root: ParentNode) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      focusInvalidField(root);
    });
  });
}
