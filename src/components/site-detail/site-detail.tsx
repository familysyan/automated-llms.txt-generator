"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSite } from "@/hooks/use-sites";
import { apiFetch } from "@/lib/api";
import { LlmsPreview } from "./llms-preview";
import { MonitorPanel } from "./monitor-panel";
import { Loader2 } from "lucide-react";

interface SiteDetailProps {
  siteId: string;
}

export function SiteDetail({ siteId }: SiteDetailProps) {
  const { data: site, isLoading } = useSite(siteId);
  const [isRecrawling, setIsRecrawling] = useState(false);

  const handleRecrawl = async () => {
    setIsRecrawling(true);
    try {
      await apiFetch(`/api/sites/${siteId}/recrawl`, { method: "POST" });
      toast.success("Crawl completed");
    } catch {
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsRecrawling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center sm:px-6">
        <h1 className="text-2xl font-semibold">Site not found</h1>
        <p className="mt-2 text-muted-foreground">The site you&apos;re looking for doesn&apos;t exist.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 min-w-0">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl truncate">{site.name ?? new URL(site.url).hostname}</h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground truncate sm:text-sm">{site.url}</p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <LlmsPreview llmsTxt={site.lastCrawl?.llmsTxt ?? ""} isRecrawling={isRecrawling} onRecrawl={handleRecrawl} />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <MonitorPanel checks={site.checks} />
        </div>
      </div>
    </div>
  );
}
