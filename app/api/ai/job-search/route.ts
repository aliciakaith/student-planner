import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

interface JobSearchFilters {
  degree?: string
  fieldOfStudy?: string
  roleType?: string
  industry?: string
  location?: string
  workRights?: string
  keywords?: string
}

function buildSearchPrompt(filters: JobSearchFilters): string {
  return `Search for graduate job openings in Australia matching these criteria:
- Degree/Field: ${filters.fieldOfStudy || filters.degree || "any"}
- Role type: ${filters.roleType || "Graduate Program"}
- Industry: ${filters.industry || "any"}
- Location: ${filters.location || "Australia"}
- Work rights required: ${filters.workRights || "any"}
- Keywords: ${filters.keywords || "none"}

Search seek.com.au, gradaustralia.com.au, prosple.com, gradconnection.com.au, linkedin.com/jobs, and relevant company career pages.
Prioritise roles closing within the next 60 days. Include roles open to ${filters.workRights || "all"} holders.`
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { filters } = await req.json() as { filters: JobSearchFilters }

  const stream = client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    tools: [{ type: "web_search_20250305", name: "web_search" } as any],
    system: `You are a graduate job search assistant for Australian university students.
Search the web for current graduate job openings matching the student's criteria.
Focus on: seek.com.au, gradaustralia.com.au, prosple.com, gradconnection.com.au, linkedin.com/jobs, and company career pages.
After searching, return results as a JSON array with this exact shape:
[{
  "company": string,
  "roleTitle": string,
  "location": string,
  "roleType": "GRADUATE_PROGRAM"|"INTERNSHIP"|"PART_TIME"|"CASUAL"|"CONTRACT"|"FULL_TIME",
  "industry": string,
  "deadline": string | null,
  "jobUrl": string,
  "source": string,
  "salary": string | null,
  "description": string
}]
Return ONLY the JSON array. No preamble, no explanation. If no results found, return [].
Aim for 10-20 relevant results.`,
    messages: [{ role: "user", content: buildSearchPrompt(filters) }],
  })

  const encoder = new TextEncoder()
  let fullText = ""

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            fullText += chunk.delta.text
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
            )
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        controller.close()

        // Save search to DB
        const jsonMatch = fullText.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          const results = JSON.parse(jsonMatch[0])
          await prisma.jobSearch.create({
            data: {
              userId: user.id,
              query: filters as object,
              results: results,
              resultCount: results.length,
            },
          }).catch(() => {})
        }
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(readable, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  })
}
