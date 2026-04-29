"use client";

import { useState } from "react";
import { UrlInput } from "./url-input";
import { CrawlProgress } from "./crawl-progress";
import { LlmsResult } from "./llms-result";
import { useCrawl } from "@/hooks/use-crawl";

export function Home() {
  const crawl = useCrawl();
  const [url, setUrl] = useState("");

  const handleGenerate = (submittedUrl: string) => {
    setUrl(submittedUrl);
    crawl.startCrawl(submittedUrl);
  };

  const handleReset = () => {
    setUrl("");
    crawl.reset();
  };

  const isCrawling = crawl.crawlId !== null && !crawl.isComplete && !crawl.error;
  const hasResult = crawl.isComplete && crawl.result;
  const isInput = !crawl.crawlId && !crawl.error;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      {isInput && <UrlInput onGenerate={handleGenerate} />}

      {isCrawling && (
        <CrawlProgress
          url={url}
          pages={crawl.pages}
          totalEstimate={Math.max(crawl.pagesFound, crawl.pages.length)}
          onCancel={crawl.cancel}
        />
      )}

      {hasResult && (
        <LlmsResult
          url={url}
          llmsTxt={crawl.result!.llmsTxt ?? ""}
          pagesFound={crawl.totalPages}
          elapsed={crawl.elapsed}
          onRecrawl={handleReset}
        />
      )}

      {crawl.error && (
        <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">{crawl.error}</p>
            <button
              onClick={handleReset}
              className="text-sm text-primary underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
