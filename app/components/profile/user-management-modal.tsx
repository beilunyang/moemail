"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  // DialogDescription, // 修复：移除未使用的导入
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { ROLES, Role } from "@/lib/permissions"
import { useTranslations } from "next-intl"
import { useEffect, useState, useMemo, useCallback } from "react" // 新增 useCallback
import { Loader2, UserPlus, Edit, Trash2, Search } from "lucide-react"

// 定义用户数据结构
type UserWithRole = {
  id: string
  username: string | null
  email: string | null
  role: Role
  status: boolean // true = 激活, false = 封禁
}

// 排除皇帝角色的类型
type RoleWithoutEmperor = Exclude<Role, typeof ROLES.EMPEROR>

// 所有可分配的角色
const assignableRoles: RoleWithoutEmperor[] = [
  ROLES.DUKE,
  ROLES.KNIGHT,
  ROLES.CIVILIAN,
]

interface UserManagementModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 主模态框组件
 */
export function UserManagementModal({ isOpen, onOpenChange }: UserManagementModalProps) {
  const t = useTranslations("profile.userManagement")
  const tRoles = useTranslations("profile.card.roles")
  const [activeTab, setActiveTab] = useState("list")

  // 用户列表状态
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // 注册设置状态
  const [allowRegistration, setAllowRegistration] = useState(true)
  const [isLoadingSettings, setIsLoadingSettings] = useState(false)

  // 子模态框状态
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showEditUserModal, setShowEditUserModal] = useState<UserWithRole | null>(null)
  const [showDeleteAlert, setShowDeleteAlert] = useState<UserWithRole | null>(null)

  const { toast } = useToast()

  // 修复：使用 useCallback 包装函数，以便安全地添加到 useEffect 依赖项中
  // 获取所有用户
  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true)
    try {
      const res = await fetch("/api/users")
      if (!res.ok) throw new Error(t("list.loadFailedDesc")); // * 修复：使用 i18n *
      const data = (await res.json()) as UserWithRole[]
      setUsers(data)
    } catch (error) {
      // 修复：使用 error 变量
      console.error("Failed to fetch users:", error)
      toast({
        title: t("list.loadFailedTitle"), // * 修复：使用 i18n *
        description: error instanceof Error ? error.message : t("list.loadFailedDesc"), // * 修复：使用 i18n *
        variant: "destructive",
      })
    } finally {
      setIsLoadingUsers(false)
    }
  }, [toast, t]) // 修复：添加 t 作为依赖项

  // 修复：使用 useCallback 包装函数
  // 获取注册设置
  const fetchRegistrationSettings = useCallback(async () => {
    setIsLoadingSettings(true)
    try {
      const res = await fetch("/api/config/registration")
      if (!res.ok) throw new Error(t("settings.loadFailedDesc")); // * 修复：使用 i18n *
      const data = (await res.json()) as { allowRegistration: boolean }
      setAllowRegistration(data.allowRegistration)
    } catch (error) {
      // 修复：使用 error 变量
      console.error("Failed to fetch settings:", error)
      toast({
        title: t("settings.loadFailedTitle"), // * 修复：使用 i18n *
        description: error instanceof Error ? error.message : t("settings.loadFailedDesc"), // * 修复：使用 i18n *
        variant: "destructive",
      })
    } finally {
      setIsLoadingSettings(false)
    }
  }, [toast, t]) // 添加 toast 和 t 作为依赖项

  // 保存注册设置
  const handleSaveSettings = async () => {
    setIsLoadingSettings(true)
    try {
      const res = await fetch("/api/config/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowRegistration }),
      })
      if (!res.ok) throw new Error(t("settings.saveFailed")); // * 修复：使用 i18n *
      toast({ title: t("settings.saveSuccess") })
    } catch (error) {
      toast({
        title: t("settings.saveFailed"),
        description: error instanceof Error ? error.message : t("settings.unknownError"), // * 修复：使用 i18n *
        variant: "destructive",
      })
    } finally {
      setIsLoadingSettings(false)
    }
  }

  // 当模态框打开时，获取数据
  useEffect(() => {
    if (isOpen) {
      if (activeTab === "list") {
        fetchUsers()
      } else if (activeTab === "settings") {
        fetchRegistrationSettings()
      }
    }
  // 修复：添加 fetchUsers 和 fetchRegistrationSettings 到依赖项
  }, [isOpen, activeTab, fetchUsers, fetchRegistrationSettings])

  // 过滤用户
  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [users, searchTerm])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("modalTitle")}</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="shrink-0">
            <TabsTrigger value="list">{t("tabs.list")}</TabsTrigger>
            <TabsTrigger value="settings">{t("tabs.settings")}</TabsTrigger>
          </TabsList>
          
          {/* 用户列表 Tab */}
          <TabsContent value="list" className="flex-1 overflow-y-auto mt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="relative w-full max-w-sm">
                <Input
                  placeholder={t("list.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              <Button onClick={() => setShowAddUserModal(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                {t("list.addUser")}
              </Button>
            </div>
            {isLoadingUsers ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              // --- 使用 Div 布局的表格 ---
              <div className="border rounded-md">
                {/* 列表头部 */}
                <div className="flex items-center p-4 bg-muted/50 font-medium text-sm border-b">
                  <div className="flex-1">{t("list.username")}</div>
                  <div className="flex-1">{t("list.email")}</div>
                  <div className="w-24">{t("list.role")}</div>
                  <div className="w-24">{t("list.status")}</div>
                  <div className="w-24 text-right">{t("list.actions")}</div>
                </div>
                {/* 列表主体 */}
                <div className="divide-y">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <div key={user.id} className="flex items-center p-4 text-sm">
                        <div className="flex-1 truncate">{user.username || "N/A"}</div>
                        <div className="flex-1 truncate">{user.email || "N/A"}</div>
                        {/* 修复：将 user.role 转换为大写来匹配 i18n JSON 中的键（例如 "DUKE"）
                        */}
                        <div className="w-24">{tRoles(user.role.toUpperCase() as any)}</div>
                        <div className="w-24">
                          {user.status ? t("status.active") : t("status.banned")}
                        </div>
                        <div className="w-24 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowEditUserModal(user)}
                            disabled={user.role === ROLES.EMPEROR} // 皇帝不能被编辑
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDeleteAlert(user)}
                            disabled={user.role === ROLES.EMPEROR} // 皇帝不能被删除
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-8 text-muted-foreground">
                      {t("list.noUsers")}
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* 注册设置 Tab */}
          <TabsContent value="settings" className="mt-4 space-y-6">
            <div className="space-y-2">
              <h3 className="font-medium">{t("settings.allowRegistration")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("settings.allowRegistrationDesc")}
              </p>
            </div>
            {isLoadingSettings ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <div className="flex items-center space-x-2">
                <Switch
                  id="allowRegistration"
                  checked={allowRegistration}
                  onCheckedChange={setAllowRegistration}
                />
                <Label htmlFor="allowRegistration">
                  {/* 修复：使用 i18n 替换硬编码 */}
                  {allowRegistration ? t("settings.registrationEnabled") : t("settings.registrationDisabled")}
                </Label>
              </div>
            )}
            <Button onClick={handleSaveSettings} disabled={isLoadingSettings}>
              {/* 修复：使用 i18n 替换 t("website.save") */}
              {isLoadingSettings && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isLoadingSettings ? t("settings.saving") : t("settings.save")}
            </Button>
          </TabsContent>
        </Tabs>
        
        {/* 子模态框和警告框 */}
        {showAddUserModal && (
          <AddUserModal
            isOpen={showAddUserModal}
            onOpenChange={setShowAddUserModal}
            onUserAdded={fetchUsers} // 添加成功后刷新列表
          />
        )}
        {showEditUserModal && (
          <EditUserModal
            user={showEditUserModal}
            isOpen={!!showEditUserModal}
            onOpenChange={() => setShowEditUserModal(null)}
            onUserUpdated={fetchUsers} // 更新成功后刷新列表
          />
        )}
        {showDeleteAlert && (
          <DeleteUserAlert
            user={showDeleteAlert}
            isOpen={!!showDeleteAlert}
            onOpenChange={() => setShowDeleteAlert(null)}
            onUserDeleted={fetchUsers} // 删除成功后刷新列表
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

/**
 * 添加用户模态框
 */
function AddUserModal({
  isOpen,
  onOpenChange,
  onUserAdded,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onUserAdded: () => void
}) {
  const t = useTranslations("profile.userManagement.addUserModal")
  const tRoles = useTranslations("profile.card.roles")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<RoleWithoutEmperor>(ROLES.CIVILIAN)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username) {
      toast({ title: t("usernameRequired"), variant: "destructive" }) // * 修复：使用 i18n *
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) throw new Error(data?.error || t("failed"))

      toast({ title: t("success") })
      onUserAdded() // 刷新父组件的用户列表
      onOpenChange(false) // 关闭模态框
    } catch (error) {
      toast({
        title: t("failed"),
        description: error instanceof Error ? error.message : t("unknownError"), // * 修复：使用 i18n *
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">{t("username")}</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("usernamePlaceholder")}
            />
          </div>
          <div>
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("passwordPlaceholder")}
            />
          </div>
          <div>
            <Label htmlFor="role">{t("role")}</Label>
            <Select value={role} onValueChange={(v) => setRole(v as RoleWithoutEmperor)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assignableRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {/* 修复：将角色值 r (例如 "duke") 转换为大写 (例如 "DUKE")
                    */}
                    {tRoles(r.toUpperCase() as any)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              {/* 修复：使用 t("cancel") 解析为 ...addUserModal.cancel */}
              <Button variant="outline">{t("cancel")}</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * 编辑用户模态框
 */
function EditUserModal({
  user,
  isOpen,
  onOpenChange,
  onUserUpdated,
}: {
  user: UserWithRole
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onUserUpdated: () => void
}) {
  const t = useTranslations("profile.userManagement.editUserModal")
  const tRoles = useTranslations("profile.card.roles")
  const tStatus = useTranslations("profile.userManagement.status")
  const [role, setRole] = useState<RoleWithoutEmperor>(user.role as RoleWithoutEmperor)
  const [status, setStatus] = useState(user.status)
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const payload: { role: Role; status: boolean; password?: string } = {
        role,
        status,
      }
      if (password) {
        payload.password = password
      }

      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      const data = await res.json() as { error?: string }
      if (!res.ok) throw new Error(data?.error || t("failed"))

      toast({ title: t("success") })
      onUserUpdated() // 刷新父组件的用户列表
      onOpenChange(false) // 关闭模态框
    } catch (error) {
      toast({
        title: t("failed"),
        description: error instanceof Error ? error.message : t("unknownError"), // * 修复：使用 i18n *
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">{t("username")}</Label>
            <Input id="username" value={user.username || ""} disabled />
          </div>
          <div>
            <Label htmlFor="role">{t("role")}</Label>
            <Select value={role} onValueChange={(v) => setRole(v as RoleWithoutEmperor)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assignableRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {/* 修复：将角色值 r (例如 "duke") 转换为大写 (例如 "DUKE")
                    */}
                    {tRoles(r.toUpperCase() as any)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">{t("status")}</Label>
            <Select value={status ? "active" : "banned"} onValueChange={(v) => setStatus(v === "active")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{tStatus("active")}</SelectItem>
                <SelectItem value="banned">{tStatus("banned")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
           <div>
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("passwordPlaceholder")}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              {/* 修复：使用 t("cancel") 解析为 ...editUserModal.cancel */}
              <Button variant="outline">{t("cancel")}</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * 删除用户确认框
 */
function DeleteUserAlert({
  user,
  isOpen,
  onOpenChange,
  onUserDeleted,
}: {
  user: UserWithRole
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onUserDeleted: () => void
}) {
  const t = useTranslations("profile.userManagement.deleteUserModal")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      })
      
      const data = await res.json() as { error?: string }
      if (!res.ok) throw new Error(data?.error || t("failed"))

      toast({ title: t("success") })
      onUserDeleted() // 刷新父组件的用户列表
      onOpenChange(false) // 关闭警告框
    } catch (error) {
      toast({
        title: t("failed"),
        description: error instanceof Error ? error.message : t("unknownError"), // * 修复：使用 i18n *
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {/* 修复：添加 '|| "N/A"' (或任何你希望的备用字符串)
              以确保传递给 t() 的值永远不是 null 
            */}
            {t("description", { username: user.username || user.email || "N/A" })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}