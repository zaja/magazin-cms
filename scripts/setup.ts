/**
 * Interactive setup wizard for Magazin CMS
 * Generates .env, runs migrations, seeds defaults
 * Run with: npx tsx scripts/setup.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import * as readline from 'readline'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')
const ENV_FILE = path.join(ROOT, '.env')
const ENV_EXAMPLE = path.join(ROOT, '.env.example')

// ─── Helpers ───────────────────────────────────────────────────────

function generateSecret(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex')
}

function ask(rl: readline.Interface, question: string, defaultValue?: string): Promise<string> {
  const suffix = defaultValue ? ` [${defaultValue}]` : ''
  return new Promise((resolve) => {
    rl.question(`  ${question}${suffix}: `, (answer) => {
      resolve(answer.trim() || defaultValue || '')
    })
  })
}

function askYesNo(rl: readline.Interface, question: string, defaultYes = true): Promise<boolean> {
  const hint = defaultYes ? '[Y/n]' : '[y/N]'
  return new Promise((resolve) => {
    rl.question(`  ${question} ${hint}: `, (answer) => {
      const a = answer.trim().toLowerCase()
      if (a === '') resolve(defaultYes)
      else resolve(a === 'y' || a === 'yes')
    })
  })
}

function printHeader() {
  console.log('')
  console.log('╔══════════════════════════════════════════╗')
  console.log('║         Magazin CMS Setup Wizard         ║')
  console.log('╚══════════════════════════════════════════╝')
  console.log('')
}

function printStep(step: number, total: number, label: string) {
  console.log(`\n── Step ${step}/${total}: ${label} ${'─'.repeat(Math.max(0, 35 - label.length))}`)
}

// ─── Main ──────────────────────────────────────────────────────────

async function setup() {
  printHeader()

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const totalSteps = 4

  // ── Step 1: Check if .env already exists ───────────────────────
  printStep(1, totalSteps, 'Environment Configuration')

  if (fs.existsSync(ENV_FILE)) {
    const overwrite = await askYesNo(rl, '.env already exists. Overwrite?', false)
    if (!overwrite) {
      console.log('  → Keeping existing .env')
    } else {
      await generateEnvFile(rl)
    }
  } else {
    await generateEnvFile(rl)
  }

  // ── Step 2: Run migrations ─────────────────────────────────────
  printStep(2, totalSteps, 'Database Migrations')

  const runMigrations = await askYesNo(rl, 'Run database migrations?', true)
  if (runMigrations) {
    console.log('  → Running migrations...')
    try {
      execSync('npx payload migrate', {
        cwd: ROOT,
        stdio: 'inherit',
        env: { ...process.env, ...loadEnvFile() },
      })
      console.log('  ✅ Migrations complete')
    } catch {
      console.error('  ❌ Migration failed. Check your DATABASE_URL and try again.')
      console.log('  → You can run migrations manually: npx payload migrate')
    }
  } else {
    console.log('  → Skipped. Run manually: npx payload migrate')
  }

  // ── Step 3: Seed defaults ──────────────────────────────────────
  printStep(3, totalSteps, 'Seed Default Data')

  const runSeed = await askYesNo(rl, 'Seed default content styles and email templates?', true)
  if (runSeed) {
    console.log('  → Seeding defaults...')
    try {
      execSync('npx tsx scripts/seed-defaults.ts', {
        cwd: ROOT,
        stdio: 'inherit',
        env: { ...process.env, ...loadEnvFile() },
      })
    } catch {
      console.error('  ❌ Seed failed. You can run it manually: npm run seed')
    }
  } else {
    console.log('  → Skipped. Run manually: npm run seed')
  }

  // ── Step 4: Done ───────────────────────────────────────────────
  printStep(4, totalSteps, 'Setup Complete')

  console.log('')
  console.log('  🎉 Magazin CMS is ready!')
  console.log('')
  console.log('  Next steps:')
  console.log('    Development:  npm run dev')
  console.log('    Production:   npm run build && npm run start')
  console.log('')
  console.log('  Open http://localhost:3000/admin to create your first admin user.')
  console.log('')

  rl.close()
  process.exit(0)
}

// ─── Generate .env file ────────────────────────────────────────────

async function generateEnvFile(rl: readline.Interface) {
  console.log('  Generating .env file...\n')

  // Database
  const dbUrl = await ask(
    rl,
    'PostgreSQL connection URL',
    'postgresql://payload_user:your_password@127.0.0.1:5432/payload_cms_db',
  )

  // Server URL
  const serverUrl = await ask(rl, 'Server URL (no trailing slash)', 'http://localhost:3000')

  // Auto-generate secrets
  const payloadSecret = generateSecret()
  const cronSecret = generateSecret(16)
  const previewSecret = generateSecret(16)
  console.log('\n  🔑 Secrets auto-generated')

  // Optional: AI keys
  console.log('\n  Optional integrations (press Enter to skip):')
  const claudeKey = await ask(rl, 'Claude API key (for RSS translation)')
  const pixabayKey = await ask(rl, 'Pixabay API key (for stock images)')

  // Build .env content
  let envContent = fs.readFileSync(ENV_EXAMPLE, 'utf-8')

  // Replace values
  const replacements: Record<string, string> = {
    'postgresql://payload_user:your_password@127.0.0.1:5432/payload_cms_db': dbUrl,
    'your_secret_here_min_32_chars': payloadSecret,
    'your_cron_secret_here': cronSecret,
    'your_preview_secret_here': previewSecret,
    'http://localhost:3000': serverUrl,
  }

  if (claudeKey) {
    replacements['sk-ant-your_claude_api_key'] = claudeKey
  }
  if (pixabayKey) {
    replacements['your_pixabay_api_key'] = pixabayKey
  }

  for (const [search, replace] of Object.entries(replacements)) {
    envContent = envContent.replace(search, replace)
  }

  fs.writeFileSync(ENV_FILE, envContent, 'utf-8')
  console.log('\n  ✅ .env file created')
}

// ─── Load .env file as object ──────────────────────────────────────

function loadEnvFile(): Record<string, string> {
  if (!fs.existsSync(ENV_FILE)) return {}

  const content = fs.readFileSync(ENV_FILE, 'utf-8')
  const env: Record<string, string> = {}

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex)
    const value = trimmed.slice(eqIndex + 1)
    env[key] = value
  }

  return env
}

// ─── Run ───────────────────────────────────────────────────────────

setup().catch((err) => {
  console.error('\n❌ Setup failed:', err)
  process.exit(1)
})
