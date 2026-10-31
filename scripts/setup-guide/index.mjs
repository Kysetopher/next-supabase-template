// The live setup guide is the template's Getting Started page on the docs
// site. This script works out this machine's progress (checks.mjs) and puts it
// in that page's URL after the `#`, which browsers never send to the server;
// the page reads it and ticks off steps, highlights the current one and shows
// what's installed. The agent opens the URL in its preview pane and opens it
// again after each step, so the page follows along. Node's standard library
// only, so it runs before `npm install`.
//
//   node scripts/setup-guide/index.mjs status        print progress (npm run setup:status)
//   node scripts/setup-guide/index.mjs url [doing]   print the guide URL (npm run -s setup:url -- "Installing packages")
//   node scripts/setup-guide/index.mjs mark 7        mark a user-confirmed step done (npm run setup:mark -- 7)
//   node scripts/setup-guide/index.mjs unmark 7      undo that
//   node scripts/setup-guide/index.mjs hook          Claude Code SessionStart hook (.claude/settings.json)
import { getStatus, setMarked } from "./checks.mjs";

export const GUIDE_PAGE = "https://docs-dusky-theta.vercel.app/spaces/next-supabase-template/getting-started";
const [command = "status", ...args] = process.argv.slice(2);

/**
 * The guide URL for the current state: `#setup=1&of=12&done=1,2,3&now=4&have=node,deps&doing=…`.
 * `doing` is an optional short note of what the agent is working on right now.
 */
export function setupGuideUrl(status, doing = "") {
  const params = new URLSearchParams({
    setup: "1",
    of: String(status.total),
    done: status.steps.filter((s) => s.tracked && s.done).map((s) => s.n).join(","),
    now: status.current ? String(status.current) : "",
    have: status.installed.filter((i) => i.ok).map((i) => i.key).join(","),
  });
  if (doing.trim()) params.set("doing", doing.trim().slice(0, 120));
  return `${GUIDE_PAGE}#${params.toString().replace(/%2C/g, ",")}`;
}

function summary(status) {
  if (status.complete) return `Setup complete: all ${status.total} steps done.`;
  const current = status.steps.find((s) => s.n === status.current);
  return `Setup: ${status.done} of ${status.total} steps done. Next: step ${current.n}, ${current.title}.`;
}

function printStatus() {
  const status = getStatus();
  console.log(summary(status));
  for (const step of status.steps) {
    const box = !step.tracked ? "[-]" : step.done ? "[x]" : "[ ]";
    const here = step.n === status.current ? "  <- next" : "";
    console.log(` ${box} ${step.n}. ${step.title}${here}`);
    if (step.tracked && !step.done) {
      for (const i of step.items.filter((i) => !i.ok)) console.log(`       - missing: ${i.label}${i.detail ? ` (${i.detail.split("\n")[0]})` : ""}`);
      if (step.manual && !step.marked) console.log(`       - to confirm with the user, then \`npm run setup:mark -- ${step.n}\`: ${step.manual}`);
    }
  }
  console.log(`Live guide: ${setupGuideUrl(status)}`);
}

function mark(done) {
  const n = Number(args[0]);
  const step = getStatus().steps.find((s) => s.n === n && s.tracked);
  if (!step) {
    console.error(`No setup step ${args[0] ?? ""}. Usage: npm run setup:${done ? "" : "un"}mark -- <step number>`);
    process.exit(1);
  }
  setMarked(n, done);
  const status = getStatus();
  console.log(`${done ? "Marked" : "Unmarked"} step ${n}. ${summary(status)}`);
  console.log(`Live guide: ${setupGuideUrl(status)}`);
}

// SessionStart hook: while setup is unfinished, tells the agent to open the
// guide and say where setup stands. Prints nothing once setup is complete.
function hook() {
  let status;
  try {
    status = getStatus();
  } catch {
    return;
  }
  if (status.complete || status.total === 0) return;
  const context = [
    `This project's setup (docs/SETUP.md) is not finished. ${summary(status)}`,
    "At the start of this session, before anything else:",
    `1. Open the live setup guide for the user: ${setupGuideUrl(status)}`,
    "   In the Claude desktop app, open it in the browser pane beside the chat (preview_start with that `url`). Elsewhere, give the user the link to open in their browser.",
    "2. Tell the user in one or two lines which step they're on and how far along they are, and offer to continue (following docs/SETUP.md). Don't start setup work until they say so.",
    'While doing setup, keep the guide in step: when you start a step, and after finishing one, run `npm run -s setup:url -- "<what you are doing, a few words>"` and navigate the browser pane to the URL it prints (only the part after # changes, so the page updates in place). After the user confirms a step that can\'t be checked from here, first run `npm run setup:mark -- <step>`. `npm run setup:status` prints progress as text.',
  ].join("\n");
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: context } }));
}

const commands = {
  status: printStatus,
  url: () => console.log(setupGuideUrl(getStatus(), args.join(" "))),
  mark: () => mark(true),
  unmark: () => mark(false),
  hook,
};
if (!commands[command]) {
  console.error(`Unknown command "${command}". Use: status, url [doing], mark <step>, unmark <step>, hook.`);
  process.exit(1);
}
commands[command]();
