"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ComponentType,
  type ReactNode,
} from "react";

/**
 * Chrome swaps for `FormUiProvider`. Only pass keys you want to replace.
 */
export type FormUiComponents = {
  /** Required-field mark next to the label. Omit for the built-in asterisk. */
  RequiredMark?: ComponentType;
};

const defaultFormUiComponents: FormUiComponents = {};
const FormUiComponentsContext = createContext(defaultFormUiComponents);

/**
 * Chrome component overrides from the nearest `FormUiProvider`.
 * Safe without a provider (empty — callers use built-ins).
 */
export function useFormUiComponents(): FormUiComponents {
  return useContext(FormUiComponentsContext);
}

export function FormUiComponentsProvider({
  components,
  children,
}: {
  components?: FormUiComponents;
  children: ReactNode;
}) {
  const parent = useContext(FormUiComponentsContext);
  const RequiredMark = components?.RequiredMark;
  const value = useMemo(() => {
    if (!RequiredMark) return parent;
    if (parent.RequiredMark === RequiredMark) return parent;
    return { ...parent, RequiredMark };
  }, [parent, RequiredMark]);

  if (value === parent) return children;

  return (
    <FormUiComponentsContext.Provider value={value}>
      {children}
    </FormUiComponentsContext.Provider>
  );
}
