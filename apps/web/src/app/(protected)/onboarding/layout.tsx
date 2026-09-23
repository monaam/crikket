import { redirect } from "next/navigation"

import { getProtectedAuthData } from "@/app/(protected)/_lib/get-protected-auth-data"

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { organizations, session } = await getProtectedAuthData()

  if (organizations.length > 0) {
    redirect("/")
  }

  // Trybe fork: invited sign-ups join their organizations once their email is
  // verified, so send them to verification instead of creating a new org.
  if (session && !session.user.emailVerified) {
    redirect("/verify-email")
  }

  return children
}
