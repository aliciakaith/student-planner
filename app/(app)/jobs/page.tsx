"use client"

import { useState } from "react"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useJobs } from "@/hooks/useJobs"
import { JobKanban } from "@/components/jobs/JobKanban"
import { JobSearchPanel, type SearchFilters } from "@/components/jobs/JobSearchPanel"
import { JobSearchResults } from "@/components/jobs/JobSearchResults"
import { ManualJobForm } from "@/components/jobs/ManualJobForm"
import type { ApplicationStatus, JobSearchResult } from "@/types/jobs"

export default function JobsPage() {
  const { jobs, loading, createJob, updateStatus, deleteJob } = useJobs()
  const [manualOpen, setManualOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<JobSearchResult[]>([])
  const [savedSearchIds, setSavedSearchIds] = useState<Set<string>>(new Set())
  const [searching, setSearching] = useState(false)

  async function handleSearch(filters: SearchFilters) {
    setSearching(true)
    setSearchResults([])

    const res = await fetch("/api/ai/job-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filters }),
    })

    if (!res.ok || !res.body) { setSearching(false); return }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value)
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue
        const data = line.slice(6)
        if (data === "[DONE]") break
        try {
          const { text } = JSON.parse(data)
          // Try to parse accumulated results
          const fullText = searchResults.map((r) => "").join("") + text
          const jsonMatch = (fullText + text).match(/\[[\s\S]*?\]/)
          if (jsonMatch) {
            const parsed: JobSearchResult[] = JSON.parse(jsonMatch[0])
            setSearchResults(parsed)
          }
        } catch {}
      }
    }

    setSearching(false)
  }

  async function handleSaveSearchResult(result: JobSearchResult) {
    const key = `${result.company}-${result.roleTitle}-0`
    await createJob({
      company: result.company,
      roleTitle: result.roleTitle,
      location: result.location,
      salary: result.salary ?? undefined,
      jobUrl: result.jobUrl,
      source: "AI_SEARCH",
      industry: result.industry,
      roleType: result.roleType,
      description: result.description,
      applicationDeadline: result.deadline ?? undefined,
      status: "BOOKMARKED",
    })
    setSavedSearchIds((prev) => new Set([...prev, key]))
  }

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Graduate Jobs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{jobs.length} roles tracked</p>
        </div>
        <Button onClick={() => setManualOpen(true)} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add role
        </Button>
      </div>

      <Tabs defaultValue="tracker">
        <TabsList>
          <TabsTrigger value="tracker">My Tracker</TabsTrigger>
          <TabsTrigger value="search" className="gap-1.5">
            <Search className="h-3.5 w-3.5" />
            AI Search
          </TabsTrigger>
        </TabsList>

        {/* Kanban tracker tab */}
        <TabsContent value="tracker" className="mt-4">
          {loading ? (
            <div className="flex gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-52 rounded-xl shrink-0" />
              ))}
            </div>
          ) : (
            <JobKanban
              jobs={jobs}
              onStatusChange={(id, status) => updateStatus(id, status as ApplicationStatus)}
              onDelete={deleteJob}
            />
          )}
        </TabsContent>

        {/* AI Search tab */}
        <TabsContent value="search" className="mt-4">
          <div className="max-w-2xl space-y-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Find Graduate Roles</CardTitle>
              </CardHeader>
              <CardContent>
                <JobSearchPanel
                  defaults={{}}
                  onSearch={handleSearch}
                  searching={searching}
                />
              </CardContent>
            </Card>

            <JobSearchResults
              results={searchResults}
              savedIds={savedSearchIds}
              streaming={searching}
              onSave={handleSaveSearchResult}
            />
          </div>
        </TabsContent>
      </Tabs>

      <ManualJobForm
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        onSubmit={async (data) => {
          await createJob(data as any)
        }}
      />
    </div>
  )
}
