// Backend error messages used in phone/WhatsApp dialog error handling.
// Keep in sync with user-management-service gRPC status messages.
export const BACKEND_ERRORS = {
  ACTION_FAILED: "action failed",
  PHONE_NOT_VALID: "phone not valid",
  PHONE_ALREADY_TAKEN: "phone number already taken",
  PHONE_ALREADY_VERIFIED: "phone number already verified",
  NO_PHONE_TO_EDIT: "user has no phone number to edit",
  WHATSAPP_UNAVAILABLE: "WhatsApp is not configured",
  SEND_FAILED: "failed to send verification code",
  TOO_MANY_ATTEMPTS: "too many attempts, phone number removed",
  CODE_EXPIRED: "verification code expired",
  INVALID_CODE: "invalid verification code",
  RATE_LIMITED: "too many phone verification attempts, try again later",
  RECIPIENT_NOT_ALLOWED:
    "phone number not enabled to receive WhatsApp messages",
} as const;

// logRequestFailure records why a request failed — where it happened, the HTTP status and the
// message the backend sent — and deliberately not the error itself.
//
// An axios error carries the request that produced it: config.headers holds the Authorization
// bearer of the signed-in participant, and config.data holds the body, which in the phone
// dialogs is their number or the verification code they just received. Passing that object to
// the console publishes all of it to anything reading the browser log, and none of it helps
// diagnose the failure.
export const logRequestFailure = (context: string, error: unknown): void => {
  const response = (
    error as { response?: { status?: number; data?: { error?: string } } }
  )?.response;

  if (response !== undefined) {
    console.error(`${context} failed`, {
      status: response.status,
      error: response.data?.error,
    });
    return;
  }

  const message = (error as { message?: string })?.message;
  console.error(`${context} failed`, message ?? "no response received");
};

// What went wrong in a phone or WhatsApp request, as the interface needs to tell it apart.
export type PhoneErrorKind =
  | "rateLimited"
  | "recipientNotAllowed"
  | "invalidCode"
  | "codeExpired"
  | "tooManyAttempts"
  | "unknown";

// HTTP statuses the gateway assigns to the two gRPC statuses the phone flow can raise: a spent
// send budget (ResourceExhausted) and a number Meta refuses to deliver to (FailedPrecondition).
// Both are used for that one purpose each, so the status identifies them on its own.
const STATUS_KINDS: Record<number, PhoneErrorKind> = {
  429: "rateLimited",
  422: "recipientNotAllowed",
};

const MESSAGE_KINDS: Record<string, PhoneErrorKind> = {
  [BACKEND_ERRORS.RATE_LIMITED]: "rateLimited",
  [BACKEND_ERRORS.RECIPIENT_NOT_ALLOWED]: "recipientNotAllowed",
  [BACKEND_ERRORS.INVALID_CODE]: "invalidCode",
  [BACKEND_ERRORS.CODE_EXPIRED]: "codeExpired",
  [BACKEND_ERRORS.TOO_MANY_ATTEMPTS]: "tooManyAttempts",
};

// classifyPhoneError decides what a failed request means, reading the HTTP status first and the
// message only for the cases a status cannot tell apart: a wrong, an expired and an exhausted
// code all arrive with the same status, since they are all a refused verification.
//
// Matching the status matters because the message is English prose from another service: it is
// meant for humans reading logs, and it changes without notice, taking this mapping with it.
export const classifyPhoneError = (error: unknown): PhoneErrorKind => {
  const response = (
    error as { response?: { status?: number; data?: { error?: string } } }
  )?.response;

  const byStatus =
    response?.status !== undefined ? STATUS_KINDS[response.status] : undefined;
  if (byStatus) {
    return byStatus;
  }

  const message = response?.data?.error;
  return (message !== undefined && MESSAGE_KINDS[message]) || "unknown";
};
