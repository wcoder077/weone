"use client";

import { useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Free-text list (languages, interests). The "Qo'shish" button, Enter or a comma
// adds a tag; each tag is submitted as a repeated `name` field. Commas are also
// split on input because Android keyboards don't report the comma key.
export function TagInput({
  id,
  name,
  initial,
  placeholder,
  max = 15,
}: {
  id: string;
  name: string;
  initial: string[];
  placeholder: string;
  max?: number;
}) {
  const [tags, setTags] = useState(initial);
  const [draft, setDraft] = useState("");

  function addAll(values: string[]) {
    const next = [...tags];
    for (const raw of values) {
      const value = raw.trim().slice(0, 40);
      if (value && !next.includes(value) && next.length < max) next.push(value);
    }
    setTags(next);
    setDraft("");
  }

  const add = () => addAll([draft]);

  function onChange(value: string) {
    if (!value.includes(",")) return setDraft(value);
    const parts = value.split(",");
    addAll(parts.slice(0, -1));
    setDraft(parts.at(-1) ?? "");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !draft && tags.length) {
      setTags(tags.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag}>
              <input type="hidden" name={name} value={tag} />
              <span className="border-border bg-surface inline-flex h-9 items-center gap-1 rounded-full border pr-1 pl-3 text-[14px]">
                {tag}
                <button
                  type="button"
                  aria-label={`${tag} — olib tashlash`}
                  onClick={() => setTags(tags.filter((t) => t !== tag))}
                  className="text-muted hover:text-text inline-flex size-7 items-center justify-center rounded-full"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={add}
          placeholder={placeholder}
          enterKeyHint="done"
          disabled={tags.length >= max}
        />
        <Button
          type="button"
          variant="outline"
          className="h-11 shrink-0"
          onClick={add}
          disabled={!draft.trim() || tags.length >= max}
        >
          <Plus data-icon="inline-start" />
          Qo&apos;shish
        </Button>
      </div>
    </div>
  );
}
