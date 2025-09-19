export const ROLES = {
  EMPEROR: "emperor",
  DUKE: "duke",
  KNIGHT: "knight",
  CIVILIAN: "civilian",
  TEMP_USER: "temp_user", // 临时用户角色
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  MANAGE_EMAIL: "manage_email",
  MANAGE_WEBHOOK: "manage_webhook",
  PROMOTE_USER: "promote_user",
  MANAGE_CONFIG: "manage_config",
  MANAGE_API_KEY: "manage_api_key",
  MANAGE_CARD_KEYS: "manage_card_keys", // 管理卡密权限
  VIEW_TEMP_EMAIL: "view_temp_email", // 查看临时邮箱权限
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.EMPEROR]: Object.values(PERMISSIONS),
  [ROLES.DUKE]: [
    PERMISSIONS.MANAGE_EMAIL,
    PERMISSIONS.MANAGE_WEBHOOK,
    PERMISSIONS.MANAGE_API_KEY,
  ],
  [ROLES.KNIGHT]: [PERMISSIONS.MANAGE_EMAIL, PERMISSIONS.MANAGE_WEBHOOK],
  [ROLES.CIVILIAN]: [],
  [ROLES.TEMP_USER]: [
    PERMISSIONS.VIEW_TEMP_EMAIL, // 临时用户只能查看绑定的邮箱
  ],
} as const;

export function hasPermission(
  userRoles: Role[],
  permission: Permission
): boolean {
  return userRoles.some((role) => ROLE_PERMISSIONS[role]?.includes(permission));
}
