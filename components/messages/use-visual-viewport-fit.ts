import { useEffect, type RefObject } from "react";

// Mobile keyboards shrink the *visual* viewport but not the layout viewport, so a
// `fixed inset-0` chat would slide its header off the top while typing. This keeps
// the element exactly over the visible area (CSS vars --vv-top / --vv-height) and
// calls `onFit` after each change so the caller can keep the last message in view.
export function useVisualViewportFit(ref: RefObject<HTMLElement | null>, onFit?: () => void) {
  useEffect(() => {
    const viewport = window.visualViewport;
    const element = ref.current;
    if (!viewport || !element) return;

    function fit() {
      element?.style.setProperty("--vv-top", `${viewport?.offsetTop ?? 0}px`);
      element?.style.setProperty("--vv-height", `${viewport?.height ?? window.innerHeight}px`);
      onFit?.();
    }

    fit();
    viewport.addEventListener("resize", fit);
    viewport.addEventListener("scroll", fit);
    return () => {
      viewport.removeEventListener("resize", fit);
      viewport.removeEventListener("scroll", fit);
      element.style.removeProperty("--vv-top");
      element.style.removeProperty("--vv-height");
    };
  }, [ref, onFit]);
}
