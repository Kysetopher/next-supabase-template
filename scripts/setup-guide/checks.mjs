// Works out how far docs/SETUP.md has got on this machine: one entry per
// numbered step, each with the checks the "Resuming" table in SETUP.md lists.
// Steps only the user can confirm (dashboard settings, signing in) are marked
// done with `npm run setup:mark -- <step>`, stored in .setup/progress.json
// (git-ignored: setup is per machine). Never reads secret values: the env
// check runs scripts/check-env.mjs, which prints variable names only.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const PROGRESS_FILE = join(ROOT, ".setup", "progress.json");
const SKILLS = [
  "new-table",
  "new-page",
  "new-component",
  "supabase",
  "supabase-postgres-best-practices",
  "wrangler",
  "cloudflare",
  "workers-best-practices",
];
const MCP_PLACEHOLDER = "__SUPABASE_DEV_PROJECT_REF__";

const at = (...parts) => join(ROOT, ...parts);
const read = (...parts) => {
  try {
    return readFileSync(at(...parts), "utf8");
  } catch {
    return null;
  }
};
const mtime = (...parts) => {
  try {
    return statSync(at(...parts)).mtimeMs;
  } catch {
    return 0;
  }
};

// ---------------------------------------------------------------- progress

export function readProgress() {
  try {
    return JSON.parse(readFileSync(PROGRESS_FILE, "utf8"));
  } catch {
    return { marked: {} };
  }
}

export function setMarked(step, done) {
  const progress = readProgress();
  progress.marked ??= {};
  if (done) progress.marked[step] = new Date().toISOString();
  else delete progress.marked[step];
  mkdirSync(join(ROOT, ".setup"), { recursive: true });
  writeFileSync(PROGRESS_FILE, `${JSON.stringify(progress, null, 2)}\n`);
}

// ---------------------------------------------------------------- SETUP.md

/** Splits docs/SETUP.md into its intro, the start/continue prompts and its `## N. Title` steps. */
export function parseSetup() {
  const text = read("docs", "SETUP.md") ?? "";
  const parts = text.split(/^## /m);
  const prompts = [...parts[0].matchAll(/^> (.+)$/gm)].map((m) => m[1].trim());
  const steps = [];
  const sections = [];
  for (const part of parts.slice(1)) {
    const newline = part.indexOf("\n");
    const heading = part.slice(0, newline).trim();
    const body = part.slice(newline + 1).trim();
    const numbered = heading.match(/^(\d+)\.\s+(.+)$/);
    if (numbered) {
      steps.push({
        n: Number(numbered[1]),
        title: numbered[2],
        body,
        userStep: body.includes("USER STEP"),
        optional: /\(optional|optional\b|when ready/i.test(numbered[2]),
      });
    } else {
      sections.push({ title: heading, body });
    }
  }
  return { start: prompts[0] ?? "", resume: prompts[1] ?? "", steps, sections };
}

// ---------------------------------------------------------------- checks

let envCache = { key: "", result: null };
function checkEnv() {
  if (!existsSync(at(".env.local"))) return { ok: false, detail: ".env.local doesn't exist yet" };
  const key = [".env.local", "src/lib/env.ts", "src/lib/billing/products.ts"].map((f) => mtime(f)).join(":");
  if (envCache.key === key) return envCache.result;
  const run = spawnSync(
    process.execPath,
    ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "--env-file-if-exists=.env.local", "scripts/check-env.mjs"],
    { cwd: ROOT, encoding: "utf8", timeout: 15_000 },
  );
  const output = `${run.stdout ?? ""}${run.stderr ?? ""}`.trim();
  const result =
    run.status === 0
      ? { ok: true, detail: "Environment OK." }
      : { ok: false, detail: output.split("\n").slice(0, 8).join("\n") || "check:env failed" };
  envCache = { key, result };
  return result;
}

let gitCache = { at: 0, result: null };
function checkGitClean() {
  if (Date.now() - gitCache.at < 5_000) return gitCache.result;
  let result;
  try {
    const out = execFileSync("git", ["status", "--porcelain"], { cwd: ROOT, encoding: "utf8", timeout: 10_000 });
    const changed = out.split("\n").filter(Boolean).length;
    result = { ok: changed === 0, detail: changed ? `${changed} uncommitted change${changed === 1 ? "" : "s"}` : "" };
  } catch {
    result = { ok: false, detail: "not a git repository, or git isn't installed" };
  }
  gitCache = { at: Date.now(), result };
  return result;
}

function missingPackages() {
  const pkg = JSON.parse(read("package.json") ?? "{}");
  const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  const missing = names.filter((name) => !existsSync(at("node_modules", ...name.split("/"), "package.json")));
  return { total: names.length, missing };
}

function skillsIn(folder) {
  return SKILLS.filter((s) => existsSync(at(folder, s, "SKILL.md")));
}

function playwrightChromium() {
  const dirs = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "ms-playwright"),
    join(homedir(), "Library", "Caches", "ms-playwright"),
    join(homedir(), ".cache", "ms-playwright"),
  ].filter(Boolean);
  return dirs.some((dir) => {
    try {
      return readdirSync(dir).some((d) => d.startsWith("chromium"));
    } catch {
      return false;
    }
  });
}

const item = (label, ok, detail = "") => ({ label, ok: Boolean(ok), detail });
const tool = (key, label, ok, detail = "") => ({ key, ...item(label, ok, detail) });

/** Per-step checks, keyed by the step number in docs/SETUP.md. */
function stepChecks() {
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  const deps = missingPackages();
  const types = read("src", "lib", "supabase", "types.ts") ?? "";
  const mcp = read(".mcp.json");
  const codex = read(".codex", "config.toml");
  const lastRun = (() => {
    try {
      return JSON.parse(read("test-results", ".last-run.json") ?? "null");
    } catch {
      return null;
    }
  })();
  const claudeSkills = skillsIn(".claude/skills");
  const agentSkills = skillsIn(".agents/skills");

  return {
    1: { items: [item(`Node.js 24 or newer (found v${process.versions.node})`, nodeMajor >= 24)] },
    2: {
      items: [
        item(
          "Dependencies installed (npm install)",
          existsSync(at("node_modules")) && deps.missing.length === 0,
          deps.missing.length ? `${deps.total - deps.missing.length} of ${deps.total} packages installed` : "",
        ),
      ],
    },
    3: {
      items: [
        item(`Claude Code skills (.claude/skills) — ${claudeSkills.length}/${SKILLS.length}`, claudeSkills.length === SKILLS.length),
        item(`Codex skills (.agents/skills) — ${agentSkills.length}/${SKILLS.length}`, agentSkills.length === SKILLS.length),
      ],
    },
    4: {
      items: [item(".env.local exists", existsSync(at(".env.local"))), item("npm run check:env passes", ...Object.values(checkEnv()))],
    },
    5: {
      items: [
        item("Supabase CLI linked to your project", existsSync(at("supabase", ".temp", "project-ref"))),
        item(
          "Database tables created (types include profiles, auth_email_limits, billing_customers)",
          ["profiles", "auth_email_limits", "billing_customers"].every((t) => types.includes(t)),
        ),
      ],
    },
    6: {
      manual: "Servers approved and signed in",
      items: [
        item("Dev project ref set in .mcp.json", mcp !== null && !mcp.includes(MCP_PLACEHOLDER)),
        item("Dev project ref set in .codex/config.toml", codex !== null && !codex.includes(MCP_PLACEHOLDER)),
      ],
    },
    7: { manual: "Dashboard settings changed", items: [] },
    8: {
      items: [item("App name set in src/lib/site.ts", !/name:\s*["']App["']/.test(read("src", "lib", "site.ts") ?? ""))],
    },
    9: { manual: "Payments set up, or skipped for now", items: [] },
    10: {
      manual: "typecheck, lint and smoke tests pass",
      items: [item("Last smoke-test run passed", lastRun?.status === "passed")],
    },
    11: { manual: "Signed up and tried a password reset", items: [] },
    12: { manual: "Chose not to commit yet", items: [item("Work committed (git status clean)", ...Object.values(checkGitClean()))], either: true },
  };
}

/**
 * What's installed and configured on this machine. The keys are what the docs
 * site's setup guide reads from the URL (setupGuideUrl), so keep them in step
 * with INSTALLED there.
 */
function installed() {
  return [
    tool("node", "Node.js 24+", Number(process.versions.node.split(".")[0]) >= 24, `v${process.versions.node}`),
    tool("deps", "npm packages", existsSync(at("node_modules")) && missingPackages().missing.length === 0),
    tool("supabase-cli", "Supabase CLI", existsSync(at("node_modules", "supabase", "package.json"))),
    tool("wrangler", "Wrangler (Cloudflare)", existsSync(at("node_modules", "wrangler", "package.json"))),
    tool("playwright", "Playwright browser", playwrightChromium()),
    tool("skills", "Agent skills", skillsIn(".claude/skills").length === SKILLS.length && skillsIn(".agents/skills").length === SKILLS.length),
    tool("env", ".env.local", existsSync(at(".env.local"))),
    tool("linked", "Supabase linked", existsSync(at("supabase", ".temp", "project-ref"))),
    tool("mcp", "MCP tools configured", !(read(".mcp.json") ?? MCP_PLACEHOLDER).includes(MCP_PLACEHOLDER)),
    tool("stripe", "Stripe billing", /^STRIPE_SECRET_KEY=\S/m.test(read(".env.local") ?? ""), "optional"),
  ];
}

// ---------------------------------------------------------------- status

export function getStatus() {
  const { start, resume, steps, sections } = parseSetup();
  const checks = stepChecks();
  const { marked = {} } = readProgress();

  const list = steps.map((step) => {
    const check = checks[step.n];
    if (!check) return { ...step, tracked: false, done: false, items: [], manual: null, marked: false };
    const autoOk = check.items.every((i) => i.ok);
    const isMarked = Boolean(marked[step.n]);
    const done = check.either ? autoOk || isMarked : autoOk && (!check.manual || isMarked);
    return {
      ...step,
      tracked: true,
      done,
      items: check.items,
      manual: check.manual ?? null,
      either: Boolean(check.either),
      marked: isMarked,
    };
  });

  const tracked = list.filter((s) => s.tracked);
  const current = tracked.find((s) => !s.done) ?? null;
  return {
    start,
    resume,
    sections,
    steps: list,
    installed: installed(),
    total: tracked.length,
    done: tracked.filter((s) => s.done).length,
    current: current?.n ?? null,
    complete: current === null && tracked.length > 0,
  };
}
