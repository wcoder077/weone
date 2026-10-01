const segmenter = new Intl.Segmenter("uz", { granularity: "grapheme" });

// Characters as people see them: one emoji (even 👩🏽‍💻) counts as one.
// The database mirrors this with public.grapheme_length().
export function graphemeLength(text: string) {
  return Array.from(segmenter.segment(text)).length;
}
