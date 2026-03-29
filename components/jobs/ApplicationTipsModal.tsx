"use client"

import { useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { JobApplication } from "@/types/jobs"

interface ApplicationTipsModalProps {
  job: JobApplication
  open: boolean
  onClose: () => void
}

export function ApplicationTipsModal({ job, open, onClose }: ApplicationTipsModalProps) {
  const [tips, setTips] = useState<string | null>(job.aiTips)
  const [loading, setLoading] = useState(false)

  async function fetchTips() {
    setLoading(true)
    const res = await fetch("/api/ai/job-tips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id }),
    })
    if (res.ok) {
      const { tips: t } = await res.json()
      setTips(t)
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Application Tips
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {job.roleTitle} at {job.company}
          </p>
        </DialogHeader>

        <div className="py-2">
          {loading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Generating tips…</span>
            </div>
          ) : tips ? (
            <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
              {tips}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Get personalised tips for this application from Claude AI
              </p>
              <Button onClick={fetchTips} className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Generate tips
              </Button>
            </div>
          )}

          {tips && !loading && (
            <div className="mt-4 pt-3 border-t flex justify-end">
              <Button variant="outline" size="sm" onClick={fetchTips} className="gap-1.5">
                <Sparkles className="h-3 w-3" />
                Regenerate
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
