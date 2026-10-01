"use client";

import { createContext, useContext, type FocusEvent, type ReactNode } from "react";
import { useScrollDirection } from "./use-scroll-direction";

type BarsVisibility = {
  hidden: boolean;
  revealOnKeyboardFocus: (event: FocusEvent<HTMLElement>) => void;
};

const BarsContext = createContext<BarsVisibility>({ hidden: false, revealOnKeyboardFocus: () => {} });

// One scroll listener for both bars, so they always move together.
export function BarsVisibilityProvider({ children }: { children: ReactNode }) {
  const value = useScrollDirection();
  return <BarsContext.Provider value={value}>{children}</BarsContext.Provider>;
}

export function useBarsVisibility() {
  return useContext(BarsContext);
}
