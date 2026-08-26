import { getEmailAppUrl } from "../lib/email/app-url";

let pass = 0, fail = 0;
const t = (n: string, got: string, want: string) => {
  got === want ? (pass++, console.log(`  PASS  ${n} → ${got}`))
               : (fail++, console.log(`  FAIL  ${n}\n        want ${want}\n        got  ${got}`));
};
const withEnv = (env: Record<string, string | undefined>, fn: () => void) => {
  const saved = { ...process.env };
  for (const k of ["NEXT_PUBLIC_APP_URL", "VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_URL"]) delete process.env[k];
  Object.assign(process.env, env);
  try { fn(); } finally { process.env = saved as NodeJS.ProcessEnv; }
};
const PROD = "https://campusvaultgbpiet.vercel.app";

console.log("\n-- the bug that shipped localhost links --");
withEnv({ NEXT_PUBLIC_APP_URL: "http://localhost:3000" },
  () => t("localhost:3000 is rejected", getEmailAppUrl(), PROD));
withEnv({ NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000" },
  () => t("127.0.0.1 is rejected", getEmailAppUrl(), PROD));
withEnv({ NEXT_PUBLIC_APP_URL: "http://localhost:3000", VERCEL_PROJECT_PRODUCTION_URL: "campusvaultgbpiet.vercel.app" },
  () => t("falls back to platform host", getEmailAppUrl(), PROD));

console.log("\n-- normal cases --");
withEnv({ NEXT_PUBLIC_APP_URL: "https://campusvault.in" },
  () => t("real url is used", getEmailAppUrl(), "https://campusvault.in"));
withEnv({ NEXT_PUBLIC_APP_URL: "https://campusvault.in/" },
  () => t("trailing slash stripped", getEmailAppUrl(), "https://campusvault.in"));
withEnv({ NEXT_PUBLIC_APP_URL: "  https://campusvault.in  " },
  () => t("whitespace trimmed", getEmailAppUrl(), "https://campusvault.in"));
withEnv({}, () => t("unset falls back", getEmailAppUrl(), PROD));
withEnv({ NEXT_PUBLIC_APP_URL: "" }, () => t("empty falls back", getEmailAppUrl(), PROD));
withEnv({ NEXT_PUBLIC_APP_URL: "campusvault.in" },
  () => t("missing scheme rejected", getEmailAppUrl(), PROD));
withEnv({ VERCEL_URL: "campusvault-abc123.vercel.app" },
  () => t("per-deploy host used", getEmailAppUrl(), "https://campusvault-abc123.vercel.app"));

console.log(`\n=== ${pass} passed, ${fail} failed ===\n`);
process.exit(fail ? 1 : 0);
