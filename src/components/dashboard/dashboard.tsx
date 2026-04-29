"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSites, useDeleteSite, useRecrawl } from "@/hooks/use-sites";
import { Badge } from "@/components/ui/badge";
import { SiteCard } from "./site-card";
import { Loader2 } from "lucide-react";

export function Dashboard() {
  const { data: sites, isLoading } = useSites();
  const deleteSite = useDeleteSite();
  const recrawl = useRecrawl();
  const [recrawlingIds, setRecrawlingIds] = useState<Set<string>>(new Set());

  const handleRecrawl = async (siteId: string) => {
    setRecrawlingIds((prev) => new Set(prev).add(siteId));
    try {
      await recrawl.mutateAsync(siteId);
      toast.success("Crawl completed");
    } catch {
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setRecrawlingIds((prev) => {
        const next = new Set(prev);
        next.delete(siteId);
        return next;
      });
    }
  };

  const handleDelete = async (siteId: string) => {
    try {
      await deleteSite.mutateAsync(siteId);
      toast.success("Site deleted");
    } catch {
      toast.error("Something went wrong. Please try again later.");
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

  const siteList = sites ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Your Sites</h1>
        <Badge variant="secondary">{siteList.length}</Badge>
      </div>
      {siteList.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {siteList.map((site, i) => (
            <div
              key={site.id}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${i * 100}ms`, animationFillMode: "backwards" }}
            >
              <SiteCard
                site={site}
                isRecrawling={recrawlingIds.has(site.id)}
                onRecrawl={handleRecrawl}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
      </div>
      <h2 className="text-lg font-semibold">No sites yet</h2>
      <p className="mt-1 text-sm text-muted-foreground">Generate your first llms.txt to get started.</p>
      <a href="/" className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
        Generate llms.txt
      </a>
    </div>
  );
}
