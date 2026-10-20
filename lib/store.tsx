"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import type { Account, AccountStatus, Prompt } from "./types"
import { supabase, APP_STATE_ID, APP_STATE_TABLE } from "./supabase"

interface StoreData {
  accounts: Account[]
  prompts: Prompt[]
}

interface StoreContextValue extends StoreData {
  hydrated: boolean
  addAccount: (data: Omit<Account, "id" | "createdAt">) => void
  updateAccount: (id: string, patch: Partial<Omit<Account, "id" | "createdAt">>) => void
  deleteAccount: (id: string) => void
  addPrompt: (data: Pick<Prompt, "title" | "content">) => void
  updatePrompt: (id: string, patch: Partial<Pick<Prompt, "title" | "content" | "archived" | "pinned" | "color">>) => void
  deletePrompt: (id: string) => void
}

const StoreContext = createContext<StoreContextValue | null>(null)
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
const now = () => new Date().toISOString()

export function StoreProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [hydrated, setHydrated] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dirtyRef = useRef(false)
  const savingRef = useRef(false)
  const pendingStateRef = useRef<StoreData | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const { data, error } = await supabase.from(APP_STATE_TABLE).select("data").eq("id", APP_STATE_ID).maybeSingle()
        if (error) throw error
        if (active && data?.data) {
          const parsed = data.data as Partial<StoreData>
          setAccounts(parsed.accounts ?? [])
          setPrompts(parsed.prompts ?? [])
        }
      } catch (error) {
        console.log("[v0] erro ao carregar biblioteca:", error)
      }
      if (active) setHydrated(true)
    })()
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!hydrated || !dirtyRef.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    pendingStateRef.current = { accounts, prompts }
    saveTimer.current = setTimeout(async () => {
      if (savingRef.current || !pendingStateRef.current) return
      savingRef.current = true
      const snapshot = pendingStateRef.current
      try {
        const { error } = await supabase.from(APP_STATE_TABLE).upsert({ id: APP_STATE_ID, data: snapshot, updated_at: now() }, { onConflict: "id" })
        if (error) throw error
        if (pendingStateRef.current === snapshot) {
          pendingStateRef.current = null
          dirtyRef.current = false
        }
      } catch (error) {
        console.log("[v0] erro ao salvar biblioteca:", error)
      } finally {
        savingRef.current = false
      }
    }, 500)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [accounts, prompts, hydrated])

  const markDirty = () => { dirtyRef.current = true }
  const addAccount = useCallback((data: Omit<Account, "id" | "createdAt">) => { markDirty(); setAccounts((items) => [{ ...data, id: uid(), createdAt: now() }, ...items]) }, [])
  const updateAccount = useCallback((id: string, patch: Partial<Omit<Account, "id" | "createdAt">>) => { markDirty(); setAccounts((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item)) }, [])
  const deleteAccount = useCallback((id: string) => { markDirty(); setAccounts((items) => items.filter((item) => item.id !== id)) }, [])
  const addPrompt = useCallback((data: Pick<Prompt, "title" | "content">) => { markDirty(); setPrompts((items) => [{ ...data, id: uid(), createdAt: now(), updatedAt: now(), archived: false, pinned: false, color: "default" }, ...items]) }, [])
  const updatePrompt = useCallback((id: string, patch: Partial<Pick<Prompt, "title" | "content" | "archived" | "pinned" | "color">>) => { markDirty(); setPrompts((items) => items.map((item) => item.id === id ? { ...item, ...patch, updatedAt: now() } : item)) }, [])
  const deletePrompt = useCallback((id: string) => { markDirty(); setPrompts((items) => items.filter((item) => item.id !== id)) }, [])

  return <StoreContext.Provider value={{ accounts, prompts, hydrated, addAccount, updateAccount, deleteAccount, addPrompt, updatePrompt, deletePrompt }}>{children}</StoreContext.Provider>
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error("useStore deve ser usado dentro de StoreProvider")
  return context
}
