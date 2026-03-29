"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ExternalLink, Sparkles, Trash2, MapPin, GripVertical } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ApplicationTipsModal } from "./ApplicationTipsModal"
import { formatRelative, isDueSoon, isOverdue } from "@/lib/utils"
import type { JobApplication } from "@/types/jobs"
import { ROLE_TYPE_LABELS, SOURCE_LABELS } from "@/types/jobs"

interface JobCardProps {
  job: JobApplication
  onDelete: (id: string) => void
}

export function JobCard({ job, onDelete }: JobCardProps) {
  const [tipsOpen, setTipsOpen] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: job.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const deadlineOverdue = job.applicationDeadline ? isOverdue(job.applicationDeadline) : false
  const deadlineSoon = job.applicationDeadline ? isDueSoon(job.applicationDeadline, 7) : false

  const faviconUrl = job.jobUrl
    ? `https://www.google.com/s2/favicons?domain=${new URL(job.jobUrl).hostname}&sz=32`
    : null

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className="group cursor-default select-none"
      >
        <CardContent className="p-3 space-y-2">
          {/* Header */}
          <div className="flex items-start gap-2">
            <button
              {...attributes}
              {...listeners}
              className="mt-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4" />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {faviconUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={faviconUrl} alt="" className="h-4 w-4 rounded-sm" />
                )}
                <p className="text-xs font-semibold text-muted-foreground truncate">
                  {job.company}
                </p>
                <Badge variant="outline" className="text-[10px] px-1 py-0 ml-auto shrink-0">
                  {SOURCE_LABELS[job.source]}
                </Badge>
              </div>
              <p className="text-sm font-medium leading-snug mt-0.5 truncate">{job.roleTitle}</p>
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-2 flex-wrap pl-6">
            {job.location && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {job.location}
              </span>
            )}
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {ROLE_TYPE_LABELS[job.roleType]}
            </Badge>
          </div>

          {/* Deadline */}
          {job.applicationDeadline && (
            <p
              className={`text-xs pl-6 ${
                deadlineOverdue
                  ? "text-red-500 font-medium"
                  : deadlineSoon
                  ? "text-amber-500 font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {deadlineOverdue ? "Deadline passed" : `Closes ${formatRelative(job.applicationDeadline)}`}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 pl-6 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs gap-1"
              onClick={() => setTipsOpen(true)}
            >
              <Sparkles className="h-3 w-3" />
              AI Tips
            </Button>

            {job.jobUrl && (
              <a
                href={job.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 h-6 px-2 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
              >
                <ExternalLink className="h-3 w-3" />
                View
              </a>
            )}

            <button
              onClick={() => onDelete(job.id)}
              className="ml-auto h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </CardContent>
      </Card>

      <ApplicationTipsModal
        job={job}
        open={tipsOpen}
        onClose={() => setTipsOpen(false)}
      />
    </>
  )
}
