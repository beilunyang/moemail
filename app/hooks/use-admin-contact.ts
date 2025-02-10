"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"

export function useAdminContact() {
  const [adminContact, setAdminContact] = useState("")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchAdminContact = async () => {
    try {
      const res = await fetch("/api/admin-contact")
      if (!res.ok) throw new Error("获取管理员联系方式失败")
      const data = await res.json() as { adminContact: string }
      setAdminContact(data.adminContact)
    } catch (error) {
      console.error(error)
      toast({
        title: "获取失败",
        description: "获取管理员联系方式失败",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminContact()
  }, [])

  return {
    adminContact,
    loading,
    refreshAdminContact: fetchAdminContact
  }
} 