import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { encryptCanvasToken } from "@/lib/canvas-crypto"
import { z } from "zod"

const profileSchema = z.object({
  fullName: z.string().min(2),
  university: z.string().min(1),
  degree: z.string().min(2),
  fieldOfStudy: z.string().min(2),
  graduationYear: z.number().int().min(2024).max(2030),
  workRights: z.enum(["CITIZEN", "PERMANENT_RESIDENT", "STUDENT_VISA", "WORKING_VISA", "OTHER"]),
  canvasUrl: z.string().url().optional().or(z.literal("")),
  canvasToken: z.string().optional(),
  worksPartTime: z.boolean(),
  workDays: z.array(z.string()),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = profileSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { canvasToken, canvasUrl, worksPartTime, workDays, ...rest } = parsed.data

  let canvasTokenEnc: string | undefined
  if (canvasToken && canvasToken.trim()) {
    canvasTokenEnc = await encryptCanvasToken(canvasToken.trim())
  }

  await prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email!,
      ...rest,
      canvasUrl: canvasUrl || null,
      canvasTokenEnc: canvasTokenEnc ?? null,
      preferences: { worksPartTime, workDays },
    },
    update: {
      ...rest,
      canvasUrl: canvasUrl || null,
      canvasTokenEnc: canvasTokenEnc ?? null,
      preferences: { worksPartTime, workDays },
    },
  })

  return NextResponse.json({ success: true })
}
