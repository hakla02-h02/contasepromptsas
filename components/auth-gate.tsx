"use client"

import { useEffect, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const SESSION_KEY = "site-access-session"
const SESSION_DURATION = 10 * 60 * 60 * 1000

type AccessSession = { expiresAt: number }

export function hasValidAccessSession() {
  if (typeof window === "undefined") return false
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null") as AccessSession | null
    if (!session || session.expiresAt <= Date.now()) {
      localStorage.removeItem(SESSION_KEY)
      return false
    }
    return true
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return false
  }
}

export function saveAccessSession() {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ expiresAt: Date.now() + SESSION_DURATION }))
}

export function clearAccessSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const valid = hasValidAccessSession()
    setAuthorized(valid)
    setReady(true)
    if (!valid && pathname !== "/login") router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    if (valid && pathname === "/login") router.replace("/")
  }, [pathname, router])

  if (!ready) {
    return <div className="min-h-screen bg-black" aria-label="Carregando acesso" />
  }
  if (pathname === "/login") return <>{children}</>
  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-6 text-sm text-[#777]">
        Redirecionando para o acesso...
      </div>
    )
  }
  return <>{children}</>
}

export async function verifyAccessPassword(password: string) {
  const { data, error } = await supabase.rpc("verify_site_access", { input_password: password })
  if (error) throw error
  return data === true
}
