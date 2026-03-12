export class LinkedInError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LinkedInError'
  }
}

export class ElementNotFoundError extends LinkedInError {
  constructor(selector: string, timeout: number) {
    super(`Element "${selector}" not found within ${timeout}ms`)
    this.name = 'ElementNotFoundError'
  }
}

export class AlreadyConnectedError extends LinkedInError {
  constructor() {
    super('Already connected with this person')
    this.name = 'AlreadyConnectedError'
  }
}

export class LinkedInRestrictionError extends LinkedInError {
  constructor(detail?: string) {
    super(`LinkedIn restriction detected${detail ? `: ${detail}` : ''}`)
    this.name = 'LinkedInRestrictionError'
  }
}

export class WrongPageError extends LinkedInError {
  constructor(expected: string, actual: string) {
    super(`Expected page matching ${expected}, got ${actual}`)
    this.name = 'WrongPageError'
  }
}

export class TimeoutError extends LinkedInError {
  constructor(operation: string, timeout: number) {
    super(`Operation "${operation}" timed out after ${timeout}ms`)
    this.name = 'TimeoutError'
  }
}
