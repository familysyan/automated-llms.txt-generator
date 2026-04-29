"use client";

import { useState } from "react";
import { UrlInput } from "./url-input";
import { CrawlProgress } from "./crawl-progress";
import { LlmsResult } from "./llms-result";
import { fakeCrawlProgress, fakeSites } from "@/lib/fake-data";
import type { CrawlProgressEvent } from "@/types";

type Phase = "input" | "crawling" | "result";

export function Home() {
  const [phase, setPhase] = useState<Phase>("input");
  const [url, setUrl] = useState("");
  const [pages, setPages] = useState<CrawlProgressEvent[]>([]);

  const handleGenerate = (submittedUrl: string) => {
    setUrl(submittedUrl);
    setPhase("crawling");
    setPages([]);

    let i = 0;
    const interval = setInterval(() => {
      if (i < fakeCrawlProgress.length) {
        const page = fakeCrawlProgress[i];
        i++;
        setPages((prev) => [...prev, page]);
      } else {
        clearInterval(interval);
        setTimeout(() => setPhase("result"), 500);
      }
    }, 400);
  };

  const handleCancel = () => {
    setPhase("result");
  };

  const handleReset = () => {
    setPhase("input");
    setUrl("");
    setPages([]);
  };

  const sampleSite = fakeSites[0];
  const llmsTxt = sampleSite.lastCrawl?.llmsTxt ?? "";

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      {phase === "input" && <UrlInput onGenerate={handleGenerate} />}

      {phase === "crawling" && (
        <CrawlProgress
          url={url}
          pages={pages}
          totalEstimate={fakeCrawlProgress.length}
          onCancel={handleCancel}
        />
      )}

      {phase === "result" && (
        <LlmsResult
          url={url}
          llmsTxt={llmsTxt}
          pagesFound={sampleSite.lastCrawl?.pagesFound ?? 0}
          elapsed={12}
          onRecrawl={handleReset}
        />
      )}
    </div>
  );
}
