"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Site, MonitorCheck } from "@/types";

export function useSites() {
  return useQuery<Site[]>({
    queryKey: ["sites"],
    queryFn: () => apiFetch("/api/sites"),
  });
}

export interface SiteWithChecks extends Site {
  checks: MonitorCheck[];
}

export function useSite(id: string) {
  return useQuery<SiteWithChecks>({
    queryKey: ["site", id],
    queryFn: () => apiFetch(`/api/sites/${id}`),
  });
}

export function useDeleteSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (siteId: string) =>
      apiFetch(`/api/sites/${siteId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });
}

export function useRecrawl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (siteId: string) =>
      apiFetch<{ crawlId: string }>(`/api/sites/${siteId}/recrawl`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });
}
