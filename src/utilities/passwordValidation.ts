import type { Validate } from 'payload'

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
}

export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = []

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export const passwordValidator: Validate<string | null | undefined> = (value, { operation }) => {
  // Only validate on create or when password is being changed
  if (operation === 'create' || (operation === 'update' && value)) {
    if (!value) {
      return 'Password is required'
    }

    const result = validatePasswordStrength(value)
    if (!result.isValid) {
      return result.errors.join('. ')
    }
  }

  return true
}
