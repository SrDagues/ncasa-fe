export class InvalidCredentialsError extends Error {
  constructor() { super('Invalid credentials'); }
}

export class EmailAlreadyRegisteredError extends Error {
  constructor() { super('Email already registered'); }
}

export class EmailVerificationRequiredError extends Error {
  constructor() { super('Email verification required'); }
}

export class InvalidEmailVerificationTokenError extends Error {
  constructor() { super('Invalid email verification token'); }
}

export class ExpiredEmailVerificationTokenError extends Error {
  constructor() { super('Expired email verification token'); }
}

export class EmailAlreadyVerifiedError extends Error {
  constructor() { super('Email already verified'); }
}

export class VerificationRateLimitedError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super('Email verification rate limited');
  }
}

export class SessionExpiredError extends Error {
  constructor() { super('Session expired'); }
}

export class NetworkUnavailableError extends Error {
  constructor() { super('Network unavailable'); }
}

export class UnexpectedAuthenticationError extends Error {
  constructor() { super('Unexpected authentication error'); }
}
