/**
 * 测试环境变量配置脚本
 * 用于验证 Cloudflare 部署环境中的环境变量是否正确设置
 */

console.log("🔍 检查环境变量配置...");

const requiredVars = ['AUTH_SECRET'];
const optionalVars = ['AUTH_GITHUB_ID', 'AUTH_GITHUB_SECRET'];

console.log("\n📋 必需的环境变量:");
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const length = value ? value.length : 0;
  console.log(`${status} ${varName}: ${value ? `已设置 (长度: ${length})` : '未设置'}`);
});

console.log("\n📋 可选的环境变量:");
optionalVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '⚠️';
  console.log(`${status} ${varName}: ${value ? '已设置' : '未设置'}`);
});

// 检查 AUTH_SECRET 的有效性
const authSecret = process.env.AUTH_SECRET;
if (authSecret) {
  if (authSecret.length < 32) {
    console.log("\n⚠️ 警告: AUTH_SECRET 长度少于32字符，建议使用更长的密钥");
  } else {
    console.log("\n✅ AUTH_SECRET 长度符合要求");
  }
} else {
  console.log("\n❌ 错误: AUTH_SECRET 未设置，这将导致 NextAuth Configuration 错误");
}

console.log("\n🎯 建议:");
console.log("1. 确保在 GitHub Secrets 或 .env 文件中设置了 AUTH_SECRET");
console.log("2. AUTH_SECRET 应该是一个至少32字符的随机字符串");
console.log("3. 如果使用 GitHub OAuth，需要设置 AUTH_GITHUB_ID 和 AUTH_GITHUB_SECRET");
console.log("4. 部署后检查 Cloudflare Pages Functions 的环境变量设置");
