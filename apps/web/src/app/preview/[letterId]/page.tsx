import type { Metadata } from "next";
import { ReceiverPreview } from "@/components/receiver/receiver-preview";

export const metadata: Metadata = {
  title: "Preview your letter",
  description:
    "Preview the private receiver experience for your EverDear letter.",
};

type PreviewPageProps = {
  params: Promise<{
    letterId: string;
  }>;
};

export default async function PreviewPage({
  params,
}: PreviewPageProps) {
  const { letterId } = await params;

  return <ReceiverPreview letterId={letterId} />;
}