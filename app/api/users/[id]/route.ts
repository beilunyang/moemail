import { createDb } from "@/lib/db";
import { users, userRoles, apiKeys } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { ROLES, PERMISSIONS } from "@/lib/permissions";
import { checkPermission } from "@/lib/auth";
import { getUserId } from "@/lib/apiKey";

export const runtime = "edge";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const canManage = await checkPermission(PERMISSIONS.PROMOTE_USER);
  if (!canManage) {
    return Response.json({ error: "权限不足" }, { status: 403 });
  }

  try {
    const { id: userId } = await params;
    if (!userId) {
      return Response.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const currentUserId = await getUserId();
    if (userId === currentUserId) {
      return Response.json({ error: "不能删除自己" }, { status: 400 });
    }

    const db = createDb();

    const targetUserRole = await db.query.userRoles.findFirst({
      where: eq(userRoles.userId, userId),
      with: {
        role: true,
      },
    });

    if (targetUserRole?.role.name === ROLES.EMPEROR) {
      return Response.json({ error: "不能删除皇帝" }, { status: 400 });
    }

    // apiKeys 未配置级联删除，需先手动删除；其余（accounts / emails→messages / webhooks / userRoles）由外键级联处理
    await db.delete(apiKeys).where(eq(apiKeys.userId, userId));
    await db.delete(users).where(eq(users.id, userId));

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return Response.json({ error: "操作失败" }, { status: 500 });
  }
}
