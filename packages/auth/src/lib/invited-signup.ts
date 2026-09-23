// Trybe fork: self-signup is closed via ALLOWED_SIGNUP_DOMAINS, but people
// invited from the dashboard may create their account with the invited email.
// Their pending invitations are accepted once the email address is verified.
import { randomUUID } from "node:crypto"

import { db } from "@crikket/db"
import { invitation, member } from "@crikket/db/schema/auth"
import { and, eq, gt, sql } from "drizzle-orm"

const pendingInvitationsFor = (email: string) =>
  db
    .select()
    .from(invitation)
    .where(
      and(
        eq(sql`lower(${invitation.email})`, email.toLowerCase()),
        eq(invitation.status, "pending"),
        gt(invitation.expiresAt, new Date())
      )
    )

export const hasPendingInvitation = async (email: string): Promise<boolean> =>
  (await pendingInvitationsFor(email)).length > 0

export const acceptPendingInvitations = async (user: {
  id: string
  email: string
}): Promise<void> => {
  const invitations = await pendingInvitationsFor(user.email)

  for (const pending of invitations) {
    await db.transaction(async (tx) => {
      await tx.insert(member).values({
        id: randomUUID(),
        organizationId: pending.organizationId,
        userId: user.id,
        role: pending.role ?? "member",
        createdAt: new Date(),
      })
      await tx
        .update(invitation)
        .set({ status: "accepted" })
        .where(eq(invitation.id, pending.id))
    })
  }
}
