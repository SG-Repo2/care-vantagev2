export class HealthError extends Error {
  type: string;
  details?: any;

  constructor(message: string, type: string, details?: any) {
    super(message);
    this.name = 'HealthError';
    this.type = type;
    this.details = details;
  }
}

export class PermissionError extends HealthError {
  constructor(message: string, details?: any) {
    super(message, 'permission', details);
    this.name = 'PermissionError';
  }
}

export class InitializationError extends HealthError {
  constructor(message: string, details?: any) {
    super(message, 'initialization', details);
    this.name = 'InitializationError';
  }
}

export class ValidationError extends HealthError {
  constructor(message: string, details?: any) {
    super(message, 'validation', details);
    this.name = 'ValidationError';
  }
}

export class DataError extends HealthError {
  constructor(message: string, details?: any) {
    super(message, 'data', details);
    this.name = 'DataError';
  }
}
