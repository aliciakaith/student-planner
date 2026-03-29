import { AlertCircle, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatRelative, isDueSoon, isOverdue } from "@/lib/utils"

interface Deadline {
  id: string
  type: "assignment" | "job"
  title: string
  subtitle: string
  dueAt: string
  url?: string | null
}

interface UrgentDeadlinesProps {
  deadlines: Deadline[]
}

export function UrgentDeadlines({ deadlines }: UrgentDeadlinesProps) {
  const urgent = deadlines
    .filter((d) => isOverdue(d.dueAt) || isDueSoon(d.dueAt, 7))
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, 8)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertCircle className="h-4 w-4 text-destructive" />
          Urgent Deadlines
          {urgent.length > 0 && (
            <Badge variant="destructive" className="ml-auto text-xs">
              {urgent.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {urgent.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nothing urgent right now
          </p>
        ) : (
          urgent.map((d) => {
            const overdue = isOverdue(d.dueAt)
            const veryUrgent = isDueSoon(d.dueAt, 2)
            return (
              <div
                key={d.id}
                className={`flex items-start justify-between gap-2 p-2.5 rounded-lg border ${
                  overdue
                    ? "border-red-200 bg-red-50"
                    : veryUrgent
                    ? "border-amber-200 bg-amber-50"
                    : "border-border bg-muted/30"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug truncate">{d.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{d.subtitle}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span
                    className={`text-xs font-medium ${
                      overdue ? "text-red-600" : veryUrgent ? "text-amber-600" : "text-muted-foreground"
                    }`}
                  >
                    {overdue ? "Overdue" : formatRelative(d.dueAt)}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
