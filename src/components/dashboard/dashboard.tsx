"use client";

import { fakeSites } from "@/lib/fake-data";
import { Badge } from "@/components/ui/badge";
import { SiteCard } from "./site-card";

export function Dashboard() {
  const sites = fakeSites;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Your Sites</h1>
        <Badge variant="secondary">{sites.length}</Badge>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {sites.map((site, i) => (
          <div
            key={site.id}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${i * 100}ms`, animationFillMode: "backwards" }}
          >
            <SiteCard site={site} />
          </div>
        ))}
      </div>
    </div>
  );
}
