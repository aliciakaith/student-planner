"use client"

import { useState } from "react"
import { Sparkles, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface WeeklySummaryCardProps {
  summary: string | null
  generatedAt: string | null
  onRegenerate: () => void
  regenerating?: boolean
}

export function WeeklySummaryCard({
  summary,
  generatedAt,
  onRegenerate,
  regenerating,
}: WeeklySummaryCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Weekly AI Summary
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRegenerate}
            disabled={regenerating}
            className="h-7 gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3 w-3 ${regenerating ? "animate-spin" : ""}`} />
            {regenerating ? "Generating…" : "Regenerate"}
          </Button>
        </div>
        {generatedAt && (
          <p className="text-xs text-muted-foreground">
            Generated {new Date(generatedAt).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "short" })}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {regenerating ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ) : summary ? (
          <div>
            <p className={`text-sm text-muted-foreground leading-relaxed ${!expanded ? "line-clamp-3" : ""}`}>
              {summary}
            </p>
            <button
              onClick={() => setExpanded((e) => !e)}
              className="flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
            >
              {expanded ? (
                <><ChevronUp className="h-3 w-3" /> Show less</>
              ) : (
                <><ChevronDown className="h-3 w-3" /> Read more</>
              )}
            </button>
          </div>
        ) : (
          <div className="py-4 text-center space-y-2">
            <p className="text-sm text-muted-foreground">No summary yet for this week</p>
            <Button size="sm" onClick={onRegenerate} className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Generate summary
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
