"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, XCircle, X } from "lucide-react";
import type { CrawlProgressEvent } from "@/types";

interface CrawlProgressProps {
  url: string;
  pages: CrawlProgressEvent[];
  totalEstimate: number;
  onCancel: () => void;
}

export function CrawlProgress({ url, pages, totalEstimate, onCancel }: CrawlProgressProps) {
  const progressPct = totalEstimate > 0 ? (pages.length / totalEstimate) * 100 : 0;

  return (
    <div className="py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="font-mono text-sm text-muted-foreground truncate">{url}</span>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Crawl Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{pages.length} pages crawled</span>
              <span>~{totalEstimate} estimated</span>
            </div>
            <Progress value={progressPct} />
          </div>

          <div className="max-h-80 overflow-y-auto space-y-1 rounded-md border p-3">
            {pages.map((page, i) => (
              <div
                key={page.url}
                className="flex items-center gap-3 py-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {page.status === "done" && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />}
                {page.status === "crawling" && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}
                {page.status === "error" && <XCircle className="h-4 w-4 shrink-0 text-destructive" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {page.title ?? page.url}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground truncate">
                    {page.url}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 text-xs">
                  depth {page.depth}
                </Badge>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex gap-6 text-sm text-muted-foreground">
              <span><span className="font-semibold text-foreground">{pages.length}</span> pages found</span>
              <span><span className="font-semibold text-foreground">{Math.max(...pages.map(p => p.depth), 0)}</span> max depth</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
