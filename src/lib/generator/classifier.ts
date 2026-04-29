export interface ClassifiablePage {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  depth: number;
}

const SECTION_MAP: Record<string, string> = {
  docs: "Documentation",
  documentation: "Documentation",
  doc: "Documentation",
  blog: "Blog",
  posts: "Blog",
  news: "Blog",
  api: "API Reference",
  reference: "API Reference",
  guides: "Guides",
  guide: "Guides",
  tutorials: "Guides",
  tutorial: "Guides",
  about: "About",
  team: "About",
  company: "About",
  pricing: "Pricing",
  plans: "Pricing",
  faq: "Support",
  help: "Support",
  support: "Support",
  changelog: "Changelog",
  releases: "Changelog",
  "whats-new": "Changelog",
  legal: "Legal",
  privacy: "Legal",
  terms: "Legal",
};

export function classifyPages(
  pages: ClassifiablePage[],
  seedUrl: string
): Map<string, ClassifiablePage[]> {
  const seedPath = new URL(seedUrl).pathname.replace(/\/$/, "");
  const sections = new Map<string, ClassifiablePage[]>();

  for (const page of pages) {
    try {
      const path = new URL(page.url).pathname.replace(/\/$/, "");

      if (path === "" || path === "/" || path === seedPath || path === "/index") {
        continue;
      }

      const segments = path.split("/").filter(Boolean);
      const firstSegment = segments[0]?.toLowerCase() ?? "";

      let section = SECTION_MAP[firstSegment];
      if (!section) {
        section =
          firstSegment.charAt(0).toUpperCase() +
          firstSegment.slice(1).replace(/-/g, " ");
      }
      if (!section || section.length === 0) {
        section = "General";
      }

      const list = sections.get(section) ?? [];
      list.push(page);
      sections.set(section, list);
    } catch {
      const list = sections.get("General") ?? [];
      list.push(page);
      sections.set("General", list);
    }
  }

  return sections;
}
