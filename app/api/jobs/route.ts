import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createSchema = z.object({
  company: z.string().min(1),
  roleTitle: z.string().min(1),
  location: z.string().optional(),
  salary: z.string().optional(),
  jobUrl: z.string().url().optional().or(z.literal("")),
  source: z.string().optional(),
  industry: z.string().optional(),
  roleType: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  applicationDeadline: z.string().optional().nullable(),
  notes: z.string().optional(),
  savedFromSearch: z.string().optional(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const jobs = await prisma.jobApplication.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(jobs)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { applicationDeadline, jobUrl, ...rest } = parsed.data

  const job = await prisma.jobApplication.create({
    data: {
      userId: user.id,
      ...rest,
      jobUrl: jobUrl || null,
      applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
      source: (rest.source as any) ?? "MANUAL",
      roleType: (rest.roleType as any) ?? "GRADUATE_PROGRAM",
      status: (rest.status as any) ?? "BOOKMARKED",
    },
  })

  return NextResponse.json(job, { status: 201 })
}
