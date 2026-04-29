"use client";

import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { CrawlProgressEvent, Crawl } from "@/types";

interface CrawlState {
  crawlId: string | null;
  pages: CrawlProgressEvent[];
  pagesFound: number;
  currentDepth: number;
  isComplete: boolean;
  totalPages: number;
  elapsed: number;
  result: Crawl | null;
  error: string | null;
}

export function useCrawl() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<CrawlState>({
    crawlId: null,
    pages: [],
    pagesFound: 0,
    currentDepth: 0,
    isComplete: false,
    totalPages: 0,
    elapsed: 0,
    result: null,
    error: null,
  });
  const eventSourceRef = useRef<EventSource | null>(null);

  const startCrawl = useCallback(async (url: string) => {
    setState({
      crawlId: null,
      pages: [],
      pagesFound: 0,
      currentDepth: 0,
      isComplete: false,
      totalPages: 0,
      elapsed: 0,
      result: null,
      error: null,
    });

    try {
      const { crawlId } = await apiFetch<{ crawlId: string; siteId: string }>(
        "/api/crawl",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        }
      );

      setState((prev) => ({ ...prev, crawlId }));

      const es = new EventSource(`/api/crawl/${crawlId}/progress`);
      eventSourceRef.current = es;

      es.addEventListener("page", (e) => {
        const page: CrawlProgressEvent = JSON.parse(e.data);
        setState((prev) => {
          if (prev.pages.some((p) => p.url === page.url)) return prev;
          return { ...prev, pages: [...prev.pages, page] };
        });
      });

      es.addEventListener("progress", (e) => {
        const { pagesFound, currentDepth } = JSON.parse(e.data);
        setState((prev) => ({ ...prev, pagesFound, currentDepth }));
      });

      es.addEventListener("complete", async (e) => {
        const { totalPages, elapsed } = JSON.parse(e.data);
        es.close();
        eventSourceRef.current = null;

        const crawl = await apiFetch<Crawl>(`/api/crawl/${crawlId}`);
        setState((prev) => ({
          ...prev,
          isComplete: true,
          totalPages,
          elapsed,
          result: crawl,
        }));
        queryClient.invalidateQueries({ queryKey: ["sites"] });
      });

      es.addEventListener("error", () => {
        es.close();
        eventSourceRef.current = null;
        setState((prev) => ({
          ...prev,
          error: "Something went wrong. Please try again later.",
        }));
      });
    } catch {
      setState((prev) => ({
        ...prev,
        error: "Something went wrong. Please try again later.",
      }));
    }
  }, []);

  const cancel = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setState((prev) => ({ ...prev, isComplete: true }));
  }, []);

  const reset = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setState({
      crawlId: null,
      pages: [],
      pagesFound: 0,
      currentDepth: 0,
      isComplete: false,
      totalPages: 0,
      elapsed: 0,
      result: null,
      error: null,
    });
  }, []);

  return { ...state, startCrawl, cancel, reset };
}
