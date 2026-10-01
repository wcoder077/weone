"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

// Free-text list (languages, interests). Enter or comma adds a tag;
// each tag is submitted as a repeated `name` field.
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

  function add() {
    const value = draft.trim().slice(0, 40);
    if (value && !tags.includes(value) && tags.length < max) setTags([...tags, value]);
    setDraft("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
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
      <Input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={add}
        placeholder={placeholder}
        disabled={tags.length >= max}
      />
    </div>
  );
}
