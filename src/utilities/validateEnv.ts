type EnvVar = {
  name: string
  required: boolean
  description: string
}

const requiredEnvVars: EnvVar[] = [
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL connection string',
  },
  {
    name: 'PAYLOAD_SECRET',
    required: true,
    description: 'JWT encryption secret (min 32 chars)',
  },
  {
    name: 'NEXT_PUBLIC_SERVER_URL',
    required: true,
    description: 'Public server URL',
  },
]

const optionalEnvVars: EnvVar[] = [
  {
    name: 'CRON_SECRET',
    required: false,
    description: 'Secret for cron job authentication',
  },
  {
    name: 'RESEND_API_KEY',
    required: false,
    description: 'Resend API key for email',
  },
  {
    name: 'SMTP_HOST',
    required: false,
    description: 'SMTP host for email',
  },
]

export function validateEnv(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  // Check required variables
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar.name]
    if (!value) {
      errors.push(`Missing required environment variable: ${envVar.name} - ${envVar.description}`)
    }
  }

  // Validate PAYLOAD_SECRET length
  const payloadSecret = process.env.PAYLOAD_SECRET
  if (payloadSecret && payloadSecret.length < 32) {
    errors.push('PAYLOAD_SECRET must be at least 32 characters long')
  }

  // Validate DATABASE_URL format
  const databaseUrl = process.env.DATABASE_URL
  if (
    databaseUrl &&
    !databaseUrl.startsWith('postgresql://') &&
    !databaseUrl.startsWith('postgres://')
  ) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string')
  }

  // Check optional variables and warn if missing
  for (const envVar of optionalEnvVars) {
    const value = process.env[envVar.name]
    if (!value) {
      warnings.push(`Optional environment variable not set: ${envVar.name} - ${envVar.description}`)
    }
  }

  // Warn about email configuration
  const hasResend = Boolean(process.env.RESEND_API_KEY)
  const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER)
  if (!hasResend && !hasSmtp) {
    warnings.push('No email provider configured. Email functionality will be disabled.')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

export function logEnvValidation(): void {
  const { valid, errors, warnings } = validateEnv()

  if (errors.length > 0) {
    console.error('\n❌ Environment validation failed:')
    errors.forEach((error) => console.error(`   - ${error}`))
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment warnings:')
    warnings.forEach((warning) => console.warn(`   - ${warning}`))
  }

  if (valid && warnings.length === 0) {
    console.log('\n✅ Environment validation passed')
  }

  if (!valid) {
    console.error('\n💡 See .env.example for required environment variables\n')
  }
}
