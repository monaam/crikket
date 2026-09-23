import { env } from "@crikket/env/server"
import { render } from "@react-email/render"
import type { ReactElement } from "react"

type SendAuthEmailInput = {
  to: string
  subject: string
  text: string
  react: ReactElement
}

// Trybe fork: delivered through Postmark's /email API instead of Resend.
const POSTMARK_API_URL = "https://api.postmarkapp.com/email"

const postmarkServerToken = env.POSTMARK_SERVER_TOKEN
const fromEmail = env.POSTMARK_FROM_EMAIL
const fromName = env.POSTMARK_FROM_NAME ?? "Crikket"
const messageStream = env.POSTMARK_MESSAGE_STREAM ?? "outbound"

export const sendAuthEmail = async ({
  to,
  subject,
  text,
  react,
}: SendAuthEmailInput): Promise<void> => {
  if (!postmarkServerToken) {
    if (env.NODE_ENV === "production") {
      throw new Error(
        "Missing POSTMARK_SERVER_TOKEN. Set POSTMARK_SERVER_TOKEN in apps/server/.env."
      )
    }

    console.warn(
      `[email] Missing POSTMARK_SERVER_TOKEN in apps/server/.env. Skipping email delivery for ${to}.`
    )

    return
  }

  if (!fromEmail) {
    throw new Error(
      "Missing POSTMARK_FROM_EMAIL. Set POSTMARK_FROM_EMAIL in apps/server/.env."
    )
  }

  const html = await render(react)

  const response = await fetch(POSTMARK_API_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": postmarkServerToken,
    },
    body: JSON.stringify({
      From: `${fromName} <${fromEmail}>`,
      To: to,
      Subject: subject,
      HtmlBody: html,
      TextBody: text,
      MessageStream: messageStream,
    }),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      ErrorCode?: number
      Message?: string
    } | null

    throw new Error(
      `Failed to send auth email: ${body?.Message ?? response.statusText} (Postmark ErrorCode ${body?.ErrorCode ?? response.status})`
    )
  }
}
