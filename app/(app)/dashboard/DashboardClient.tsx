"use client"

import { useState } from "react"
import { toast } from "sonner"
import { StatsRow } from "@/components/dashboard/StatsRow"
import { UrgentDeadlines } from "@/components/dashboard/UrgentDeadlines"
import { WeeklySummaryCard } from "@/components/dashboard/WeeklySummaryCard"
import { PriorityPanel } from "@/components/dashboard/PriorityPanel"

interface Deadline {
  id: string
  type: "assignment" | "job"
  title: string
  subtitle: string
  dueAt: string
}

interface PriorityTask {
  task: string
  reason: string
  urgency: "high" | "medium" | "low"
}

interface Props {
  profile: { fullName: string | null }
  summaryContent: Record<string, unknown> | null
  summaryGeneratedAt: string | null
  activeApplications: number
  offersCount: number
  jobDeadlines: Deadline[]
}

export function DashboardClient({
  profile,
  summaryContent,
  summaryGeneratedAt,
  activeApplications,
  offersCount,
  jobDeadlines,
}: Props) {
  const [summary, setSummary] = useState(summaryContent)
  const [generatedAt, setGeneratedAt] = useState(summaryGeneratedAt)
  const [regenerating, setRegenerating] = useState(false)

  const weekSummary = (summary?.weekSummary as string) ?? null
  const priorityTasks = (summary?.priorityTasks as PriorityTask[]) ?? []

  async function handleRegenerate() {
    setRegenerating(true)
    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "weekly", assignments: [], events: [], jobDeadlines: [], userPreferences: {} }),
      })

      if (!res.ok || !res.body) throw new Error("Failed to generate summary")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") break
            try {
              const { text } = JSON.parse(data)
              fullText += text
            } catch {}
          }
        }
      }

      // Parse the JSON from the streamed text
      const jsonMatch = fullText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        setSummary(parsed)
        setGeneratedAt(new Date().toISOString())
        toast.success("Weekly summary updated!")
      }
    } catch (err) {
      toast.error("Failed to generate summary. Try again.")
    } finally {
      setRegenerating(false)
    }
  }

  const firstName = profile.fullName?.split(" ")[0] ?? "there"
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 md:pb-0">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{greeting}, {firstName}!</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Here&apos;s your overview for today.
        </p>
      </div>

      {/* Stats */}
      <StatsRow
        totalAssignments={0}
        overdueCount={0}
        activeApplications={activeApplications}
        offersCount={offersCount}
      />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <WeeklySummaryCard
            summary={weekSummary}
            generatedAt={generatedAt}
            onRegenerate={handleRegenerate}
            regenerating={regenerating}
          />
          <UrgentDeadlines deadlines={jobDeadlines} />
        </div>
        <div>
          <PriorityPanel tasks={priorityTasks} loading={regenerating} />
        </div>
      </div>
    </div>
  )
}
