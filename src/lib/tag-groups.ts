export type TagGroup = { tags: string[]; label: string };

/**
 * Collapses tags that are purely numeric and form a consecutive run (e.g.
 * zip codes 94203, 94204, 94205) into a single "94203–94205" group instead of
 * one entry per value — a search that pulled a whole zip range shouldn't
 * render as dozens of individual tags/chips. Falls back to one group per tag,
 * unchanged, the moment any tag isn't a clean non-negative integer string —
 * this only ever fires for genuinely numeric identifiers like zip, not
 * arbitrary text tags. Grouping is display-only: callers' own underlying
 * value stays a flat array of individual tags.
 */
export function groupConsecutiveTags(tags: string[]): TagGroup[] {
  const parsed = tags.map((tag) => ({ tag, num: /^\d+$/.test(tag) ? Number(tag) : null }));
  if (parsed.some(({ num }) => num === null) || parsed.length === 0) {
    return tags.map((tag) => ({ tags: [tag], label: tag }));
  }

  // Deduplicate and sort numbers numerically
  const sorted = Array.from(new Map(parsed.map((item) => [item.num, item.tag])).entries())
    .map(([num, tag]) => ({ num: num as number, tag }))
    .sort((a, b) => a.num - b.num);

  if (sorted.length === 1) {
    return [{ tags: [sorted[0].tag], label: sorted[0].tag }];
  }

  const first = sorted[0].tag;
  const last = sorted[sorted.length - 1].tag;

  return [
    {
      tags: sorted.map((s) => s.tag),
      label: `${first}–${last}`,
    },
  ];
}
