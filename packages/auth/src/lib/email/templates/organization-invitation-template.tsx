/** @jsxImportSource react */
import { Button, Heading, Link, Text } from "@react-email/components"
import { AuthEmailLayout } from "./auth-email-layout"

type OrganizationInvitationTemplateProps = {
  organizationName: string
  inviterName: string
  role: string
  invitationUrl: string
  extensionGuideUrl?: string
}

export function OrganizationInvitationTemplate({
  organizationName,
  inviterName,
  role,
  invitationUrl,
  extensionGuideUrl,
}: OrganizationInvitationTemplateProps) {
  return (
    <AuthEmailLayout
      previewText={`You're invited to join ${organizationName}.`}
    >
      <Heading style={headingStyle}>Organization invitation</Heading>
      <Text style={descriptionStyle}>
        {inviterName} invited you to join <strong>{organizationName}</strong> as{" "}
        <strong>{role}</strong>.
      </Text>
      <Button href={invitationUrl} style={buttonStyle}>
        Review invitation
      </Button>
      <Text style={guideTextStyle}>
        New here? Click <strong>Sign up</strong> on the sign-in page and create
        your account with this email address. You'll get a code to verify it,
        then you're in.
      </Text>
      {extensionGuideUrl ? (
        <Text style={guideTextStyle}>
          Reports are sent with the browser extension. If you haven't installed
          it yet, follow the <Link href={extensionGuideUrl}>install guide</Link>
          .
        </Text>
      ) : null}
      <Text style={helpTextStyle}>
        If you do not want to join this organization, you can ignore this email.
      </Text>
    </AuthEmailLayout>
  )
}

const headingStyle = {
  fontSize: "24px",
  fontWeight: "700",
  letterSpacing: "-0.01em",
  lineHeight: "32px",
  margin: "0 0 8px",
}

const descriptionStyle = {
  color: "#334155",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 20px",
}

const buttonStyle = {
  backgroundColor: "#0f172a",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  padding: "10px 16px",
  textDecoration: "none",
}

const helpTextStyle = {
  color: "#64748b",
  fontSize: "12px",
  lineHeight: "20px",
  margin: "16px 0 0",
}

const guideTextStyle = {
  color: "#334155",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "20px 0 0",
}
