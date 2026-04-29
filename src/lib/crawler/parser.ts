import * as cheerio from "cheerio";
import { createHash } from "crypto";

export interface ParsedPage {
  title: string | null;
  description: string | null;
  canonicalUrl: string;
  contentHash: string;
  links: string[];
}

export function parsePage(html: string, url: string): ParsedPage {
  const $ = cheerio.load(html);

  const title =
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $("title").text().trim() ||
    $("h1").first().text().trim() ||
    null;

  const description =
    $('meta[property="og:description"]').attr("content")?.trim() ||
    $('meta[name="description"]').attr("content")?.trim() ||
    findFirstMeaningfulParagraph($) ||
    null;

  const canonicalUrl =
    $('link[rel="canonical"]').attr("href")?.trim() || url;

  const contentHash = computeContentHash($);

  const links = extractLinks($, url);

  return { title, description, canonicalUrl, contentHash, links };
}

function findFirstMeaningfulParagraph($: cheerio.CheerioAPI): string | null {
  let result: string | null = null;
  $("p").each((_, el) => {
    if (result) return false;
    const text = $(el).text().trim();
    if (text.length >= 50) {
      result = text.length > 200 ? text.slice(0, 200) + "…" : text;
      return false;
    }
  });
  return result;
}

function computeContentHash($: cheerio.CheerioAPI): string {
  const container = $("main").length
    ? $("main")
    : $("article").length
      ? $("article")
      : $("body");
  const text = container.text().replace(/\s+/g, " ").toLowerCase().trim();
  return createHash("sha256").update(text).digest("hex");
}

function extractLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const seen = new Set<string>();
  const links: string[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    try {
      const resolved = new URL(href, baseUrl);
      if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return;

      resolved.hash = "";
      const normalized = resolved.toString();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        links.push(normalized);
      }
    } catch {
      // invalid URL, skip
    }
  });

  return links;
}
