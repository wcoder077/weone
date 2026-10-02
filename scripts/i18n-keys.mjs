// Lists every UI text in the code (the Uzbek source strings used as translation keys) and
// checks that en.ts and ru.ts translate them all.
//   node scripts/i18n-keys.mjs          print missing translations, exit 1 if any
//   node scripts/i18n-keys.mjs --all    print every key with its files
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const SKIP_DIRS = ["lib/i18n", "lib/types"];
const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(e.name) && !SKIP_DIRS.some((d) => p.includes(d))) out.push(p);
  }
  return out;
};

// Attributes that never carry text.
const NON_TEXT_ATTR = /^(className|href|src|type|id|name|key|role|rel|target|autoComplete|inputMode|htmlFor|value|variant|size|side|align|d|viewBox|fill|stroke|style|accept|method|action|loading|width|height|min|max|step|pattern|lang|tabIndex|form|slot|as|render|mode|data-.*|aria-(describedby|current|hidden|live|haspopup|controls|orientation|sort|expanded|pressed|checked|selected))$/;
const NON_TEXT_CALL = /^(createClient|from|select|eq|neq|in|is|not|order|rpc|channel|on|get|set|has|includes|startsWith|endsWith|replace|split|test|matches|closest|querySelector|addEventListener|removeEventListener|dispatchEvent|getItem|setItem|require|revalidatePath|redirect|cn|clsx|cva|append|json|parse|safeParse|trim|useRef|useState|setAttribute|getAttribute|dispatch|cookies|headers|writeText|push|fetch|match|indexOf|join|label)$/;

function keyOf(node) {
  if (ts.isTemplateExpression(node)) {
    const used = new Set();
    let key = node.head.text;
    node.templateSpans.forEach((sp, i) => {
      let name = ts.isIdentifier(sp.expression) ? sp.expression.text : ts.isPropertyAccessExpression(sp.expression) ? sp.expression.name.text : "v" + i;
      while (used.has(name)) name += "_";
      used.add(name);
      key += `{${name}}` + sp.literal.text;
    });
    return key;
  }
  return node.text;
}

const found = new Map(); // key -> Set(files)
const add = (key, file) => {
  if (!found.has(key)) found.set(key, new Set());
  found.get(key).add(file);
};

for (const file of ["app", "components", "lib"].flatMap((d) => walk(path.join(ROOT, d)))) {
  const rel = path.relative(ROOT, file);
  const src = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  (function visit(n) {
    const isStr = ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateExpression(n);
    if (isStr) {
      const p = n.parent;
      const inT = ts.isCallExpression(p) && p.expression.getText() === "t" && p.arguments[0] === n;
      let skip =
        ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isLiteralTypeNode(p) || ts.isCaseClause(p) || ts.isEnumMember(p) || ts.isElementAccessExpression(p) ||
        (ts.isJsxAttribute(p) && NON_TEXT_ATTR.test(p.name.getText())) ||
        (ts.isPropertyAssignment(p) && p.name === n) ||
        (ts.isBinaryExpression(p) && /^(===|!==|==|!=)$/.test(p.operatorToken.getText())) ||
        (ts.isCallExpression(p) && !inT && NON_TEXT_CALL.test(p.expression.getText().split(".").pop())) ||
        ts.isNewExpression(p);
      if (!skip || inT) {
        const key = keyOf(n);
        const plain = key.replace(/\{\w+\}/g, "");
        const bare = key.replace(/^\{\w+\}\s*/, "");
        // UI text: a capitalized sentence/word, or lowercase text with apostrophes / quotes.
        const textLike =
          /\p{L}/u.test(plain) &&
          ((/^\p{Lu}/u.test(bare) && (/\s/.test(key.trim()) || /^\p{Lu}[\p{L}']*$/u.test(key))) || /[«»…’]|\w'\w/.test(key));
        const codeLike = /^\s|\n/.test(key) || /\w_\w/.test(plain); // SQL, class lists, code
        if ((inT ? /\p{L}/u.test(plain) : textLike && !codeLike) && !/^(we1?|WeOne)$/.test(key.trim())) add(key, rel); // t("...") is always a UI text
      }
    } else if (ts.isJsxText(n)) {
      // Already wrapped by the codemod; nothing left in JSX text.
    }
    ts.forEachChild(n, visit);
  })(sf);
}

const load = (name) => {
  const text = fs.readFileSync(path.join(ROOT, "lib/i18n", `${name}.ts`), "utf8");
  return new Set([...text.matchAll(/^\s*("(?:[^"\\]|\\.)*"):/gm)].map((m) => JSON.parse(m[1])));
};

// Not texts to translate: the page-title template and database values.
const IGNORE = new Set(["%s · we1", "   · we1", "Design", "Product", "Programming", "Tools", "Other", "DELETE", "INSERT", "UPDATE", "K", "M"]);
// Texts the scan cannot see (built from parts or typed in lowercase) but that are shown to people.
for (const k of [
  "{name} bilan bog'landi",
  "Yo'liga qo'shdi: {v0}",
  "{skill_name} ko'nikmangizni isbotlang",
  "Salom! Siz bilan bog'lanmoqchiman.",
  "Avval kamida {min} ta ko'nikma tanlang (2-qadam).",
]) add(k, "(built in code)");
const keys = [...found.keys()].filter((k) => !IGNORE.has(k)).sort();
if (process.argv.includes("--all")) {
  for (const k of keys) console.log(JSON.stringify(k), "  ", [...found.get(k)].slice(0, 2).join(", "));
  console.log(`\n${keys.length} keys`);
  process.exit(0);
}
let missing = 0;
for (const lang of ["en", "ru"]) {
  const have = load(lang);
  const lacking = keys.filter((k) => !have.has(k));
  if (lacking.length) {
    missing += lacking.length;
    console.log(`\n${lang}: ${lacking.length} missing`);
    for (const k of lacking) console.log("  ", JSON.stringify(k), "  ", [...found.get(k)][0]);
  }
}
console.log(missing ? `\n${missing} missing translations` : `all ${keys.length} texts are translated`);
process.exit(missing ? 1 : 0);
