"use client";

import Image from "next/image";
import {
  type ChangeEvent,
  useEffect,
  useId,
  useState,
} from "react";
import {
  ImagePlus,
  LoaderCircle,
  Paperclip,
  Trash2,
  UploadCloud,
  Video,
} from "lucide-react";
import {
  apiRequest,
  getApiUrl,
  type LetterAttachment,
} from "@/lib/everdear-api";

type LetterAttachmentsProps = {
  letterId: string;
};

const MAX_ATTACHMENTS = 8;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 75 * 1024 * 1024;

const supportedFileTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
]);

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(
      1,
      Math.round(sizeBytes / 1024),
    )} KB`;
  }

  return `${(
    sizeBytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof Error
    ? error.message
    : fallback;
}

export function LetterAttachments({
  letterId,
}: LetterAttachmentsProps) {
  const inputId = useId();

  const [attachments, setAttachments] =
    useState<LetterAttachment[]>([]);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] = useState<
    string | null
  >(null);

  const attachmentsPath =
    `/letters/${letterId}/attachments`;

  useEffect(() => {
    const abortController =
      new AbortController();

    let active = true;

    void apiRequest<LetterAttachment[]>(
      `/letters/${letterId}/attachments`,
      {
        signal: abortController.signal,
      },
    )
      .then((loadedAttachments) => {
        if (active) {
          setAttachments(loadedAttachments);
        }
      })
      .catch((requestError: unknown) => {
        if (
          active &&
          !abortController.signal.aborted
        ) {
          setError(
            getErrorMessage(
              requestError,
              "Attachments could not be loaded.",
            ),
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
      abortController.abort();
    };
  }, [letterId]);

  const handleFileSelected = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setError(null);

    if (attachments.length >= MAX_ATTACHMENTS) {
      setError(
        `A letter can contain up to ${MAX_ATTACHMENTS} attachments.`,
      );
      return;
    }

    if (!supportedFileTypes.has(file.type)) {
      setError(
        "Choose a JPEG, PNG, WebP, GIF, MP4, or WebM file.",
      );
      return;
    }

    const isImage =
      file.type.startsWith("image/");

    const maximumSize = isImage
      ? MAX_IMAGE_SIZE_BYTES
      : MAX_VIDEO_SIZE_BYTES;

    if (file.size > maximumSize) {
      setError(
        `${isImage ? "Images" : "Videos"} must not exceed ${
          maximumSize / (1024 * 1024)
        } MB.`,
      );
      return;
    }

    const formData = new FormData();

    formData.append("file", file);

    setUploading(true);

    try {
      const uploadedAttachment =
        await apiRequest<LetterAttachment>(
          attachmentsPath,
          {
            method: "POST",
            formData,
          },
        );

      setAttachments((current) =>
        [...current, uploadedAttachment].sort(
          (first, second) =>
            first.sortOrder - second.sortOrder,
        ),
      );
    } catch (requestError: unknown) {
      setError(
        getErrorMessage(
          requestError,
          "The media file could not be uploaded.",
        ),
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (
    attachment: LetterAttachment,
  ) => {
    const confirmed = window.confirm(
      `Remove “${attachment.originalName}” from this letter?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(attachment.id);
    setError(null);

    try {
      await apiRequest<void>(
        `${attachmentsPath}/${attachment.id}`,
        {
          method: "DELETE",
        },
      );

      setAttachments((current) =>
        current.filter(
          (item) =>
            item.id !== attachment.id,
        ),
      );
    } catch (requestError: unknown) {
      setError(
        getErrorMessage(
          requestError,
          "The attachment could not be removed.",
        ),
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="mt-8 border-t border-paper-ink/10 pt-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Paperclip
              aria-hidden="true"
              className="h-4 w-4 text-paper-ink/45"
            />

            <h2 className="font-display text-xl font-bold text-paper-ink">
              Memories
            </h2>
          </div>

          <p className="mt-1 text-sm leading-6 text-paper-ink/45">
            Add pictures or short videos to this
            letter.
          </p>
        </div>

        <label
          htmlFor={inputId}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold transition ${
            uploading ||
            attachments.length >= MAX_ATTACHMENTS
              ? "cursor-not-allowed bg-paper-ink/5 text-paper-ink/30"
              : "cursor-pointer bg-paper-ink text-paper hover:-translate-y-0.5"
          }`}
        >
          {uploading ? (
            <LoaderCircle
              aria-hidden="true"
              className="h-4 w-4 animate-spin"
            />
          ) : (
            <UploadCloud
              aria-hidden="true"
              className="h-4 w-4"
            />
          )}

          {uploading
            ? "Uploading..."
            : "Add media"}
        </label>

        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
          disabled={
            uploading ||
            attachments.length >= MAX_ATTACHMENTS
          }
          onChange={(event) =>
            void handleFileSelected(event)
          }
          className="sr-only"
        />
      </div>

      {loading ? (
        <div className="mt-6 grid min-h-40 place-items-center rounded-3xl border border-dashed border-paper-ink/15 bg-paper-ink/[0.025]">
          <div className="flex items-center gap-2 text-sm font-semibold text-paper-ink/45">
            <LoaderCircle
              aria-hidden="true"
              className="h-4 w-4 animate-spin"
            />
            Loading memories...
          </div>
        </div>
      ) : attachments.length === 0 ? (
        <label
          htmlFor={inputId}
          className="mt-6 grid min-h-44 cursor-pointer place-items-center rounded-3xl border border-dashed border-paper-ink/15 bg-paper-ink/[0.025] p-6 text-center transition hover:border-paper-ink/30 hover:bg-paper-ink/[0.045]"
        >
          <span>
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-paper-ink/5">
              <ImagePlus
                aria-hidden="true"
                className="h-5 w-5 text-paper-ink/45"
              />
            </span>

            <span className="mt-3 block font-display text-lg font-bold text-paper-ink">
              Add a visual memory
            </span>

            <span className="mt-1 block text-sm text-paper-ink/45">
              Pictures up to 10 MB · Videos up
              to 75 MB
            </span>
          </span>
        </label>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {attachments.map((attachment) => {
            const contentUrl = getApiUrl(
              `/letters/${letterId}/attachments/${attachment.id}/content`,
            );

            const deleting =
              deletingId === attachment.id;

            return (
              <article
                key={attachment.id}
                className="group overflow-hidden rounded-3xl border border-paper-ink/10 bg-paper-ink/[0.035]"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-paper-ink/5">
                  {attachment.type ===
                  "IMAGE" ? (
                    <Image
                      src={contentUrl}
                      alt={attachment.originalName}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <video
                      src={contentUrl}
                      controls
                      preload="metadata"
                      aria-label={
                        attachment.originalName
                      }
                      className="h-full w-full bg-black object-contain"
                    />
                  )}

                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-md">
                    {attachment.type ===
                    "IMAGE" ? (
                      <ImagePlus className="h-3 w-3" />
                    ) : (
                      <Video className="h-3 w-3" />
                    )}

                    {attachment.type ===
                    "IMAGE"
                      ? "Picture"
                      : "Video"}
                  </span>

                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() =>
                      void handleDelete(
                        attachment,
                      )
                    }
                    aria-label={`Remove ${attachment.originalName}`}
                    className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/65 text-white backdrop-blur-md transition hover:bg-rose disabled:opacity-60"
                  >
                    {deleting ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <p className="min-w-0 truncate text-sm font-semibold text-paper-ink/75">
                    {attachment.originalName}
                  </p>

                  <span className="shrink-0 text-xs text-paper-ink/40">
                    {formatFileSize(
                      attachment.sizeBytes,
                    )}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-paper-ink/40">
        <span>
          {attachments.length} of {MAX_ATTACHMENTS}{" "}
          attachments
        </span>

        <span>
          JPEG · PNG · WebP · GIF · MP4 · WebM
        </span>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-2xl border border-rose/25 bg-rose/10 px-4 py-3 text-sm text-rose-deep"
        >
          {error}
        </div>
      )}
    </section>
  );
}