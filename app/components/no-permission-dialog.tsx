"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAdminContact } from "@/hooks/use-admin-contact"
export function NoPermissionDialog() {
  const router = useRouter()
  const { adminContact } = useAdminContact()

  return (
    <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50">
      <div className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[90%] max-w-md">
        <div className="bg-background border-2 border-primary/20 rounded-lg p-6 md:p-12 shadow-lg">
          <div className="text-center space-y-4">
            <h1 className="text-xl md:text-2xl font-bold">权限不足</h1>
            <p className="text-sm md:text-base text-muted-foreground">你没有权限访问此页面，请联系网站管理员</p>
            {
              adminContact && (
                <p className="text-sm md:text-base text-muted-foreground">管理员联系方式：{adminContact}</p>
              )
            }
            <Button 
              onClick={() => router.push("/")}
              className="mt-4 w-full md:w-auto"
            >
              返回首页
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 