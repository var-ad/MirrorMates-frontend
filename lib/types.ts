export type ResponseIdentityMode = "anonymous" | "named";

export interface ApiValidationIssues {
  formErrors?: string[];
  fieldErrors?: Record<string, string[] | undefined>;
}

export interface BackendErrorPayload {
  message: string;
  issues?: ApiValidationIssues;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: TokenPair;
}

export interface SignupPendingResponse {
  message: string;
  email: string;
  expiresInMinutes: number;
}

export interface MessageResponse {
  message: string;
}

export interface MeResponse {
  user: AuthUser;
}

export interface Adjective {
  id: number;
  word: string;
}

export interface AdjectivesResponse {
  adjectives: Adjective[];
}

export interface SessionShare {
  inviteCode: string;
  inviteUrl: string;
  qrCodeUrl: string;
  qrCodeDataUrl: string;
  inviteExpiresAt: string;
  responseIdentityMode: ResponseIdentityMode;
  requiresDisplayName: boolean;
  isExpired: boolean;
}

export interface SessionSummary {
  id: string;
  title: string;
  createdAt: string;
  inviteToken: string;
  inviteCode: string;
  inviteExpiresAt: string;
  responseIdentityMode: ResponseIdentityMode;
  requiresDisplayName: boolean;
  isInviteExpired: boolean;
  peerSubmissionCount?: number;
  share: SessionShare;
}

export interface SessionsResponse {
  sessions: SessionSummary[];
}

export interface CreateSessionInput {
  title?: string;
  adjectiveIds?: number[];
  inviteExpiresInDays?: number;
  inviteExpiresAt?: string;
  responseIdentityMode?: ResponseIdentityMode;
}

export interface CreateSessionResponse {
  session: SessionSummary;
  selfSelectionAdjectiveIds: number[];
}

export interface SessionDetailResponse {
  session: SessionSummary;
  selfSelectionAdjectiveIds: number[];
  peerSubmissionCount: number;
}

export interface SaveSelfSelectionsResponse {
  message: string;
  sessionId: string;
  selfSelectionAdjectiveIds: number[];
}

export interface InviteMeta {
  sessionId: string;
  title: string;
  ownerLabel: string;
  inviteCode: string;
  inviteExpiresAt: string;
  responseIdentityMode: ResponseIdentityMode;
  requiresDisplayName: boolean;
  inviteUrl: string;
  qrCodeUrl: string;
  qrCodeDataUrl: string;
}

export interface InviteMetaResponse {
  invite: InviteMeta;
  adjectives: Adjective[];
}

export interface InviteSubmitResponse {
  sessionId: string;
  inviteCode: string;
  submitted: boolean;
}

export interface ResultAdjective {
  adjectiveId: number;
  adjective: string;
  peerCount: number;
  peerSupportPercent: number;
  selectedBySelf: boolean;
  selectedByPeers: boolean;
}

export interface JohariWindow {
  key: "open" | "blind" | "hidden" | "unknown";
  title: string;
  subtitle: string;
  description: string;
  position: {
    row: "top" | "bottom";
    column: "left" | "right";
  };
  count: number;
  adjectives: ResultAdjective[];
}

export interface ResultsResponse {
  session: SessionSummary;
  sessionId: string;
  matrixAxes: {
    horizontal: {
      left: string;
      right: string;
    };
    vertical: {
      top: string;
      bottom: string;
    };
  };
  summary: {
    selfSelectedCount: number;
    peerSubmissionCount: number;
    peerSelectedUniqueCount: number;
    topPeerAdjectives: Array<{
      adjectiveId: number;
      adjective: string;
      count: number;
      peerSupportPercent: number;
    }>;
  };
  pools: {
    open: string[];
    blind: string[];
    hidden: string[];
    unknown: string[];
  };
  windows: JohariWindow[];
  peerCounts: Array<{
    adjectiveId: number;
    adjective: string;
    count: number;
    peerSupportPercent: number;
  }>;
}

export interface ReportCreateResponse {
  reportId: string;
  reportText: string;
  feedbackText: string;
  generatedAt: string;
  feedback: {
    text: string;
    generatedAt: string;
  };
}

export interface StoredReport {
  _id: string;
  userId: string;
  sessionId: string;
  gameType: string;
  pools: {
    open: string[];
    blind: string[];
    hidden: string[];
    unknown: string[];
  };
  prompt: string;
  reportText: string;
  createdAt: string;
  updatedAt: string;
}

export interface LatestReportResponse {
  report: StoredReport | null;
  feedback: {
    text: string;
    generatedAt: string;
  } | null;
}
