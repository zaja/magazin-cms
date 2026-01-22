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
}

class EmailService {
  private config: EmailConfig | null = null
  private payload: Payload | null = null

  async initialize(payload: Payload): Promise<void> {
    this.payload = payload
    await this.loadConfig()
  }

  private async loadConfig(): Promise<void> {
    if (!this.payload) return

    try {
      const emailConfig = await this.payload.findGlobal({
        slug: 'email-config',
      })

      this.config = emailConfig as unknown as EmailConfig
    } catch (error) {
      console.error('Failed to load email config:', error)
      this.config = null
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
}

export const emailService = new EmailService()
