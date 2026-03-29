import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { decryptCanvasToken } from "@/lib/canvas-crypto"

const CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes

async function getCached(userId: string, dataType: string, courseId?: string) {
  const cached = await prisma.canvasCache.findUnique({
    where: { userId_dataType_courseId: { userId, dataType, courseId: courseId ?? "" } },
  })
  if (!cached) return null
  if (new Date(cached.expiresAt) < new Date()) return null
  return cached.data
}

async function setCache(userId: string, dataType: string, data: unknown, courseId?: string) {
  const expiresAt = new Date(Date.now() + CACHE_TTL_MS)
  await prisma.canvasCache.upsert({
    where: { userId_dataType_courseId: { userId, dataType, courseId: courseId ?? "" } },
    create: { userId, dataType, courseId: courseId ?? "", data: data as object, expiresAt },
    update: { data: data as object, fetchedAt: new Date(), expiresAt },
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const profile = await prisma.user.findUnique({ where: { id: user.id } })
  if (!profile?.canvasUrl || !profile?.canvasTokenEnc) {
    return NextResponse.json({ error: "Canvas not configured" }, { status: 400 })
  }

  const { path = [] } = await params
  const canvasPath = path.join("/")
  const searchParams = request.nextUrl.searchParams
  const forceRefresh = searchParams.get("refresh") === "1"

  // Determine cache key
  const dataType = canvasPath
  const courseIdMatch = canvasPath.match(/courses\/(\d+)/)
  const courseId = courseIdMatch?.[1]

  // Check cache (unless force refresh)
  if (!forceRefresh) {
    const cached = await getCached(user.id, dataType, courseId)
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "X-Cache": "HIT" },
      })
    }
  }

  // Decrypt Canvas token and proxy the request
  let token: string
  try {
    token = await decryptCanvasToken(profile.canvasTokenEnc)
  } catch {
    return NextResponse.json({ error: "Failed to decrypt Canvas token" }, { status: 500 })
  }

  // Build Canvas API URL with query params (except our own)
  const canvasUrl = profile.canvasUrl.replace(/\/$/, "")
  const forwardedParams = new URLSearchParams(searchParams)
  forwardedParams.delete("refresh")
  const queryString = forwardedParams.toString()
  const url = `${canvasUrl}/api/v1/${canvasPath}${queryString ? `?${queryString}` : ""}`

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Canvas API error: ${res.status}` },
        { status: res.status }
      )
    }

    const data = await res.json()

    // Cache the response
    await setCache(user.id, dataType, data, courseId).catch(() => {})

    return NextResponse.json(data, {
      headers: { "X-Cache": "MISS" },
    })
  } catch (err) {
    return NextResponse.json({ error: "Failed to reach Canvas" }, { status: 502 })
  }
}
