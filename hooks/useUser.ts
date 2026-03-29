"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface UserProfile {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  university: string | null
  degree: string | null
  fieldOfStudy: string | null
  graduationYear: number | null
  workRights: string
  canvasUrl: string | null
  preferences: Record<string, unknown> | null
}

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { setLoading(false); return }

      const res = await fetch("/api/auth/me")
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      }
      setLoading(false)
    }
    load()
  }, [])

  return { user, loading }
}
