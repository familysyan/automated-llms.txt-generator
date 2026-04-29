interface PageRow {
  id: string;
  depth: number;
  title: string | null;
  description: string | null;
}

const DEPTH_SCORES: Record<number, number> = {
  0: 1.0,
  1: 0.8,
  2: 0.5,
  3: 0.3,
};

export function scorePage(page: PageRow): number {
  const depthScore = DEPTH_SCORES[page.depth] ?? 0.2;

  const homepageLinkBonus = page.depth <= 1 ? 0.2 : 0;

  const metadataBonus =
    page.title && page.description ? 0.1 : 0;

  return Math.min(depthScore + homepageLinkBonus + metadataBonus, 1.0);
}
