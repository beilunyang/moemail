"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Crown, Gem, Sword, User2, Loader2, Search, ChevronLeft, ChevronRight, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { ROLES, Role } from "@/lib/permissions"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const roleIcons = {
  [ROLES.EMPEROR]: Crown,
  [ROLES.DUKE]: Gem,
  [ROLES.KNIGHT]: Sword,
  [ROLES.CIVILIAN]: User2,
} as const

type RoleWithoutEmperor = Exclude<Role, typeof ROLES.EMPEROR>

interface UserItem {
  id: string
  name: string | null
  username: string | null
  email: string | null
  image: string | null
  role: string | null
}

const PAGE_SIZE = 10

export function PromotePanel() {
  const t = useTranslations("profile.promote")
  const tCard = useTranslations("profile.card")
  const [users, setUsers] = useState<UserItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const { toast } = useToast()

  const roleNames = {
    [ROLES.EMPEROR]: tCard("roles.EMPEROR"),
    [ROLES.DUKE]: tCard("roles.DUKE"),
    [ROLES.KNIGHT]: tCard("roles.KNIGHT"),
    [ROLES.CIVILIAN]: tCard("roles.CIVILIAN"),
  } as const

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: PAGE_SIZE.toString(),
      })
      if (search.trim()) {
        params.set("search", search.trim())
      }
      const res = await fetch(`/api/roles/users?${params}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json() as {
        users: UserItem[]
        total: number
        page: number
        pageSize: number
      }
      setUsers(data.users)
      setTotal(data.total)
    } catch {
      toast({
        title: t("updateFailed"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [page, search, t, toast])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    setPage(1)
  }, [search])

  const handleRoleChange = async (userId: string, newRole: RoleWithoutEmperor) => {
    setUpdatingUserId(userId)
    try {
      const res = await fetch("/api/roles/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, roleName: newRole }),
      })
      if (!res.ok) {
        const error = await res.json() as { error: string }
        throw new Error(error.error)
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      )
      toast({ title: t("updateSuccess") })
    } catch (error) {
      toast({
        title: t("updateFailed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setUpdatingUserId(null)
    }
  }

  return (
    <div className="bg-background rounded-lg border-2 border-primary/20 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <span className="text-sm text-muted-foreground ml-auto">
          {t("totalUsers", { count: total })}
        </span>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">{t("loading")}</span>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {t("noUsers")}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {users.map((user) => {
              const isEmperor = user.role === ROLES.EMPEROR
              const RoleIcon = roleIcons[user.role as Role] || User2
              const isUpdating = updatingUserId === user.id

              return (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  {user.image ? (
                    <img
                      src={user.image}
                      alt=""
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User2 className="w-4 h-4 text-primary" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {user.name || user.username || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {user.email || user.username || "—"}
                    </div>
                  </div>

                  {isEmperor ? (
                    <div className="flex items-center gap-1.5 text-sm text-amber-600 font-medium px-3">
                      <Crown className="w-4 h-4" />
                      {roleNames[ROLES.EMPEROR]}
                    </div>
                  ) : (
                    <div className="relative">
                      {isUpdating && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded z-10">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      )}
                      <Select
                        value={user.role || ROLES.CIVILIAN}
                        onValueChange={(v) => handleRoleChange(user.id, v as RoleWithoutEmperor)}
                        disabled={isUpdating}
                      >
                        <SelectTrigger className="w-32 h-8 text-sm">
                          <div className="flex items-center gap-1.5">
                            <RoleIcon className="w-3.5 h-3.5" />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ROLES.DUKE}>
                            <div className="flex items-center gap-2">
                              <Gem className="w-4 h-4" />
                              {roleNames[ROLES.DUKE]}
                            </div>
                          </SelectItem>
                          <SelectItem value={ROLES.KNIGHT}>
                            <div className="flex items-center gap-2">
                              <Sword className="w-4 h-4" />
                              {roleNames[ROLES.KNIGHT]}
                            </div>
                          </SelectItem>
                          <SelectItem value={ROLES.CIVILIAN}>
                            <div className="flex items-center gap-2">
                              <User2 className="w-4 h-4" />
                              {roleNames[ROLES.CIVILIAN]}
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {t("prevPage")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t("pageInfo", { current: page, total: totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                {t("nextPage")}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
