"use client"

import { create } from "zustand"
import { Role, ROLES } from "@/lib/permissions"
import { EMAIL_CONFIG } from "@/config"
import { useEffect } from "react"

interface Config {
  defaultRole: Exclude<Role, typeof ROLES.EMPEROR>
  emailDomains: string
  emailDomainsArray: string[]
  adminContact: string
  maxEmails: number
}

interface ConfigStore {
  config: Config | null
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
}

const useConfigStore = create<ConfigStore>((set) => ({
  config: null,
  loading: false,
  error: null,
  fetch: async () => {
    try {
      set({ loading: true, error: null })
      const res = await fetch("/api/config")
      if (!res.ok) throw new Error("获取配置失败")
      const data = await res.json() as Config
      set({
        config: {
          defaultRole: data.defaultRole || ROLES.CIVILIAN,
          emailDomains: data.emailDomains,
          emailDomainsArray: data.emailDomains.split(','),
          adminContact: data.adminContact || "",
          maxEmails: Number(data.maxEmails) || EMAIL_CONFIG.MAX_ACTIVE_EMAILS
        },
        loading: false,
        error: null // * 修复：成功时清空错误 *
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "获取配置失败",
        loading: false 
      })
    }
  }
}))

export function useConfig() {
  const store = useConfigStore()

  useEffect(() => {
    // * 修复：添加了 store.error 的检查 *
    // 只有在没有配置、不在加载中、且之前没有发生过错误时才 fetch
    if (!store.config && !store.loading && !store.error) {
      store.fetch()
    }
  }, [store.config, store.loading, store.error]) // * 修复：添加 store.error 到依赖数组 *

  return store
}