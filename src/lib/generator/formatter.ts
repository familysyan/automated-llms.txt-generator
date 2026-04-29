interface ScoredPage {
  url: string;
  title: string | null;
  description: string | null;
  importance: number;
}

interface FormatterInput {
  siteName: string;
  siteDescription: string | null;
  sections: Map<string, ScoredPage[]>;
}

export function formatLlmsTxt(input: FormatterInput): string {
  const { siteName, siteDescription, sections } = input;

  const lines: string[] = [];

  lines.push(`# ${siteName}`);
  lines.push("");

  if (siteDescription) {
    lines.push(`> ${siteDescription}`);
    lines.push("");
  }

  const optional: ScoredPage[] = [];
  const namedSections: { name: string; pages: ScoredPage[] }[] = [];

  for (const [name, pages] of sections) {
    const regular = pages.filter((p) => p.importance >= 0.2);
    const low = pages.filter((p) => p.importance < 0.2);
    optional.push(...low);

    if (regular.length > 0) {
      namedSections.push({
        name,
        pages: regular.sort((a, b) => b.importance - a.importance),
      });
    }
  }

  namedSections.sort((a, b) => {
    const maxA = Math.max(...a.pages.map((p) => p.importance));
    const maxB = Math.max(...b.pages.map((p) => p.importance));
    return maxB - maxA;
  });

  for (const section of namedSections) {
    lines.push(`## ${section.name}`);
    lines.push("");
    for (const page of section.pages) {
      const linkText = page.title || urlToLabel(page.url);
      const desc = page.description || "No description available.";
      lines.push(`- [${linkText}](${page.url}): ${desc}`);
    }
    lines.push("");
  }

  if (optional.length > 0) {
    lines.push("## Optional");
    lines.push("");
    for (const page of optional.sort((a, b) => b.importance - a.importance)) {
      const linkText = page.title || urlToLabel(page.url);
      const desc = page.description || "No description available.";
      lines.push(`- [${linkText}](${page.url}): ${desc}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim() + "\n";
}

function urlToLabel(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const last = pathname.split("/").filter(Boolean).pop() ?? pathname;
    return last.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return url;
  }
}
