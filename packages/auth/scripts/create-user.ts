/**
 * Trybe fork: create an account by hand while self-signup is closed.
 *
 * ALLOWED_SIGNUP_DOMAINS blocks every user.create through better-auth (sign-up,
 * email OTP, admin plugin, invitations), so accounts are inserted directly.
 *
 * Usage (inside the server container):
 *   bun packages/auth/scripts/create-user.ts --email a@b.com --name "A B" \
 *     [--password secret123] [--admin] [--org fatoura[:owner|admin|member]]... [--no-email]
 *
 * New users get a welcome email (install guide + "Forgot password?" link to set
 * their password). Without --password the initial password is random and unknown.
 */
import { randomBytes, randomUUID } from "node:crypto"
import { parseArgs } from "node:util"

import { db } from "@crikket/db"
import { account, member, organization, user } from "@crikket/db/schema/auth"
import { hashPassword } from "better-auth/crypto"
import { eq } from "drizzle-orm"

import { sendWelcomeEmail } from "../src/lib/email/auth-emails"

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    name: { type: "string" },
    password: { type: "string" },
    admin: { type: "boolean", default: false },
    org: { type: "string", multiple: true, default: [] },
    "no-email": { type: "boolean", default: false },
  },
})

const email = values.email?.trim().toLowerCase()
if (!(email && values.name)) {
  console.error("--email and --name are required")
  process.exit(1)
}

const orgRoles = values.org.map((entry) => {
  const [slug = "", role = "member"] = entry.split(":")
  if (!["owner", "admin", "member"].includes(role)) {
    throw new Error(`Invalid role "${role}" for org "${slug}"`)
  }
  return { slug, role }
})

const password = values.password ?? randomBytes(32).toString("base64url")
const now = new Date()

let [existing] = await db.select().from(user).where(eq(user.email, email))
const isNewUser = !existing

if (existing) {
  console.log(
    `User ${email} already exists (${existing.id}); updating memberships only.`
  )
} else {
  const userId = randomUUID()
  await db.transaction(async (tx) => {
    await tx.insert(user).values({
      id: userId,
      name: values.name as string,
      email,
      emailVerified: true,
      role: values.admin ? "admin" : "user",
      createdAt: now,
      updatedAt: now,
    })
    await tx.insert(account).values({
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: await hashPassword(password),
      createdAt: now,
      updatedAt: now,
    })
  })
  ;[existing] = await db.select().from(user).where(eq(user.id, userId))
  console.log(`Created ${email} (${userId})`)
}

if (!existing) throw new Error(`User ${email} could not be loaded`)
const target = existing

for (const { slug, role } of orgRoles) {
  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.slug, slug))
  if (!org) {
    console.error(`Organization "${slug}" not found; skipped.`)
    continue
  }
  const memberships = await db
    .select()
    .from(member)
    .where(eq(member.userId, target.id))
  if (memberships.some((m) => m.organizationId === org.id)) {
    console.log(`Already a member of ${slug}.`)
    continue
  }
  await db.insert(member).values({
    id: randomUUID(),
    organizationId: org.id,
    userId: target.id,
    role,
    createdAt: now,
  })
  console.log(`Added to ${slug} as ${role}.`)
}

if (isNewUser && !values["no-email"]) {
  const orgNames = (
    await db
      .select({ name: organization.name })
      .from(member)
      .innerJoin(organization, eq(member.organizationId, organization.id))
      .where(eq(member.userId, target.id))
  ).map((row) => row.name)
  await sendWelcomeEmail({
    email,
    name: target.name,
    organizationNames: orgNames,
  })
  console.log(`Welcome email sent to ${email}.`)
}

process.exit(0)
