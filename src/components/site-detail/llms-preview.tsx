"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Copy, Download, RefreshCw, Loader2 } from "lucide-react";

interface LlmsPreviewProps {
  llmsTxt: string;
  isRecrawling?: boolean;
  onRecrawl?: () => void;
}

export function LlmsPreview({ llmsTxt, isRecrawling, onRecrawl }: LlmsPreviewProps) {
  const [text, setText] = useState(llmsTxt);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "llms.txt";
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("llms.txt downloaded");
  };

  return (
    <Card>
      <CardHeader className="sticky top-14 z-10 bg-card pb-3 border-b rounded-t-lg">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" size="sm" disabled={isRecrawling} onClick={onRecrawl}>
            {isRecrawling ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {isRecrawling ? "Crawling…" : "Re-crawl"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs defaultValue="preview">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="raw">Raw</TabsTrigger>
          </TabsList>
          <TabsContent value="preview">
            <div className="rounded-md border bg-muted/30 p-6 space-y-1">
              {text.split("\n").map((line, i) => {
                if (line.startsWith("# "))
                  return <h1 key={i} className="text-2xl font-bold mt-0">{line.slice(2)}</h1>;
                if (line.startsWith("## "))
                  return <h2 key={i} className="text-lg font-semibold mt-5 mb-1">{line.slice(3)}</h2>;
                if (line.startsWith("> "))
                  return <blockquote key={i} className="border-l-2 border-primary pl-4 italic text-muted-foreground my-2">{line.slice(2)}</blockquote>;
                if (line.startsWith("- [")) {
                  const match = line.match(/^- \[(.+?)\]\((.+?)\)(?:: (.+))?$/);
                  if (match) {
                    return (
                      <div key={i} className="flex items-baseline gap-2 py-0.5">
                        <span className="text-muted-foreground">•</span>
                        <span className="text-primary font-medium">{match[1]}</span>
                        {match[3] && <span className="text-muted-foreground text-sm">{match[3]}</span>}
                      </div>
                    );
                  }
                }
                if (line.trim() === "") return <div key={i} className="h-2" />;
                return <p key={i} className="my-1 text-sm">{line}</p>;
              })}
            </div>
          </TabsContent>
          <TabsContent value="raw">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full min-h-[400px] rounded-md border bg-muted/30 p-4 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
              spellCheck={false}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
