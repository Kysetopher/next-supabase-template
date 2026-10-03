// Mirrors this project's own skills from .claude/skills (where they're
// edited, read by Claude Code) into .agents/skills (read by Codex and other
// agents). Skills installed from elsewhere are listed in skills-lock.json and
// managed by `npx skills`, so they're left alone. Run with `npm run skills:sync`
// after adding or editing a skill. See docs/SKILLS.md.
import { cpSync, existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const SOURCE = ".claude/skills";
const TARGET = ".agents/skills";

const locked = existsSync("skills-lock.json")
  ? Object.keys(JSON.parse(readFileSync("skills-lock.json", "utf8")).skills ?? {})
  : [];

const own = readdirSync(SOURCE, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !locked.includes(entry.name))
  .filter((entry) => existsSync(join(SOURCE, entry.name, "SKILL.md")))
  .map((entry) => entry.name);

for (const name of own) {
  rmSync(join(TARGET, name), { recursive: true, force: true });
  cpSync(join(SOURCE, name), join(TARGET, name), { recursive: true });
}

console.log(`Synced ${own.length} project skill(s) to ${TARGET}: ${own.join(", ") || "none"}.`);
