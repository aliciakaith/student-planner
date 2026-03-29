import { Sparkles, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface PriorityTask {
  task: string
  reason: string
  urgency: "high" | "medium" | "low"
}

interface PriorityPanelProps {
  tasks: PriorityTask[]
  loading?: boolean
}

const URGENCY_STYLES = {
  high: { badge: "destructive" as const, dot: "bg-red-500" },
  medium: { badge: "secondary" as const, dot: "bg-amber-500" },
  low: { badge: "outline" as const, dot: "bg-emerald-500" },
}

export function PriorityPanel({ tasks, loading }: PriorityPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Priority Tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5 p-2.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))
        ) : tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Generate a weekly summary to see AI priority tasks
          </p>
        ) : (
          tasks.map((t, i) => {
            const style = URGENCY_STYLES[t.urgency]
            return (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${style.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug">{t.task}</p>
                    <Badge variant={style.badge} className="text-[10px] shrink-0">
                      {t.urgency}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.reason}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
