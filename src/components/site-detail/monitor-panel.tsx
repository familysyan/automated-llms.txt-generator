"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ChevronDown, ChevronRight, Plus, Minus, Pencil } from "lucide-react";
import type { Site, MonitorCheck } from "@/types";

interface MonitorPanelProps {
  site: Site;
  checks: MonitorCheck[];
}

export function MonitorPanel({ site, checks }: MonitorPanelProps) {
  const [active, setActive] = useState(site.monitor?.active ?? false);
  const [interval, setInterval] = useState(site.monitor?.interval ?? "daily");
  const [webhookUrl, setWebhookUrl] = useState(site.monitor?.webhookUrl ?? "");

  const handleSave = () => {
    toast.success("Monitor saved");
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Monitor Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Enable monitoring</label>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Check interval</label>
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value as "hourly" | "daily" | "weekly")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Webhook URL</label>
            <input
              type="text"
              placeholder="https://hooks.example.com/notify"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button className="w-full" onClick={handleSave}>
            Save
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Change History</CardTitle>
        </CardHeader>
        <CardContent>
          {checks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No checks yet.</p>
          ) : (
            <div className="relative border-l-2 border-border pl-6 space-y-6">
              {checks.map((check) => (
                <CheckEntry key={check.id} check={check} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function CheckEntry({ check }: { check: MonitorCheck }) {
  const [expanded, setExpanded] = useState(false);

  const date = new Date(check.checkedAt);
  const timeStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="relative">
      <div className="absolute -left-[31px] top-0.5 h-3 w-3 rounded-full border-2 border-background bg-border" />
      <div>
        <div
          className={`flex items-center gap-2 ${check.hasChanges ? "cursor-pointer" : ""}`}
          onClick={() => check.hasChanges && setExpanded(!expanded)}
        >
          {check.hasChanges && (
            expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          )}
          <span className="text-sm text-muted-foreground">{timeStr}</span>
          {check.hasChanges ? (
            <span className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3.5 w-3.5" />
              Changes detected
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">No changes</span>
          )}
        </div>
        {expanded && check.diff && (
          <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
            <div className="flex gap-2 flex-wrap">
              {check.diff.added.length > 0 && (
                <Badge className="gap-1 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                  <Plus className="h-3 w-3" />
                  {check.diff.added.length} added
                </Badge>
              )}
              {check.diff.removed.length > 0 && (
                <Badge className="gap-1 bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
                  <Minus className="h-3 w-3" />
                  {check.diff.removed.length} removed
                </Badge>
              )}
              {check.diff.modified.length > 0 && (
                <Badge className="gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                  <Pencil className="h-3 w-3" />
                  {check.diff.modified.length} modified
                </Badge>
              )}
              <Badge variant="secondary">
                {check.diff.unchanged} unchanged
              </Badge>
            </div>
            <div className="rounded-md border bg-muted/30 p-3 space-y-1 text-sm font-mono">
              {check.diff.added.map((p) => (
                <div key={p.url} className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <Plus className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{p.title ?? p.url}</span>
                </div>
              ))}
              {check.diff.removed.map((p) => (
                <div key={p.url} className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <Minus className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{p.title ?? p.url}</span>
                </div>
              ))}
              {check.diff.modified.map((p) => (
                <div key={p.url} className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <Pencil className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{p.oldTitle} → {p.newTitle}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
