import nodemailer from 'nodemailer'
import type { Payload } from 'payload'

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

interface EmailConfig {
  provider: 'smtp' | 'resend'
  smtp?: {
    host?: string
    port?: number
    secure?: boolean
    user?: string
    password?: string
    fromEmail?: string
    fromName?: string
  }
  resend?: {
    apiKey?: string
    fromEmail?: string
    fromName?: string
  }
  templates?: Record<string, unknown>
}

interface LexicalNode {
  type: string
  text?: string
  format?: number
  children?: LexicalNode[]
  tag?: string
  listType?: string
}

function lexicalNodeToHtml(node: LexicalNode): string {
  if (node.type === 'text') {
    let text = node.text || ''
    const fmt = node.format || 0
    if (fmt & 1) text = `<strong>${text}</strong>`
    if (fmt & 2) text = `<em>${text}</em>`
    if (fmt & 4) text = `<s>${text}</s>`
    if (fmt & 8) text = `<u>${text}</u>`
    return text
  }

  const childrenHtml = (node.children || []).map(lexicalNodeToHtml).join('')

  switch (node.type) {
    case 'root':
      return childrenHtml
    case 'paragraph':
      return `<p>${childrenHtml}</p>`
    case 'heading':
      return `<${node.tag || 'h2'}>${childrenHtml}</${node.tag || 'h2'}>`
    case 'list':
      return node.listType === 'number' ? `<ol>${childrenHtml}</ol>` : `<ul>${childrenHtml}</ul>`
    case 'listitem':
      return `<li>${childrenHtml}</li>`
    case 'link':
      return `<a href="#">${childrenHtml}</a>`
    case 'linebreak':
      return '<br>'
    default:
      return childrenHtml
  }
}

function lexicalToHtml(lexicalData: Record<string, unknown> | null): string {
  if (!lexicalData?.root) return ''
  return lexicalNodeToHtml(lexicalData.root as LexicalNode)
}

class EmailService {
  private config: EmailConfig | null = null
  private payload: Payload | null = null

  async initialize(payload: Payload): Promise<void> {
    this.payload = payload
    await this.loadConfig()
  }

  private async loadConfig(): Promise<void> {
    if (!this.payload) {
      // No Payload instance — try env-only config
      this.config = this.loadEnvConfig()
      return
    }

    try {
      const emailConfig = await this.payload.findGlobal({
        slug: 'email-config',
      })

      const dbConfig = emailConfig as unknown as EmailConfig

      // Merge: DB values take priority, env vars fill in gaps
      this.config = this.mergeWithEnv(dbConfig)
    } catch (error) {
      console.error('Failed to load email config from DB, falling back to env:', error)
      this.config = this.loadEnvConfig()
    }
  }

  private loadEnvConfig(): EmailConfig | null {
    const hasResend = Boolean(process.env.RESEND_API_KEY)
    const hasSmtp = Boolean(process.env.SMTP_HOST)

    if (!hasResend && !hasSmtp) return null

    return {
      provider: hasResend ? 'resend' : 'smtp',
      smtp: hasSmtp
        ? {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
            secure: process.env.SMTP_SECURE === 'true',
            user: process.env.SMTP_USER,
            password: process.env.SMTP_PASSWORD,
            fromEmail: process.env.SMTP_FROM_EMAIL,
            fromName: process.env.SMTP_FROM_NAME,
          }
        : undefined,
      resend: hasResend
        ? {
            apiKey: process.env.RESEND_API_KEY,
            fromEmail: process.env.RESEND_FROM_EMAIL,
            fromName: process.env.RESEND_FROM_NAME,
          }
        : undefined,
    }
  }

  private mergeWithEnv(dbConfig: EmailConfig): EmailConfig {
    const envConfig = this.loadEnvConfig()
    if (!envConfig) return dbConfig

    // DB values take priority — env fills in blanks
    return {
      provider: dbConfig.provider || envConfig.provider,
      smtp: {
        host: dbConfig.smtp?.host || envConfig.smtp?.host,
        port: dbConfig.smtp?.port || envConfig.smtp?.port,
        secure: dbConfig.smtp?.secure ?? envConfig.smtp?.secure,
        user: dbConfig.smtp?.user || envConfig.smtp?.user,
        password: dbConfig.smtp?.password || envConfig.smtp?.password,
        fromEmail: dbConfig.smtp?.fromEmail || envConfig.smtp?.fromEmail,
        fromName: dbConfig.smtp?.fromName || envConfig.smtp?.fromName,
      },
      resend: {
        apiKey: dbConfig.resend?.apiKey || envConfig.resend?.apiKey,
        fromEmail: dbConfig.resend?.fromEmail || envConfig.resend?.fromEmail,
        fromName: dbConfig.resend?.fromName || envConfig.resend?.fromName,
      },
      templates: dbConfig.templates,
    }
  }

  async send(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    if (!this.config) {
      await this.loadConfig()
    }

    if (!this.config) {
      return { success: false, error: 'Email configuration not found' }
    }

    if (this.config.provider === 'resend' && this.config.resend?.apiKey) {
      const result = await this.sendWithResend(options)
      if (result.success) return result

      // Fallback to SMTP if Resend fails
      if (this.config.smtp?.host) {
        console.log('Resend failed, falling back to SMTP')
        return this.sendWithSMTP(options)
      }
      return result
    }

    if (this.config.smtp?.host) {
      return this.sendWithSMTP(options)
    }

    return { success: false, error: 'No email provider configured' }
  }

  private async sendWithResend(
    options: EmailOptions,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.config?.resend?.apiKey) {
      return { success: false, error: 'Resend API key not configured' }
    }

    try {
      const fromEmail = this.config.resend.fromEmail || 'noreply@example.com'
      const fromName = this.config.resend.fromName || 'Magazin CMS'

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.resend.apiKey}`,
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: Array.isArray(options.to) ? options.to : [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        return { success: false, error: `Resend error: ${error}` }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: `Resend error: ${error}` }
    }
  }

  private async sendWithSMTP(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    if (!this.config?.smtp?.host) {
      return { success: false, error: 'SMTP not configured' }
    }

    try {
      const port = this.config.smtp.port || 587
      // Auto-detect secure based on port if not explicitly set
      // Port 465 = direct SSL/TLS, Port 587/25 = STARTTLS
      const secure = this.config.smtp.secure !== undefined ? this.config.smtp.secure : port === 465

      const transporter = nodemailer.createTransport({
        host: this.config.smtp.host,
        port,
        secure,
        auth: {
          user: this.config.smtp.user,
          pass: this.config.smtp.password,
        },
      })

      const fromEmail = this.config.smtp.fromEmail || 'noreply@example.com'
      const fromName = this.config.smtp.fromName || 'Magazin CMS'

      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: `SMTP error: ${error}` }
    }
  }

  async sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
    return this.send({
      to,
      subject: 'Test Email from Magazin CMS',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from Magazin CMS.</p>
        <p>If you received this, your email configuration is working correctly!</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `,
      text: 'This is a test email from Magazin CMS. If you received this, your email configuration is working correctly!',
    })
  }

  renderTemplate(template: string, data: Record<string, string>): string {
    let rendered = template
    for (const [key, value] of Object.entries(data)) {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value)
    }
    return rendered
  }

  /**
   * Get a template (subject + body HTML) from the email-config global.
   * Returns null if template is not configured, so caller can fall back to hardcoded.
   */
  async getTemplate(
    templateName: string,
    variables: Record<string, string>,
  ): Promise<{ subject: string; html: string } | null> {
    if (!this.payload) return null

    try {
      const emailConfig = await this.payload.findGlobal({ slug: 'email-config' })
      const templates = (emailConfig as unknown as { templates?: Record<string, unknown> })
        .templates
      if (!templates) return null

      const subjectKey = `${templateName}Subject`
      const bodyKey = templateName

      const subjectTemplate = templates[subjectKey] as string | null
      const bodyLexical = templates[bodyKey] as Record<string, unknown> | null

      if (!bodyLexical?.root) return null

      const bodyHtml = lexicalToHtml(bodyLexical)
      const subject = subjectTemplate || ''

      return {
        subject: this.renderTemplate(subject, variables),
        html: this.renderTemplate(bodyHtml, variables),
      }
    } catch (error) {
      console.warn(`[EmailService] Failed to load template "${templateName}":`, error)
      return null
    }
  }
}

export const emailService = new EmailService()
