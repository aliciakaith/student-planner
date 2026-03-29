import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { DashboardClient } from "./DashboardClient"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Load user profile — redirect to onboarding if not set up
  const profile = await prisma.user.findUnique({ where: { id: user.id } })
  if (!profile) redirect("/onboarding")

  // Load latest weekly summary
  const latestSummary = await prisma.aISummary.findFirst({
    where: { userId: user.id, type: "WEEKLY" },
    orderBy: { generatedAt: "desc" },
  })

  // Load job application stats
  const [activeApps, offers] = await Promise.all([
    prisma.jobApplication.count({
      where: {
        userId: user.id,
        status: { in: ["APPLYING", "APPLIED", "INTERVIEW"] },
      },
    }),
    prisma.jobApplication.count({
      where: { userId: user.id, status: "OFFER" },
    }),
  ])

  // Load upcoming job deadlines (next 14 days)
  const jobDeadlines = await prisma.jobApplication.findMany({
    where: {
      userId: user.id,
      applicationDeadline: { not: null },
      status: { notIn: ["OFFER", "REJECTED"] },
    },
    select: {
      id: true,
      company: true,
      roleTitle: true,
      applicationDeadline: true,
    },
    orderBy: { applicationDeadline: "asc" },
    take: 10,
  })

  const summaryContent = latestSummary?.content as Record<string, unknown> | null

  return (
    <DashboardClient
      profile={profile}
      summaryContent={summaryContent}
      summaryGeneratedAt={latestSummary?.generatedAt?.toISOString() ?? null}
      activeApplications={activeApps}
      offersCount={offers}
      jobDeadlines={jobDeadlines.map((j) => ({
        id: j.id,
        type: "job" as const,
        title: j.roleTitle,
        subtitle: j.company,
        dueAt: j.applicationDeadline!.toISOString(),
      }))}
    />
  )
}
