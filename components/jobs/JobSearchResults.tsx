"use client"

import { ExternalLink, Plus, CheckCircle2, MapPin, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatRelative, isDueSoon, isOverdue } from "@/lib/utils"
import type { JobSearchResult } from "@/types/jobs"
import { ROLE_TYPE_LABELS } from "@/types/jobs"

interface JobSearchResultsProps {
  results: JobSearchResult[]
  savedIds: Set<string>
  streaming: boolean
  onSave: (result: JobSearchResult) => void
}

export function JobSearchResults({ results, savedIds, streaming, onSave }: JobSearchResultsProps) {
  if (streaming && results.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">AI is searching the web for roles…</span>
      </div>
    )
  }

  if (results.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{results.length} roles found</p>
        {streaming && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading more…
          </span>
        )}
      </div>

      {results.map((r, i) => {
        const key = `${r.company}-${r.roleTitle}-${i}`
        const saved = savedIds.has(key)
        const deadlineOverdue = r.deadline ? isOverdue(r.deadline) : false
        const deadlineSoon = r.deadline ? isDueSoon(r.deadline, 14) : false

        return (
          <Card key={key}>
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{r.company}</p>
                      <p className="text-sm font-semibold leading-snug">{r.roleTitle}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{r.source}</Badge>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {r.location && (
                      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />{r.location}
                      </span>
                    )}
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {ROLE_TYPE_LABELS[r.roleType] ?? r.roleType}
                    </Badge>
                    {r.salary && (
                      <span className="text-xs text-muted-foreground">{r.salary}</span>
                    )}
                  </div>

                  {r.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>
                  )}

                  {r.deadline && (
                    <p className={`text-xs font-medium ${
                      deadlineOverdue ? "text-red-500" : deadlineSoon ? "text-amber-500" : "text-muted-foreground"
                    }`}>
                      Closes {formatRelative(r.deadline)}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant={saved ? "outline" : "default"}
                    className="h-7 text-xs gap-1"
                    disabled={saved}
                    onClick={() => onSave(r)}
                  >
                    {saved ? (
                      <><CheckCircle2 className="h-3 w-3" /> Saved</>
                    ) : (
                      <><Plus className="h-3 w-3" /> Save</>
                    )}
                  </Button>
                  {r.jobUrl && (
                    <a
                      href={r.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 h-7 px-2 text-xs text-muted-foreground hover:text-foreground border rounded-md hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" /> View
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
