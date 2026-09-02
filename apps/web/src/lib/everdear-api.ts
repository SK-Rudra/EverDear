export type UserRole =
  | "USER"
  | "MODERATOR"
  | "ADMIN";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerifiedAt: string | null;
  createdAt: string;
};

export type AuthenticationResponse = {
  user: AuthenticatedUser;
};

export type LetterType =
  | "LOVED"
  | "FRIEND"
  | "FAMILY";

export type LetterStatus =
  | "DRAFT"
  | "READY"
  | "PUBLISHED"
  | "REVOKED"
  | "EXPIRED";

export type LetterContent = {
  version: 1;
  body: string;
};

export type Letter = {
  id: string;
  type: LetterType;
  status: LetterStatus;
  title: string | null;
  recipientName: string;
  senderName: string;
  content: LetterContent;
  publishedAt: string | null;
  firstViewedAt: string | null;
  lastViewedAt: string | null;
  viewCount: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AttachmentType =
  | "IMAGE"
  | "VIDEO";

export type AttachmentStatus =
  | "PENDING_UPLOAD"
  | "PROCESSING"
  | "READY"
  | "FAILED";

export type LetterAttachment = {
  id: string;
  letterId: string;
  type: AttachmentType;
  status: AttachmentStatus;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  sortOrder: number;
  contentPath: string;
  createdAt: string;
  updatedAt: string;
};

export type ReceiverLetter = Pick<
  Letter,
  | "id"
  | "type"
  | "status"
  | "title"
  | "recipientName"
  | "senderName"
  | "content"
>;

export type ReceiverAttachment = Pick<
  LetterAttachment,
  | "id"
  | "type"
  | "status"
  | "originalName"
  | "mimeType"
  | "sizeBytes"
  | "width"
  | "height"
  | "durationSeconds"
  | "sortOrder"
  | "contentPath"
>;

export type PublicLetterResponse =
  ReceiverLetter & {
    publishedAt: string;
    expiresAt: string | null;
    attachments: ReceiverAttachment[];
  };

export type ShareLinkMetadata = {
  letterId: string;
  letterStatus: LetterStatus;
  tokenPrefix: string;
  expiresAt: string | null;
  revokedAt: string | null;
  lastAccessedAt: string | null;
  accessCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CreatedShareLinkResponse =
  ShareLinkMetadata & {
    token: string;
  };

export type PublicWallMessage = {
  id: string;
  content: string;
  displayLocation: string | null;
  publishedAt: string;
  expiresAt: string;
};

export type PublicWallPage = {
  messages: PublicWallMessage[];
  nextCursor: string | null;
};

export type PublicReportReason =
  | "SPAM"
  | "HARASSMENT"
  | "HATEFUL_CONTENT"
  | "SEXUAL_CONTENT"
  | "PERSONAL_INFORMATION"
  | "SELF_HARM"
  | "OTHER";

export type PublicReportResponse = {
  accepted: true;
};

export type CreateLetterInput = {
  type: LetterType;
  recipientName: string;
  senderName: string;
  title?: string;
  content?: {
    body: string;
  };
};

export type UpdateLetterInput = {
  type?: LetterType;
  recipientName?: string;
  senderName?: string;
  title?: string | null;
  content?: {
    body: string;
  };
};

type ApiRequestOptions = Omit<
  RequestInit,
  "body"
> & {
  json?: unknown;
  formData?: FormData;
};

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1"
).replace(/\/+$/, "");

export function getApiUrl(
  path: string,
): string {
  return `${apiBaseUrl}${
    path.startsWith("/") ? path : `/${path}`
  }`;
}

function getApiErrorMessage(
  body: unknown,
  fallback: string,
): string {
  if (
    typeof body !== "object" ||
    body === null ||
    !("message" in body)
  ) {
    return fallback;
  }

  const message = body.message;

  if (Array.isArray(message)) {
    return message
      .filter(
        (item): item is string =>
          typeof item === "string",
      )
      .join(" ");
  }

  return typeof message === "string"
    ? message
    : fallback;
}

export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(
    status: number,
    body: unknown,
    fallbackMessage: string,
  ) {
    super(
      getApiErrorMessage(body, fallbackMessage),
    );

    this.name = "ApiError";
    this.status = status;
    this.details = body;
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    json,
    formData,
    headers: providedHeaders,
    ...requestOptions
  } = options;

  if (
    json !== undefined &&
    formData !== undefined
  ) {
    throw new Error(
      "An API request cannot contain both JSON and form data.",
    );
  }

  const headers = new Headers(providedHeaders);

  headers.set("Accept", "application/json");

  if (json !== undefined) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  const response = await fetch(
    getApiUrl(path),
    {
      ...requestOptions,
      headers,
      body:
        formData ??
        (json === undefined
          ? undefined
          : JSON.stringify(json)),
      credentials: "include",
      cache: "no-store",
    },
  );

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      body,
      `Request failed with status ${response.status}`,
    );
  }

  return body as T;
}