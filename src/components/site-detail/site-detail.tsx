"use client";

import { getSiteById, getMonitorChecks } from "@/lib/fake-data";
import { LlmsPreview } from "./llms-preview";
import { MonitorPanel } from "./monitor-panel";

interface SiteDetailProps {
  siteId: string;
}

export function SiteDetail({ siteId }: SiteDetailProps) {
  const site = getSiteById(siteId);

  if (!site) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center sm:px-6">
        <h1 className="text-2xl font-semibold">Site not found</h1>
        <p className="mt-2 text-muted-foreground">The site you're looking for doesn't exist.</p>
      </div>
    );
  }

  const checks = site.monitor ? getMonitorChecks(site.monitor.id) : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{site.name ?? new URL(site.url).hostname}</h1>
        <p className="mt-1 font-mono text-sm text-muted-foreground">{site.url}</p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <LlmsPreview llmsTxt={site.lastCrawl?.llmsTxt ?? ""} />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <MonitorPanel site={site} checks={checks} />
        </div>
      </div>
    </div>
  );
}
