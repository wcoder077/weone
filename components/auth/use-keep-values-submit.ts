"use client";

import { startTransition, type FormEvent } from "react";

// Submits a useActionState action without React's automatic form reset
// (it only happens with <form action>), so typed values survive an error.
export function useKeepValuesSubmit(dispatch: (formData: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  };
}
