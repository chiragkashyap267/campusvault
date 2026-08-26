import { buildEmailHtml, buildEmailText, buildUnsubscribeUrl, decodeUnsubscribeToken, escapeHtml } from "../lib/email/template";
import { htmlToPlainText } from "../lib/email/sender";

let pass = 0, fail = 0;
const t = (n: string, c: boolean, extra = "") => {
  c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n} ${extra}`));
};
const STRUCTURAL = /<\/?(table|tr|td|div|p|a|body|html|span)\b/i;

console.log("\n-- Unsubscribe token round-trip --");
const url = buildUnsubscribeUrl("https://campusvaultgbpiet.vercel.app/", "Student.Name+tag@Gmail.COM");
console.log("  url:", url);
const token = new URL(url).searchParams.get("u")!;
t("decodes back to normalized email", decodeUnsubscribeToken(token) === "student.name+tag@gmail.com", `got ${decodeUnsubscribeToken(token)}`);
t("rejects garbage token", decodeUnsubscribeToken("!!!notbase64!!!") === null);
t("rejects non-email payload", decodeUnsubscribeToken(Buffer.from("hello").toString("base64url")) === null);
t("no double slash in url", !url.replace("https://", "").includes("//"), url);

console.log("\n-- HTML escaping (injection safety) --");
const dirty = buildEmailHtml({
  firstName: "<script>alert(1)</script>",
  headline: 'Papers & "Notes" <b>',
  message: "Line one\nLine two & more",
  ctaUrl: "https://example.com/r?a=1&b=2",
  unsubscribeUrl: "https://example.com/u?u=x",
});
t("script tag escaped", !dirty.includes("<script>"));
t("ampersand escaped in headline", dirty.includes("Papers &amp;"));
t("newline became <br>", dirty.includes("Line one<br>Line two"));
t("cta url present", dirty.includes("https://example.com/r?a=1&amp;b=2"));
t("unsubscribe link rendered", dirty.includes("Unsubscribe from these emails"));
t("uses table layout not flex", dirty.includes("<table") && !dirty.includes("display:flex"));
t("no <style> block (gmail strips them)", !dirty.includes("<style"));

console.log("\n-- Plain-text part --");
const opts = {
  firstName: "Chirag",
  headline: "This week's new resources",
  message: "Line one\nLine two",
  ctaUrl: "https://example.com/r?a=1&b=2",
  unsubscribeUrl: "https://example.com/u?u=x",
};
const text = buildEmailText(opts);
t("greets", text.startsWith("Hi Chirag,"));
t("contains headline", text.includes("This week's new resources"));
t("contains cta url", text.includes("https://example.com"));
t("contains unsubscribe", text.includes("Unsubscribe: https://example.com/u?u=x"));
t("no html tags", !/<[a-z]/i.test(text), text.slice(0, 200));

console.log("\n-- htmlToPlainText fallback --");
// Uses clean input. The `dirty` html above contains a literal "<script>" the
// USER typed; that correctly survives into text/plain as inert literal text
// and must not be stripped.
const derived = htmlToPlainText(buildEmailHtml(opts));
t("strips structural markup", !STRUCTURAL.test(derived), derived.slice(0, 200));
t("literal user text survives (inert in text/plain)", htmlToPlainText(dirty).includes("<script>alert(1)</script>"));
t("keeps link target visible", derived.includes("https://example.com/r?a=1&b=2"), derived.slice(0, 300));
t("no leftover entities", !derived.includes("&amp;") && !derived.includes("&nbsp;"));
t("non-empty", derived.length > 40);

console.log("\n-- escapeHtml --");
t("escapes all five", escapeHtml(`<>&"'`) === "&lt;&gt;&amp;&quot;&#39;", escapeHtml(`<>&"'`));
t("handles null", escapeHtml(null) === "");

console.log(`\n=== ${pass} passed, ${fail} failed ===\n`);
process.exit(fail ? 1 : 0);
