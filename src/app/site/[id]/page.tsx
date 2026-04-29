import { SiteDetail } from "@/components/site-detail/site-detail";

export default async function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SiteDetail siteId={id} />;
}
