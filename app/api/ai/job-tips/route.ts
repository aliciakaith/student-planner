import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { anthropic, MODEL } from "@/lib/anthropic"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { jobId } = await req.json()
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 })

  const [job, profile] = await Promise.all([
    prisma.jobApplication.findFirst({ where: { id: jobId, userId: user.id } }),
    prisma.user.findUnique({ where: { id: user.id } }),
  ])

  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Return cached tips if available
  if (job.aiTips) return NextResponse.json({ tips: job.aiTips })

  const prompt = `You are a career coach helping an Australian final year student apply for this role.

Role: ${job.roleTitle} at ${job.company}
Location: ${job.location ?? "Australia"}
Type: ${job.roleType}
${job.description ? `Description: ${job.description}` : ""}
${job.salary ? `Salary: ${job.salary}` : ""}

Student profile:
- Degree: ${profile?.degree ?? "Unknown"} in ${profile?.fieldOfStudy ?? "Unknown"}
- University: ${profile?.university ?? "Unknown"}
- Work rights: ${profile?.workRights ?? "Unknown"}

Provide 5 specific, actionable tips for this application. Cover:
1. How to tailor their resume/CV for this specific role
2. Key skills or keywords to highlight
3. What to research before applying/interviewing
4. A tip specific to this company or industry
5. One thing that will make them stand out

Be concise and specific. Format as a numbered list.`

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 800,
    messages: [{ role: "user", content: prompt }],
  })

  const tips = message.content[0].type === "text" ? message.content[0].text : ""

  // Cache tips on the job record
  await prisma.jobApplication.update({ where: { id: jobId }, data: { aiTips: tips } })

  return NextResponse.json({ tips })
}
