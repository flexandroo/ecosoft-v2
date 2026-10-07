"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { FormState } from "../actions";

const MESSAGE = "Є незбережені зміни. Вийти без збереження?";

/**
 * Warns before leaving a form with unsaved edits: on reload/close (browser
 * prompt) and on clicks on in-app links. The form counts as edited after any
 * input or in-form button (add/remove/move rows) and as clean again after a
 * successful save (`state.ok`).
 */
export function useUnsavedChanges(formRef: RefObject<HTMLFormElement | null>, state: FormState) {
  const dirty = useRef(false);

  useEffect(() => {
    if (state?.ok) dirty.current = false;
  }, [state]);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const markDirty = () => {
      dirty.current = true;
    };
    const onFormClick = (event: MouseEvent) => {
      if ((event.target as Element | null)?.closest?.('button[type="button"]')) dirty.current = true;
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty.current) event.preventDefault();
    };
    const onLinkClick = (event: MouseEvent) => {
      if (!dirty.current || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!link || link.getAttribute("target") === "_blank") return;
      if (confirm(MESSAGE)) {
        dirty.current = false;
      } else {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    form.addEventListener("input", markDirty);
    form.addEventListener("change", markDirty);
    form.addEventListener("click", onFormClick);
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onLinkClick, true);
    return () => {
      form.removeEventListener("input", markDirty);
      form.removeEventListener("change", markDirty);
      form.removeEventListener("click", onFormClick);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onLinkClick, true);
    };
  }, [formRef]);
}
