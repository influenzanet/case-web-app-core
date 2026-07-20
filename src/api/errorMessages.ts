// Backend error messages used in phone/WhatsApp dialog error handling.
// Keep in sync with user-management-service gRPC status messages.
export const BACKEND_ERRORS = {
  ACTION_FAILED: 'action failed',
  PHONE_NOT_VALID: 'phone not valid',
  PHONE_ALREADY_TAKEN: 'phone number already taken',
  PHONE_ALREADY_VERIFIED: 'phone number already verified',
  NO_PHONE_TO_EDIT: 'user has no phone number to edit',
  WHATSAPP_UNAVAILABLE: 'WhatsApp is not configured',
  SEND_FAILED: 'failed to send verification code',
  TOO_MANY_ATTEMPTS: 'too many attempts, phone number removed',
  CODE_EXPIRED: 'verification code expired',
  INVALID_CODE: 'invalid verification code',
  RATE_LIMITED: 'too many phone verification attempts, try again later',
  RECIPIENT_NOT_ALLOWED: 'phone number not enabled to receive WhatsApp messages',
} as const;
