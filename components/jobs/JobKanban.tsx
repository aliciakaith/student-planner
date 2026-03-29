"use client"

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useState, useMemo } from "react"
import { JobCard } from "./JobCard"
import { Badge } from "@/components/ui/badge"
import type { JobApplication, ApplicationStatus } from "@/types/jobs"
import { STATUS_COLUMNS, STATUS_LABELS } from "@/types/jobs"

interface JobKanbanProps {
  jobs: JobApplication[]
  onStatusChange: (id: string, status: ApplicationStatus) => void
  onDelete: (id: string) => void
}

const COLUMN_STYLES: Record<ApplicationStatus, string> = {
  BOOKMARKED: "border-slate-200 bg-slate-50",
  APPLYING:   "border-blue-200 bg-blue-50",
  APPLIED:    "border-violet-200 bg-violet-50",
  INTERVIEW:  "border-amber-200 bg-amber-50",
  OFFER:      "border-emerald-200 bg-emerald-50",
  REJECTED:   "border-red-200 bg-red-50",
}

interface KanbanColumnProps {
  status: ApplicationStatus
  jobs: JobApplication[]
  onDelete: (id: string) => void
}

function KanbanColumn({ status, jobs, onDelete }: KanbanColumnProps) {
  return (
    <div className={`flex flex-col rounded-xl border-2 ${COLUMN_STYLES[status]} min-h-[200px] w-52 shrink-0`}>
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-inherit">
        <span className="text-xs font-semibold">{STATUS_LABELS[status]}</span>
        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{jobs.length}</Badge>
      </div>
      <SortableContext items={jobs.map((j) => j.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 p-2 flex-1" data-column={status}>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onDelete={onDelete} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

export function JobKanban({ jobs, onStatusChange, onDelete }: JobKanbanProps) {
  const [activeJob, setActiveJob] = useState<JobApplication | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const jobsByStatus = useMemo(() => {
    const map = new Map<ApplicationStatus, JobApplication[]>()
    STATUS_COLUMNS.forEach((s) => map.set(s, []))
    jobs.forEach((j) => {
      const col = map.get(j.status) ?? []
      col.push(j)
      map.set(j.status, col)
    })
    // Sort each column by deadline
    map.forEach((col) => col.sort((a, b) => {
      if (!a.applicationDeadline) return 1
      if (!b.applicationDeadline) return -1
      return new Date(a.applicationDeadline).getTime() - new Date(b.applicationDeadline).getTime()
    }))
    return map
  }, [jobs])

  function handleDragStart(e: DragStartEvent) {
    setActiveJob(jobs.find((j) => j.id === e.active.id) ?? null)
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveJob(null)
    const { active, over } = e
    if (!over) return

    // Check if dropped over a column indicator
    const overColumn = STATUS_COLUMNS.find((s) => s === over.id)
    if (overColumn && active.id !== over.id) {
      onStatusChange(String(active.id), overColumn)
      return
    }

    // Dropped over another card — find which column it belongs to
    const targetJob = jobs.find((j) => j.id === over.id)
    if (targetJob && targetJob.status !== activeJob?.status) {
      onStatusChange(String(active.id), targetJob.status)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STATUS_COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            jobs={jobsByStatus.get(status) ?? []}
            onDelete={onDelete}
          />
        ))}
      </div>

      <DragOverlay>
        {activeJob ? (
          <div className="rotate-2 opacity-90">
            <JobCard job={activeJob} onDelete={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
