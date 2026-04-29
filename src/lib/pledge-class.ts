/**
 * Utilities for ordering fraternity pledge-class labels chronologically.
 *
 * Supported label formats (case-insensitive, whitespace/apostrophes ignored):
 *   "Spring 23", "Fall 2023", "Summer 24", "Winter '22"
 *   "Sp23", "SU23", "F24", "W22"
 *   "2023"
 *
 * Anything else is considered unparseable and sorts after all parseable
 * labels (then by case-insensitive string).
 *
 * Season ordering within a year: Spring < Summer < Fall < Winter.
 */

const SEASON_ORDER: Record<string, number> = {
  spring: 0,
  sp: 0,
  summer: 1,
  su: 1,
  fall: 2,
  autumn: 2,
  f: 2,
  winter: 3,
  w: 3,
};

export type PledgeClassRank = {
  parsed: boolean;
  year: number;
  season: number;
  label: string;
};

const UNPARSED_YEAR = Number.POSITIVE_INFINITY;

export function pledgeClassRank(label: string | null | undefined): PledgeClassRank {
  const raw = (label ?? "").trim();
  if (!raw) return { parsed: false, year: UNPARSED_YEAR, season: 0, label: "" };
  const s = raw.replace(/['\u2019]/g, "").replace(/\s+/g, " ").toLowerCase();

  // season + year: "spring 23", "fall 2023"
  const seasonWordMatch = s.match(
    /^(spring|summer|fall|autumn|winter|sp|su|f|w)\s*(\d{2,4})$/,
  );
  if (seasonWordMatch) {
    const season = SEASON_ORDER[seasonWordMatch[1]] ?? 99;
    const year = normalizeYear(parseInt(seasonWordMatch[2], 10));
    return { parsed: true, year, season, label: raw };
  }
  // pure 4-digit year
  const yearOnly = s.match(/^(\d{4})$/);
  if (yearOnly) {
    return {
      parsed: true,
      year: parseInt(yearOnly[1], 10),
      season: 0,
      label: raw,
    };
  }
  return { parsed: false, year: UNPARSED_YEAR, season: 0, label: raw };
}

function normalizeYear(y: number): number {
  if (y < 100) {
    // Two-digit years: assume 2000-2099 range. Adjust the pivot if you want
    // to support labels from the 1900s (unlikely for active pledge classes).
    return 2000 + y;
  }
  return y;
}

/**
 * Compare two pledge-class labels chronologically.
 * Returns a negative number if a is earlier, positive if later, 0 if equal.
 * Unparseable labels compare equal to each other lexicographically and
 * sort after all parseable labels.
 */
export function comparePledgeClass(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  const ra = pledgeClassRank(a);
  const rb = pledgeClassRank(b);
  if (ra.parsed !== rb.parsed) return ra.parsed ? -1 : 1;
  if (ra.year !== rb.year) return ra.year - rb.year;
  if (ra.season !== rb.season) return ra.season - rb.season;
  return ra.label.toLowerCase().localeCompare(rb.label.toLowerCase());
}

/**
 * True iff pledge class `a` is strictly earlier than `b`.
 * If either side is missing (null/empty) or unparseable on both sides,
 * returns false — the caller should treat such cases as incomparable.
 */
export function isEarlierPledgeClass(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const ra = pledgeClassRank(a);
  const rb = pledgeClassRank(b);
  if (!ra.parsed || !rb.parsed) return false;
  if (ra.year !== rb.year) return ra.year < rb.year;
  return ra.season < rb.season;
}

export function isLaterPledgeClass(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  return isEarlierPledgeClass(b, a);
}
