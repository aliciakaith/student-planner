import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const token = authHeader.slice(7)

  // Find user by extension token stored in preferences
  const users = await prisma.user.findMany({
    where: { preferences: { path: ["extensionToken"], equals: token } },
    take: 1,
  })

  const user = users[0]
  if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

  const body = await req.json()
  const { company, roleTitle, location, jobUrl, source, deadline } = body

  if (!company || !roleTitle) {
    return NextResponse.json({ error: "company and roleTitle required" }, { status: 400 })
  }

  const job = await prisma.jobApplication.create({
    data: {
      userId: user.id,
      company,
      roleTitle,
      location: location ?? null,
      jobUrl: jobUrl ?? null,
      source: source ?? "BROWSER_EXTENSION",
      applicationDeadline: deadline ? new Date(deadline) : null,
      status: "BOOKMARKED",
      roleType: "GRADUATE_PROGRAM",
    },
  })

  return NextResponse.json({ success: true, jobId: job.id })
}
