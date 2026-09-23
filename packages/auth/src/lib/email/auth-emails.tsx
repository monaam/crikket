/** @jsxImportSource react */
import { env } from "@crikket/env/server"
import { sendAuthEmail } from "./send-auth-email"
import type { AuthEmailOtpType } from "./templates/email-otp-template"
import { AuthEmailOtpTemplate } from "./templates/email-otp-template"
import { EmailVerificationLinkTemplate } from "./templates/email-verification-link-template"
import { OrganizationInvitationTemplate } from "./templates/organization-invitation-template"
import { WelcomeTemplate } from "./templates/welcome-template"

type SendEmailOtpEmailInput = {
  email: string
  otp: string
  type: AuthEmailOtpType
}

type SendEmailVerificationLinkEmailInput = {
  email: string
  verificationUrl: string
}

type SendOrganizationInvitationEmailInput = {
  email: string
  invitationId: string
  organizationName: string
  inviterName: string
  role: string
}

const OTP_SUBJECTS: Record<AuthEmailOtpType, string> = {
  "email-verification": "Verify your email",
  "change-email": "Confirm your new email",
  "forget-password": "Reset your password",
  "sign-in": "Your sign-in code",
}

const OTP_ACTION_URLS: Record<AuthEmailOtpType, string> = {
  "email-verification": "/verify-email",
  "change-email": "/settings/user",
  "forget-password": "/forgot-password",
  "sign-in": "/login",
}

const appUrl = env.CORS_ORIGINS[0]

if (!appUrl) {
  throw new Error(
    "CORS_ORIGINS must include a frontend origin for auth email links."
  )
}

// Trybe fork: static install guide served by Caddy (deploy/trybe/extension-site).
const extensionGuideUrl = new URL("/extension/", appUrl).toString()

const toAppUrl = (urlOrPath: string): string => {
  const parsed = new URL(urlOrPath, appUrl)
  const appRelativeUrl = `${parsed.pathname}${parsed.search}${parsed.hash}`

  return new URL(appRelativeUrl, appUrl).toString()
}

export const sendEmailOtpEmail = async ({
  email,
  otp,
  type,
}: SendEmailOtpEmailInput): Promise<void> => {
  const actionUrl = new URL(OTP_ACTION_URLS[type], appUrl)

  await sendAuthEmail({
    to: email,
    subject: OTP_SUBJECTS[type],
    text: `Your security code is ${otp}. It expires in 10 minutes.`,
    react: (
      <AuthEmailOtpTemplate
        actionUrl={actionUrl.toString()}
        otp={otp}
        type={type}
      />
    ),
  })
}

export const sendEmailVerificationLinkEmail = async ({
  email,
  verificationUrl,
}: SendEmailVerificationLinkEmailInput): Promise<void> => {
  const appVerificationUrl = toAppUrl(verificationUrl)

  await sendAuthEmail({
    to: email,
    subject: "Verify your email address",
    text: `Verify your email using this link: ${appVerificationUrl}`,
    react: (
      <EmailVerificationLinkTemplate verificationUrl={appVerificationUrl} />
    ),
  })
}

export const sendOrganizationInvitationEmail = async ({
  email,
  invitationId,
  organizationName,
  inviterName,
  role,
}: SendOrganizationInvitationEmailInput): Promise<void> => {
  const invitationUrl = toAppUrl(`/invite/${invitationId}`)

  await sendAuthEmail({
    to: email,
    subject: `You're invited to join ${organizationName}`,
    text: `${inviterName} invited you to join ${organizationName} as ${role}. Open this invitation: ${invitationUrl}\n\nNew here? Click "Sign up" on the sign-in page and create your account with this email address.\n\nInstall the browser extension: ${extensionGuideUrl}`,
    react: (
      <OrganizationInvitationTemplate
        extensionGuideUrl={extensionGuideUrl}
        invitationUrl={invitationUrl}
        inviterName={inviterName}
        organizationName={organizationName}
        role={role}
      />
    ),
  })
}

type SendWelcomeEmailInput = {
  email: string
  name: string
  organizationNames: string[]
}

export const sendWelcomeEmail = async ({
  email,
  name,
  organizationNames,
}: SendWelcomeEmailInput): Promise<void> => {
  const forgotPasswordUrl = new URL("/forgot-password", appUrl).toString()
  const access =
    organizationNames.length > 0
      ? ` You have access to ${organizationNames.join(", ")}.`
      : ""

  await sendAuthEmail({
    to: email,
    subject: "Your Trybe Feedback account is ready",
    text: `Hi ${name}, an account has been created for you on Trybe Feedback.${access}\n\n1. Install the browser extension: ${extensionGuideUrl}\n2. Set your password at ${forgotPasswordUrl} with ${email}: you'll get a code by email.`,
    react: (
      <WelcomeTemplate
        email={email}
        extensionGuideUrl={extensionGuideUrl}
        forgotPasswordUrl={forgotPasswordUrl}
        name={name}
        organizationNames={organizationNames}
      />
    ),
  })
}
