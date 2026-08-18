export class InvalidCredentialsError extends Error {
  constructor() { super('Invalid credentials'); }
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
