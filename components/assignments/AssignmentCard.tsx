"use client"

import { ExternalLink, CheckCircle2, Circle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CountdownBadge } from "./CountdownBadge"
import { formatDeadline, isOverdue, isDueSoon } from "@/lib/utils"
import type { CanvasAssignment, CanvasCourse } from "@/types/canvas"

const COURSE_COLOURS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-fuchsia-500", "bg-orange-500",
]

interface AssignmentCardProps {
  assignment: CanvasAssignment
  course: CanvasCourse | undefined
  courseIndex: number
  markedDone: boolean
  onToggleDone: (id: number) => void
}

export function AssignmentCard({
  assignment,
  course,
  courseIndex,
  markedDone,
  onToggleDone,
}: AssignmentCardProps) {
  const submitted = assignment.submission?.workflow_state === "submitted" ||
    assignment.submission?.workflow_state === "graded"
  const overdue = assignment.due_at ? isOverdue(assignment.due_at) : false
  const veryUrgent = assignment.due_at ? isDueSoon(assignment.due_at, 2) : false
  const done = submitted || markedDone

  const dotColor = COURSE_COLOURS[courseIndex % COURSE_COLOURS.length]

  return (
    <Card className={`transition-opacity ${done ? "opacity-60" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Done toggle */}
          <button
            onClick={() => onToggleDone(assignment.id)}
            className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
            title={markedDone ? "Mark as not done" : "Mark as done"}
          >
            {markedDone ? (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </button>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-start gap-2 flex-wrap">
              <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${dotColor}`} />
              <p className={`text-sm font-medium leading-snug ${done ? "line-through" : ""}`}>
                {assignment.name}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {course && (
                <span className="text-xs text-muted-foreground">{course.name}</span>
              )}
              {assignment.points_possible != null && (
                <span className="text-xs text-muted-foreground">
                  · {assignment.points_possible} pts
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {submitted ? (
                <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300 bg-emerald-50">
                  Submitted
                </Badge>
              ) : overdue ? (
                <Badge variant="destructive" className="text-xs">Overdue</Badge>
              ) : assignment.due_at ? (
                <CountdownBadge dueAt={assignment.due_at} />
              ) : null}

              {assignment.due_at && (
                <span className="text-xs text-muted-foreground">
                  {formatDeadline(assignment.due_at)}
                </span>
              )}
            </div>
          </div>

          {/* External link */}
          <a
            href={assignment.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
            title="Open in Canvas"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
