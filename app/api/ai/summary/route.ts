import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { anthropic, MODEL, streamToResponse } from "@/lib/anthropic"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const profile = await prisma.user.findUnique({ where: { id: user.id } })
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  const { type = "weekly", assignments = [], events = [], jobDeadlines = [], userPreferences = {} } = await req.json()

  const systemPrompt = `You are an academic coach for a final year Australian university student.
You have access to their Canvas assignments, upcoming events, and job application deadlines.
Return a JSON object with exactly this shape:
{
  "weekSummary": "2-3 sentence plain English overview of the week",
  "priorityTasks": [{ "task": string, "reason": string, "urgency": "high"|"medium"|"low" }],
  "dailyPlan": { "Mon": string, "Tue": string, "Wed": string, "Thu": string, "Fri": string, "Sat": string, "Sun": string },
  "studyTips": [string],
  "jobActionItems": [string],
  "encouragement": string
}
Be specific — name the actual assignments and companies. Be concise and practical.`

  const userMessage = `Student profile:
- Degree: ${profile.degree ?? "Unknown"} in ${profile.fieldOfStudy ?? "Unknown"}
- University: ${profile.university ?? "Unknown"}
- Graduation: ${profile.graduationYear ?? "Unknown"}
- Work preferences: ${JSON.stringify(userPreferences)}

Assignments due this week: ${assignments.length > 0 ? JSON.stringify(assignments) : "No Canvas data connected yet."}
Upcoming events: ${events.length > 0 ? JSON.stringify(events) : "None"}
Job application deadlines: ${jobDeadlines.length > 0 ? JSON.stringify(jobDeadlines) : "None upcoming"}

Generate a ${type} summary.`

  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  })

  let fullText = ""
  const readable = await streamToResponse(stream, (text) => { fullText += text })

  // Save to DB after stream ends (fire-and-forget via background task)
  stream.finalMessage().then(async () => {
    try {
      const jsonMatch = fullText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const content = JSON.parse(jsonMatch[0])
        await prisma.aISummary.create({
          data: {
            userId: user.id,
            type: type === "weekly" ? "WEEKLY" : "MONTHLY",
            content,
          },
        })
      }
    } catch {}
  })

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  })
}
