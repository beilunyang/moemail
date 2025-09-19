import { createDb } from "../app/lib/db";
import { cardKeys, roles } from "../app/lib/schema";
import { generateCardKeyCode } from "../app/lib/card-keys";
import { ROLES } from "../app/lib/permissions";

async function createTestCardKey() {
  console.log("🎫 创建测试卡密...");
  
  const db = createDb();
  
  // 确保临时用户角色存在
  let tempRole = await db.query.roles.findFirst({
    where: (roles, { eq }) => eq(roles.name, ROLES.TEMP_USER),
  });
  
  if (!tempRole) {
    console.log("📝 创建临时用户角色...");
    const [newRole] = await db
      .insert(roles)
      .values({
        name: ROLES.TEMP_USER,
        description: "临时用户，只能访问绑定的邮箱",
      })
      .returning();
    tempRole = newRole;
    console.log("✅ 临时用户角色创建成功");
  }
  
  // 生成测试卡密
  const testCardKey = generateCardKeyCode();
  const testEmail = `test-${Date.now()}@xiyang.app`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天后过期
  
  await db.insert(cardKeys).values({
    code: testCardKey,
    emailAddress: testEmail,
    expiresAt,
    createdAt: new Date(),
  });
  
  console.log("🎉 测试卡密创建成功！");
  console.log("📋 卡密信息：");
  console.log(`   卡密: ${testCardKey}`);
  console.log(`   邮箱: ${testEmail}`);
  console.log(`   过期时间: ${expiresAt.toLocaleString()}`);
  console.log("");
  console.log("🔗 请在浏览器中访问 http://localhost:3000 并使用此卡密登录测试");
}

createTestCardKey().catch(console.error);
