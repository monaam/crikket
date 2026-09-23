/** @jsxImportSource react */
// Trybe fork: sent by packages/auth/scripts/create-user.ts, since accounts are
// created by hand (self-signup is closed) and no invitation email goes out.
import { Button, Heading, Link, Text } from "@react-email/components"
import { AuthEmailLayout } from "./auth-email-layout"

type WelcomeTemplateProps = {
  name: string
  email: string
  organizationNames: string[]
  forgotPasswordUrl: string
  extensionGuideUrl: string
}

export function WelcomeTemplate({
  name,
  email,
  organizationNames,
  forgotPasswordUrl,
  extensionGuideUrl,
}: WelcomeTemplateProps) {
  return (
    <AuthEmailLayout previewText="Your Trybe Feedback account is ready.">
      <Heading style={headingStyle}>Welcome, {name}</Heading>
      <Text style={descriptionStyle}>
        An account has been created for you on Trybe Feedback, the tool we use
        to report bugs and UI/UX feedback on our products.
        {organizationNames.length > 0 ? (
          <>
            {" "}
            You have access to <strong>{organizationNames.join(", ")}</strong>.
          </>
        ) : null}
      </Text>
      <Text style={stepStyle}>
        <strong>1. Install the browser extension.</strong> Follow the{" "}
        <Link href={extensionGuideUrl}>install guide</Link> (about 5 minutes).
      </Text>
      <Text style={stepStyle}>
        <strong>2. Set your password.</strong> On the sign-in page, click{" "}
        <strong>Forgot password?</strong> and enter <strong>{email}</strong>.
        You'll get a code by email to choose your password.
      </Text>
      <Button href={forgotPasswordUrl} style={buttonStyle}>
        Set my password
      </Button>
      <Button href={extensionGuideUrl} style={secondaryButtonStyle}>
        Install guide
      </Button>
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
  margin: "0 0 16px",
}

const stepStyle = {
  color: "#334155",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 12px",
}

const buttonStyle = {
  backgroundColor: "#0f172a",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  marginTop: "8px",
  padding: "10px 16px",
  textDecoration: "none",
}

const secondaryButtonStyle = {
  ...buttonStyle,
  backgroundColor: "#ffffff",
  border: "1px solid #cbd5e1",
  color: "#0f172a",
  marginLeft: "8px",
}
