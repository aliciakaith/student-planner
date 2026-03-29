"use client"

import { useForm } from "react-hook-form"
import { Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const INDUSTRIES = [
  "Technology", "Finance", "Consulting", "Engineering", "Healthcare",
  "Law", "Marketing", "Government", "Education", "Other",
]

const LOCATIONS = [
  "Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide",
  "Canberra", "Darwin", "Hobart", "Remote", "Australia (any)",
]

export interface SearchFilters {
  fieldOfStudy: string
  roleType: string
  industry: string
  location: string
  keywords: string
  workRights: string
}

interface JobSearchPanelProps {
  defaults: Partial<SearchFilters>
  onSearch: (filters: SearchFilters) => void
  searching: boolean
}

export function JobSearchPanel({ defaults, onSearch, searching }: JobSearchPanelProps) {
  const { register, handleSubmit, setValue, watch } = useForm<SearchFilters>({
    defaultValues: {
      fieldOfStudy: defaults.fieldOfStudy ?? "",
      roleType: defaults.roleType ?? "GRADUATE_PROGRAM",
      industry: defaults.industry ?? "Technology",
      location: defaults.location ?? "Sydney",
      keywords: "",
      workRights: defaults.workRights ?? "CITIZEN",
    },
  })

  return (
    <form onSubmit={handleSubmit(onSearch)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Field of study</Label>
          <Input
            placeholder="e.g. Computer Science"
            className="h-8 text-sm"
            {...register("fieldOfStudy")}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Role type</Label>
          <Select defaultValue="GRADUATE_PROGRAM" onValueChange={(v) => setValue("roleType", v)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GRADUATE_PROGRAM">Graduate Program</SelectItem>
              <SelectItem value="INTERNSHIP">Internship</SelectItem>
              <SelectItem value="PART_TIME">Part Time</SelectItem>
              <SelectItem value="FULL_TIME">Full Time</SelectItem>
              <SelectItem value="CONTRACT">Contract</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Industry</Label>
          <Select defaultValue={defaults.industry ?? "Technology"} onValueChange={(v) => setValue("industry", v)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((i) => (
                <SelectItem key={i} value={i}>{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Location</Label>
          <Select defaultValue="Sydney" onValueChange={(v) => setValue("location", v)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Work rights</Label>
          <Select defaultValue={defaults.workRights ?? "CITIZEN"} onValueChange={(v) => setValue("workRights", v)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CITIZEN">Australian Citizen</SelectItem>
              <SelectItem value="PERMANENT_RESIDENT">Permanent Resident</SelectItem>
              <SelectItem value="STUDENT_VISA">Student Visa</SelectItem>
              <SelectItem value="WORKING_VISA">Working Visa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Keywords (optional)</Label>
          <Input
            placeholder="e.g. React, Python, data analyst"
            className="h-8 text-sm"
            {...register("keywords")}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        💡 Filters pre-filled from your profile
      </p>

      <Button type="submit" disabled={searching} className="w-full gap-2">
        {searching ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Searching the web…</>
        ) : (
          <><Search className="h-4 w-4" /> Search graduate roles</>
        )}
      </Button>
    </form>
  )
}
