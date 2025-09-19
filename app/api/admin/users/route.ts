import { NextResponse } from "next/server";
import { createDb } from "@/lib/db";
import { users, userRoles, roles, tempAccounts } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/permissions";

export const runtime = "edge";

const roleDisplayNames: Record<string, string> = {
  emperor: "皇帝",
  duke: "公爵",
  knight: "骑士",
  civilian: "平民",
  temp_user: "临时用户",
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // Check if user has permission to manage users
    const db = createDb();
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      with: {
        userRoles: {
          with: {
            role: true,
          },
        },
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const userRoleNames = currentUser.userRoles.map(
      (ur) => ur.role.name
    ) as string[];
    if (!hasPermission(userRoleNames as any, PERMISSIONS.PROMOTE_USER)) {
      return NextResponse.json({ error: "权限不足" }, { status: 403 });
    }

    // Get all users with their roles
    const allUsers = await db.query.users.findMany({
      with: {
        userRoles: { with: { role: true } },
      },
      orderBy: [desc(users.id)],
    });

    // 逐个补充临时账号的到期时间
    const usersWithRoles = [] as Array<{
      id: string;
      name: string | null;
      username: string | null;
      email: string | null;
      image?: string | null;
      role: string;
      roleName: string;
      createdAt?: Date | null;
      tempExpiresAt?: Date | null;
    }>;

    for (const u of allUsers) {
      const roleName = u.userRoles[0]?.role.name || "civilian";
      let tempExpiresAt: Date | null = null;
      if (roleName === "temp_user") {
        const temp = await db.query.tempAccounts.findFirst({
          where: eq(tempAccounts.userId, u.id),
        });
        tempExpiresAt = (temp?.expiresAt as unknown as Date) ?? null;
      }

      usersWithRoles.push({
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        image: u.image,
        role: roleName,
        roleName: roleDisplayNames[roleName] || "平民",
        createdAt: u.userRoles[0]?.createdAt ?? null,
        tempExpiresAt,
      });
    }

    return NextResponse.json({ users: usersWithRoles });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: "获取用户列表失败" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { userId, newRole } = (await request.json()) as {
      userId: string;
      newRole: string;
    };

    if (!userId || !newRole) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const db = createDb();

    // Check if current user has permission to promote users
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      with: {
        userRoles: {
          with: {
            role: true,
          },
        },
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const userRoleNames = currentUser.userRoles.map(
      (ur) => ur.role.name
    ) as string[];
    if (!hasPermission(userRoleNames as any, PERMISSIONS.PROMOTE_USER)) {
      return NextResponse.json({ error: "权限不足" }, { status: 403 });
    }

    // Get the target role
    const targetRole = await db.query.roles.findFirst({
      where: eq(roles.name, newRole),
    });

    if (!targetRole) {
      return NextResponse.json({ error: "角色不存在" }, { status: 404 });
    }

    // Check if target user exists
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!targetUser) {
      return NextResponse.json({ error: "目标用户不存在" }, { status: 404 });
    }

    // Remove existing role
    await db.delete(userRoles).where(eq(userRoles.userId, userId));

    // Add new role
    await db.insert(userRoles).values({
      userId: userId,
      roleId: targetRole.id,
    });

    return NextResponse.json({
      success: true,
      message: `用户角色已更新为 ${
        roleDisplayNames[targetRole.name] || targetRole.name
      }`,
    });
  } catch (error) {
    console.error("Failed to update user role:", error);
    return NextResponse.json({ error: "更新用户角色失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
    }

    const db = createDb();

    // 当前用户权限校验
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      with: { userRoles: { with: { role: true } } },
    });
    if (!currentUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }
    const userRoleNames = currentUser.userRoles.map(
      (ur) => ur.role.name
    ) as string[];
    if (!hasPermission(userRoleNames as any, PERMISSIONS.PROMOTE_USER)) {
      return NextResponse.json({ error: "权限不足" }, { status: 403 });
    }

    // 目标用户校验：禁止删除皇帝账号
    const target = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: { userRoles: { with: { role: true } } },
    });
    if (!target) {
      return NextResponse.json({ error: "目标用户不存在" }, { status: 404 });
    }
    const isEmperor = target.userRoles.some((ur) => ur.role.name === "emperor");
    if (isEmperor) {
      return NextResponse.json({ error: "禁止删除皇帝账号" }, { status: 403 });
    }

    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({ success: true, message: "用户已删除" });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json({ error: "删除用户失败" }, { status: 500 });
  }
}
