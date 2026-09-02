export type PublicMessageResponse = {
  id: string;
  content: string;
  displayLocation: string | null;
  publishedAt: Date;
  expiresAt: Date;
};

export type PublicMessagePageResponse = {
  messages: PublicMessageResponse[];
  nextCursor: string | null;
};

export type PublicReportResponse = {
  accepted: true;
};