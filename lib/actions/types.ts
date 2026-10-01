import type { z } from "zod";

// Result returned to useActionState. Successful actions usually redirect instead.
export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
  // Non-secret inputs echoed back so the form keeps them after an error.
  values?: Record<string, string>;
} | null;

export function fieldErrorsOf(error: z.ZodError): ActionState {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return { fieldErrors };
}
