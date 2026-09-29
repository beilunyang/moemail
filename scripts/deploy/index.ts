import { NotFoundError } from "cloudflare";
import "dotenv/config";
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import {
  createDatabase,
  createKVNamespace,
  createPages,
  getDatabase,
  getKVNamespaceList,
  getPages,
} from "./cloudflare";

// ============================================
// 常量定义
// ============================================

const PROJECT_NAME = process.env.PROJECT_NAME || "moemail";
const DATABASE_NAME = process.env.DATABASE_NAME || "moemail-db";
const KV_NAMESPACE_NAME = process.env.KV_NAMESPACE_NAME || "moemail-kv";
const CUSTOM_DOMAIN = process.env.CUSTOM_DOMAIN;
const KV_NAMESPACE_ID = process.env.KV_NAMESPACE_ID;

const RUNTIME_ENV_VARS = [
  "AUTH_GITHUB_ID",
  "AUTH_GITHUB_SECRET",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "AUTH_SECRET",
] as const;

// ============================================
// 工具函数
// ============================================

/**
 * 验证必要的环境变量
 */
const validateEnvironment = (): void => {
  const requiredEnvVars = ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN"];
  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
};

/**
 * 解析 .env 文件内容为键值对对象
 * 支持无引号、单引号、双引号三种格式
 */
const parseEnvContent = (content: string): Record<string, string> => {
  const result: Record<string, string> = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalIndex = trimmed.indexOf("=");
    if (equalIndex === -1) continue;

    const key = trimmed.substring(0, equalIndex).trim();
    const raw = trimmed.substring(equalIndex + 1).trim();
    const value = raw.replace(/^(["'])(.*)\1$/, "$2");

    if (key) result[key] = value;
  }

  return result;
};

/**
 * 更新指定 JSON 配置文件中的字段（通用）
 */
const updateJsonConfig = (
  filePath: string,
  updater: (json: Record<string, unknown>) => void
): void => {
  if (!existsSync(filePath)) return;

  try {
    const json = JSON.parse(readFileSync(filePath, "utf-8"));
    updater(json);
    writeFileSync(filePath, JSON.stringify(json, null, 2));
    console.log(`✅ Updated ${filePath}`);
  } catch (error) {
    console.error(`❌ Failed to update ${filePath}:`, error);
  }
};

// ============================================
// 配置管理函数
// ============================================

/**
 * 处理JSON配置文件
 */
const setupConfigFile = (examplePath: string, targetPath: string): void => {
  try {
    if (existsSync(targetPath)) {
      console.log(`✨ Configuration ${targetPath} already exists.`);
      return;
    }

    if (!existsSync(examplePath)) {
      console.log(
        `⚠️ Example file ${examplePath} does not exist, skipping...`
      );
      return;
    }

    const configContent = readFileSync(examplePath, "utf-8");
    const json = JSON.parse(configContent);

    // 处理自定义项目名称
    if (PROJECT_NAME !== "moemail") {
      const wranglerFileName = targetPath.split("/").at(-1);

      switch (wranglerFileName) {
        case "wrangler.json":
          json.name = PROJECT_NAME;
          break;
        case "wrangler.email.json":
          json.name = `${PROJECT_NAME}-email-receiver-worker`;
          break;
        case "wrangler.cleanup.json":
          json.name = `${PROJECT_NAME}-cleanup-worker`;
          break;
      }
    }

    // 处理数据库配置
    if (json.d1_databases && json.d1_databases.length > 0) {
      json.d1_databases[0].database_name = DATABASE_NAME;
    }

    writeFileSync(targetPath, JSON.stringify(json, null, 2));
    console.log(`✅ Configuration ${targetPath} setup successfully.`);
  } catch (error) {
    console.error(`❌ Failed to setup ${targetPath}:`, error);
    throw error;
  }
};

/**
 * 设置所有Wrangler配置文件
 */
const setupWranglerConfigs = (): void => {
  console.log("🔧 Setting up Wrangler configuration files...");

  const configs = [
    { example: "wrangler.example.json", target: "wrangler.json" },
    { example: "wrangler.email.example.json", target: "wrangler.email.json" },
    {
      example: "wrangler.cleanup.example.json",
      target: "wrangler.cleanup.json",
    },
  ];

  for (const config of configs) {
    setupConfigFile(resolve(config.example), resolve(config.target));
  }
};

/**
 * 更新数据库ID到所有配置文件
 */
const updateDatabaseConfig = (dbId: string): void => {
  console.log(`📝 Updating database ID (${dbId}) in configurations...`);

  const configFiles = [
    "wrangler.json",
    "wrangler.email.json",
    "wrangler.cleanup.json",
  ];

  for (const filename of configFiles) {
    updateJsonConfig(resolve(filename), (json) => {
      const db = (json.d1_databases as Array<Record<string, string>>)?.[0];
      if (db) db.database_id = dbId;
    });
  }
};

/**
 * 更新KV命名空间ID到所有配置文件
 */
const updateKVConfig = (namespaceId: string): void => {
  console.log(`📝 Updating KV namespace ID (${namespaceId}) in configurations...`);

  updateJsonConfig(resolve("wrangler.json"), (json) => {
    const kv = (json.kv_namespaces as Array<Record<string, string>>)?.[0];
    if (kv) kv.id = namespaceId;
  });
};

// ============================================
// 数据库操作函数
// ============================================

/**
 * 检查并创建数据库
 */
const checkAndCreateDatabase = async (): Promise<void> => {
  console.log(`🔍 Checking if database "${DATABASE_NAME}" exists...`);

  try {
    const database = await getDatabase();
    if (!database?.uuid) throw new Error("Database object is missing a valid UUID");

    updateDatabaseConfig(database.uuid);
    console.log(
      `✅ Database "${DATABASE_NAME}" already exists (ID: ${database.uuid})`
    );
  } catch (error) {
    if (!(error instanceof NotFoundError)) {
      console.error("❌ An error occurred while checking the database:", error);
      throw error;
    }

    console.log("⚠️ Database not found, creating new database...");
    const database = await createDatabase();
    if (!database?.uuid) throw new Error("Database object is missing a valid UUID");

    updateDatabaseConfig(database.uuid);
    console.log(
      `✅ Database "${DATABASE_NAME}" created successfully (ID: ${database.uuid})`
    );
  }
};

/**
 * 迁移数据库
 */
const migrateDatabase = (): void => {
  console.log("📝 Migrating remote database...");
  try {
    execSync("pnpm run db:migrate-remote", { stdio: "inherit" });
    console.log("✅ Database migration completed successfully");
  } catch (error) {
    console.error("❌ Database migration failed:", error);
    throw error;
  }
};

// ============================================
// KV 命名空间操作函数
// ============================================

/**
 * 检查并创建KV命名空间
 */
const checkAndCreateKVNamespace = async (): Promise<void> => {
  console.log(
    `🔍 Checking if KV namespace "${KV_NAMESPACE_NAME}" exists...`
  );

  if (KV_NAMESPACE_ID) {
    updateKVConfig(KV_NAMESPACE_ID);
    console.log(`✅ User specified KV namespace (ID: ${KV_NAMESPACE_ID})`);
    return;
  }

  try {
    const namespaceList = await getKVNamespaceList();
    const existing = namespaceList.find((ns) => ns.title === KV_NAMESPACE_NAME);

    if (existing?.id) {
      updateKVConfig(existing.id);
      console.log(
        `✅ KV namespace "${KV_NAMESPACE_NAME}" found by name (ID: ${existing.id})`
      );
    } else {
      console.log(
        "⚠️ KV namespace not found by name, creating new KV namespace..."
      );
      const namespace = await createKVNamespace();
      updateKVConfig(namespace.id);
      console.log(
        `✅ KV namespace "${KV_NAMESPACE_NAME}" created successfully (ID: ${namespace.id})`
      );
    }
  } catch (error) {
    console.error(
      "❌ An error occurred while checking the KV namespace:",
      error
    );
    throw error;
  }
};

// ============================================
// Pages 项目操作函数
// ============================================

/**
 * 检查并创建Pages项目
 */
const checkAndCreatePages = async (): Promise<void> => {
  console.log(`🔍 Checking if project "${PROJECT_NAME}" exists...`);

  try {
    await getPages();
    console.log("✅ Project already exists, proceeding with update...");
  } catch (error) {
    if (!(error instanceof NotFoundError)) {
      console.error("❌ An error occurred while checking the project:", error);
      throw error;
    }

    console.log("⚠️ Project not found, creating new project...");
    const pages = await createPages();

    if (!CUSTOM_DOMAIN && pages.subdomain) {
      console.log(
        "⚠️ CUSTOM_DOMAIN is empty, using pages default domain..."
      );
      console.log("📝 Updating environment variables...");
      updateEnvVar("CUSTOM_DOMAIN", `https://${pages.subdomain}`);
    }
  }
};

/**
 * 推送Pages密钥
 */
const pushPagesSecret = (): void => {
  console.log("🔐 Pushing environment secrets to Pages...");

  const envFilePath = resolve(".env");
  if (!existsSync(envFilePath)) setupEnvFile();

  const envVars = parseEnvContent(readFileSync(envFilePath, "utf-8"));
  const secrets: Record<string, string> = {};

  for (const key of RUNTIME_ENV_VARS) {
    if (envVars[key]) secrets[key] = envVars[key];
  }

  if (Object.keys(secrets).length === 0) {
    console.log("⚠️ No runtime secrets found to push");
    return;
  }

  console.log(
    `📝 Found ${Object.keys(secrets).length} secrets to push:`,
    Object.keys(secrets).join(", ")
  );

  const runtimeEnvFile = resolve(".env.runtime.json");
  const cleanupRuntimeEnvFile = (): void => {
    if (!existsSync(runtimeEnvFile)) return;
    try {
      unlinkSync(runtimeEnvFile);
    } catch (cleanupError) {
      console.error("⚠️ Failed to cleanup temporary file:", cleanupError);
    }
  };

  try {
    writeFileSync(runtimeEnvFile, JSON.stringify(secrets, null, 2));
    execSync(`pnpm dlx wrangler pages secret bulk ${runtimeEnvFile}`, {
      stdio: "inherit",
    });
    console.log("✅ Secrets pushed successfully");
    cleanupRuntimeEnvFile();
  } catch (err) {
    cleanupRuntimeEnvFile();
    throw err;
  }
};

// ============================================
// 部署函数
// ============================================

/**
 * 部署Pages应用
 */
const deployPages = (): void => {
  console.log("🚧 Deploying to Cloudflare Pages...");
  try {
    execSync("pnpm run deploy:pages", { stdio: "inherit" });
    console.log("✅ Pages deployment completed successfully");
  } catch (error) {
    console.error("❌ Pages deployment failed:", error);
    throw error;
  }
};

/**
 * 部署Email Worker
 */
const deployEmailWorker = (): void => {
  console.log("🚧 Deploying Email Worker...");
  try {
    execSync("pnpm dlx wrangler deploy --config wrangler.email.json", {
      stdio: "inherit",
    });
    console.log("✅ Email Worker deployed successfully");
  } catch (error) {
    console.error("❌ Email Worker deployment failed:", error);
    // 继续执行而不中断
  }
};

/**
 * 部署Cleanup Worker
 */
const deployCleanupWorker = (): void => {
  console.log("🚧 Deploying Cleanup Worker...");
  try {
    execSync("pnpm dlx wrangler deploy --config wrangler.cleanup.json", {
      stdio: "inherit",
    });
    console.log("✅ Cleanup Worker deployed successfully");
  } catch (error) {
    console.error("❌ Cleanup Worker deployment failed:", error);
    // 继续执行而不中断
  }
};

// ============================================
// 环境变量管理函数
// ============================================

/**
 * 更新环境变量
 */
const updateEnvVar = (key: string, value: string): void => {
  const envPath = resolve(".env");
  let content = "";

  if (existsSync(envPath)) {
    content = readFileSync(envPath, "utf-8");
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
  } else {
    content = `${key}=${value}`;
  }

  writeFileSync(envPath, content);
};

/**
 * 创建 .env 文件
 */
const setupEnvFile = (): void => {
  const envPath = resolve(".env");
  if (!existsSync(envPath)) {
    writeFileSync(
      envPath,
      `# Environment variables for ${PROJECT_NAME}\nCLOUDFLARE_ACCOUNT_ID=\nCLOUDFLARE_API_TOKEN=\nCUSTOM_DOMAIN=\n`
    );
    console.log("✅ Created .env file");
  }
};

// ============================================
// 主函数
// ============================================

/**
 * 主函数
 */
const main = async (): Promise<void> => {
  try {
    console.log("🚀 Starting deployment process...");

    validateEnvironment();
    setupEnvFile();
    setupWranglerConfigs();
    await checkAndCreateDatabase();
    migrateDatabase();
    await checkAndCreateKVNamespace();
    await checkAndCreatePages();
    pushPagesSecret();
    deployPages();
    deployEmailWorker();
    deployCleanupWorker();

    console.log("🎉 Deployment completed successfully");
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
};

main();
