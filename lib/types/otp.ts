export type ConsentMethod =
  | "email"           // Email OTP — COPPA "email plus" method
  | "credit_card"     // Micro-transaction — future
  | "id_verification" // Government ID — future
  | "signed_form";    // Legacy checkbox — deprecated

export type OTPErrorCode =
  | "INVALID_OTP"
  | "EXPIRED"
  | "MAX_ATTEMPTS"
  | "ALREADY_USED"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "EMAIL_FAILED";

export interface OTPInitiateRequest {
  parentEmail: string;
  consentContext?: {
    monitoringLevel?: number;
    teenDisplayName?: string;
  };
}

export interface OTPInitiateResponse {
  success: boolean;
  verificationId: string;
  expiresAt: string;
  maskedEmail: string;
  error?: string;
}

export interface OTPVerifyRequest {
  verificationId: string;
  otpCode: string;
}

export interface OTPVerifyResponse {
  success: boolean;
  consentId?: string;
  attemptsRemaining?: number;
  error?: string;
  errorCode?: OTPErrorCode;
}
