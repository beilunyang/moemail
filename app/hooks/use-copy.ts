"use client"

import { useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"

interface UseCopyOptions {
  successMessage?: string
  errorMessage?: string
}

export function useCopy(options: UseCopyOptions = {}) {
  const { toast } = useToast()
  const {
    successMessage = "已複製到剪貼板",
    errorMessage = "複製失敗"
  } = options

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "成功",
        description: successMessage
      })
      return true
    } catch {
      toast({
        title: "錯誤",
        description: errorMessage,
        variant: "destructive"
      })
      return false
    }
  }, [successMessage, errorMessage, toast])

  return {
    copyToClipboard
  }
}
