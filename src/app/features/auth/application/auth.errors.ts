export class InvalidCredentialsError extends Error {
  constructor() { super('Invalid credentials'); }
}

export class EmailAlreadyRegisteredError extends Error {
  constructor() { super('Email already registered'); }
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
