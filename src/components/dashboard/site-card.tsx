"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, RefreshCw, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { Site } from "@/types";

interface SiteCardProps {
  site: Site;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function MonitorBadge({ site }: { site: Site }) {
  if (!site.monitor) {
    return (
      <Badge variant="secondary" className="gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
        Not monitored
      </Badge>
    );
  }
  if (site.monitor.lastChangeAt) {
    return (
      <Badge variant="outline" className="gap-1.5 text-amber-600 dark:text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Changes detected
      </Badge>
    );
  }
  return (
    <Badge variant="default" className="gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
      Monitoring ({site.monitor.interval})
    </Badge>
  );
}

export function SiteCard({ site }: SiteCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <CardTitle className="truncate">{site.name ?? new URL(site.url).hostname}</CardTitle>
            <p className="mt-1 truncate font-mono text-sm text-muted-foreground">{site.url}</p>
          </div>
          <MonitorBadge site={site} />
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        {site.lastCrawl && (
          <p className="text-sm text-muted-foreground">
            Last crawl: {timeAgo(site.lastCrawl.completedAt ?? site.lastCrawl.startedAt)} · {site.lastCrawl.pagesFound} pages
          </p>
        )}
      </CardContent>
      <Separator />
      <CardFooter className="gap-1 px-4 py-2">
        <Link href={`/site/${site.id}`}>
          <Button variant="ghost" size="sm">
            <ExternalLink className="h-4 w-4" />
            View
          </Button>
        </Link>
        <Button variant="ghost" size="sm">
          <RefreshCw className="h-4 w-4" />
          Re-crawl
        </Button>
        <div className="flex-1" />
        <div className="relative group">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          <div className="absolute right-0 top-full z-10 hidden w-40 rounded-md border bg-popover p-1 shadow-md group-focus-within:block">
            <button className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
              <Pencil className="h-4 w-4" />
              Edit monitor
            </button>
            <button className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent">
              <Trash2 className="h-4 w-4" />
              Delete site
            </button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
