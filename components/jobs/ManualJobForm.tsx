"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const schema = z.object({
  company: z.string().min(1, "Company required"),
  roleTitle: z.string().min(1, "Role title required"),
  jobUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  applicationDeadline: z.string().optional(),
  location: z.string().optional(),
  roleType: z.string(),
  industry: z.string().optional(),
  salary: z.string().optional(),
  notes: z.string().optional(),
  status: z.string(),
})

type FormData = z.infer<typeof schema>

interface ManualJobFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: FormData) => Promise<void>
}

export function ManualJobForm({ open, onClose, onSubmit }: ManualJobFormProps) {
  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { roleType: "GRADUATE_PROGRAM", status: "BOOKMARKED" },
    })

  async function handleFormSubmit(data: FormData) {
    await onSubmit(data)
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose() } }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add role manually</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Company *</Label>
              <Input className="h-8 text-sm" placeholder="Atlassian" {...register("company")} />
              {errors.company && <p className="text-xs text-destructive">{errors.company.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Role title *</Label>
              <Input className="h-8 text-sm" placeholder="Graduate Software Engineer" {...register("roleTitle")} />
              {errors.roleTitle && <p className="text-xs text-destructive">{errors.roleTitle.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Job URL</Label>
            <Input className="h-8 text-sm" placeholder="https://..." {...register("jobUrl")} />
            {errors.jobUrl && <p className="text-xs text-destructive">{errors.jobUrl.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Location</Label>
              <Input className="h-8 text-sm" placeholder="Sydney, NSW" {...register("location")} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Application deadline</Label>
              <Input className="h-8 text-sm" type="date" {...register("applicationDeadline")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Role type</Label>
              <Select defaultValue="GRADUATE_PROGRAM" onValueChange={(v) => setValue("roleType", v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GRADUATE_PROGRAM">Graduate Program</SelectItem>
                  <SelectItem value="INTERNSHIP">Internship</SelectItem>
                  <SelectItem value="PART_TIME">Part Time</SelectItem>
                  <SelectItem value="FULL_TIME">Full Time</SelectItem>
                  <SelectItem value="CONTRACT">Contract</SelectItem>
                  <SelectItem value="CASUAL">Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Initial status</Label>
              <Select defaultValue="BOOKMARKED" onValueChange={(v) => setValue("status", v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOOKMARKED">Bookmarked</SelectItem>
                  <SelectItem value="APPLYING">Applying</SelectItem>
                  <SelectItem value="APPLIED">Applied</SelectItem>
                  <SelectItem value="INTERVIEW">Interview</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Industry</Label>
              <Input className="h-8 text-sm" placeholder="Technology" {...register("industry")} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Salary (optional)</Label>
              <Input className="h-8 text-sm" placeholder="$70,000–$85,000" {...register("salary")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea className="text-sm resize-none" rows={3} placeholder="Any notes…" {...register("notes")} />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { reset(); onClose() }}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save role
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
