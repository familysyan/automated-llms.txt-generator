interface PageForDiff {
  url: string;
  title: string | null;
  description: string | null;
  content_hash: string | null;
}

interface PageSummary {
  url: string;
  title: string | null;
}

interface ModifiedPage {
  url: string;
  oldTitle: string | null;
  newTitle: string | null;
  oldDescription: string | null;
  newDescription: string | null;
}

export interface DiffResult {
  added: PageSummary[];
  removed: PageSummary[];
  modified: ModifiedPage[];
  unchanged: number;
}

function normalizeUrl(href: string): string {
  try {
    const u = new URL(href);
    u.hash = "";
    if (u.pathname !== "/" && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.slice(0, -1);
    }
    u.searchParams.sort();
    return u.toString().toLowerCase();
  } catch {
    return href.toLowerCase();
  }
}

export function computeDiff(
  oldPages: PageForDiff[],
  newPages: PageForDiff[]
): DiffResult {
  const oldMap = new Map(oldPages.map((p) => [normalizeUrl(p.url), p]));
  const newMap = new Map(newPages.map((p) => [normalizeUrl(p.url), p]));

  const added: PageSummary[] = [];
  const removed: PageSummary[] = [];
  const modified: ModifiedPage[] = [];
  let unchanged = 0;

  for (const [url, newPage] of newMap) {
    const oldPage = oldMap.get(url);
    if (!oldPage) {
      added.push({ url: newPage.url, title: newPage.title });
    } else if (
      oldPage.content_hash !== newPage.content_hash ||
      oldPage.title !== newPage.title ||
      oldPage.description !== newPage.description
    ) {
      modified.push({
        url: newPage.url,
        oldTitle: oldPage.title,
        newTitle: newPage.title,
        oldDescription: oldPage.description,
        newDescription: newPage.description,
      });
    } else {
      unchanged++;
    }
  }

  for (const [url, oldPage] of oldMap) {
    if (!newMap.has(url)) {
      removed.push({ url: oldPage.url, title: oldPage.title });
    }
  }

  return { added, removed, modified, unchanged };
}
