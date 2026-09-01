"use client";

import Image from "next/image";
import type {  ReceiverAttachment } from "@/lib/everdear-api";

export type ReceiverVariant =
  | "loved"
  | "friend"
  | "family";

type ReceiverMediaGalleryProps = {
  attachments: ReceiverAttachment[];
  variant: ReceiverVariant;
  getContentUrl: (
    attachment: ReceiverAttachment,
  ) => string;
};

function getFigureClass(
  variant: ReceiverVariant,
  index: number,
): string {
  switch (variant) {
    case "loved":
      return index === 0
        ? "sm:col-span-2"
        : "";

    case "friend":
      return index % 2 === 0
        ? "sm:-rotate-1 hover:rotate-0"
        : "sm:rotate-1 hover:rotate-0";

    case "family":
      return "border-8 border-[#fffdf6] shadow-[0_18px_45px_rgba(60,72,52,0.15)]";
  }
}

function getGridClass(
  variant: ReceiverVariant,
): string {
  switch (variant) {
    case "loved":
      return "grid gap-4 sm:grid-cols-2";

    case "friend":
      return "grid gap-6 sm:grid-cols-2";

    case "family":
      return "grid gap-5 sm:grid-cols-2 lg:grid-cols-3";
  }
}

export function ReceiverMediaGallery({
  attachments,
  variant,
  getContentUrl,
}: ReceiverMediaGalleryProps) {
  const readyAttachments = attachments.filter(
    (attachment) =>
      attachment.status === "READY",
  );

  if (readyAttachments.length === 0) {
    return null;
  }

  return (
    <div className={getGridClass(variant)}>
      {readyAttachments.map(
        (attachment, index) => (
          <figure
            key={attachment.id}
            className={`overflow-hidden rounded-[1.5rem] border border-current/10 bg-white/35 transition duration-500 ${getFigureClass(
              variant,
              index,
            )}`}
          >
            <div
              className={`relative overflow-hidden ${
                variant === "loved" && index === 0
                  ? "aspect-[16/10]"
                  : "aspect-[4/3]"
              }`}
            >
              {attachment.type === "IMAGE" ? (
                <Image
                  src={getContentUrl(attachment)}
                  alt={attachment.originalName}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover transition duration-700 hover:scale-[1.025]"
                />
              ) : (
                <video
                  src={getContentUrl(attachment)}
                  controls
                  preload="metadata"
                  aria-label={
                    attachment.originalName
                  }
                  className="h-full w-full bg-black object-contain"
                />
              )}
            </div>

            <figcaption className="truncate px-4 py-3 text-xs font-semibold opacity-50">
              {attachment.originalName}
            </figcaption>
          </figure>
        ),
      )}
    </div>
  );
}