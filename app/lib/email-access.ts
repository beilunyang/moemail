import { eq } from "drizzle-orm"
import { createDb } from "./db"
import { roles, userRoles } from "./schema"
import { canAccessAllEmails, type Role } from "./permissions"

export async function canUserAccessAllEmails(userId: string) {
  const db = createDb()
  const currentUserRole = await db.select({ roleName: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId))
    .get()

  return canAccessAllEmails(currentUserRole?.roleName as Role | null | undefined)
}
