"use client"

import { useEffect, useState, useCallback } from "react"
import type { JobApplication, ApplicationStatus } from "@/types/jobs"
import { toast } from "sonner"

export function useJobs() {
  const [jobs, setJobs] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const res = await fetch("/api/jobs")
    if (res.ok) setJobs(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function createJob(data: Partial<JobApplication>) {
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) { toast.error("Failed to save job"); return null }
    const created: JobApplication = await res.json()
    setJobs((prev) => [created, ...prev])
    toast.success("Job saved!")
    return created
  }

  async function updateJob(id: string, data: Partial<JobApplication>) {
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) { toast.error("Failed to update job"); return }
    const updated: JobApplication = await res.json()
    setJobs((prev) => prev.map((j) => (j.id === id ? updated : j)))
  }

  async function updateStatus(id: string, status: ApplicationStatus) {
    // Optimistic update
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status } : j)))
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) {
      toast.error("Failed to update status")
      load() // revert
    }
  }

  async function deleteJob(id: string) {
    setJobs((prev) => prev.filter((j) => j.id !== id))
    const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" })
    if (!res.ok) { toast.error("Failed to delete job"); load() }
    else toast.success("Job removed")
  }

  return { jobs, loading, createJob, updateJob, updateStatus, deleteJob, reload: load }
}
