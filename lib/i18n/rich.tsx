import { Fragment, type ReactNode } from "react";

// Fills the {name} placeholders of an already translated text with React nodes (a bold name, a link):
// richText(t("{actor} siz bilan bog'lanmoqchi"), { actor: <b>Ali</b> }). Word order follows the language.
export function richText(text: string, nodes: Record<string, ReactNode>): ReactNode {
  return text.split(/(\{\w+\})/).map((part, i) => {
    const name = /^\{(\w+)\}$/.exec(part)?.[1];
    return name && name in nodes ? <Fragment key={i}>{nodes[name]}</Fragment> : part;
  });
}
