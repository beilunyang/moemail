import { NotFoundError } from "cloudflare";
import "dotenv/config";
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  createDatabase,
  createKVNamespace,
  createPages,
  getDatabase,
  getKVNamespace,
  getPages,
} from "./cloudflare";

const PROJECT_NAME = process.env.PROJECT_NAME || "moemail";
const DATABASE_NAME = process.env.DATABASE_NAME || "moemail-db";
const KV_NAMESPACE_NAME = process.env.KV_NAME || "moemail-kv";
const PROJECT_URL = process.env.PROJECT_URL;
const DATABASE_ID = process.env.DATABASE_ID || "";
const KV_NAMESPACE_ID = process.env.KV_NAMESPACE_ID || "";

/**
 * 验证必要的环境变量
 */
const validateEnvironment = () => {
  const requiredEnvVars = ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN"];
  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
};

/**
 * 处理JSON配置文件
 */
const setupConfigFile = (examplePath: string, targetPath: string) => {
  try {
    // 如果目标文件已存在，则跳过
    if (existsSync(targetPath)) {
      console.log(`✨ Configuration ${targetPath} already exists.`);
      return;
    }

    if (!existsSync(examplePath)) {
      console.log(`⚠️ Example file ${examplePath} does not exist, skipping...`);
      return;
    }

    const configContent = readFileSync(examplePath, "utf-8");
    const json = JSON.parse(configContent);

    // 处理数据库配置
    if (json.d1_databases && json.d1_databases.length > 0) {
      json.d1_databases[0].database_name = DATABASE_NAME;
      if (DATABASE_ID) {
        json.d1_databases[0].database_id = DATABASE_ID;
      }
    }

    // 处理KV配置
    if (json.kv_namespaces && json.kv_namespaces.length > 0 && KV_NAMESPACE_ID) {
      json.kv_namespaces[0].id = KV_NAMESPACE_ID;
    }

    // 写入配置文件
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
const setupWranglerConfigs = () => {
  console.log("🔧 Setting up Wrangler configuration files...");

  const configs = [
    { example: "wrangler.example.json", target: "wrangler.json" },
    { example: "wrangler.email.example.json", target: "wrangler.email.json" },
    { example: "wrangler.cleanup.example.json", target: "wrangler.cleanup.json" },
  ];

  // 处理每个配置文件
  for (const config of configs) {
    setupConfigFile(
      resolve(config.example),
      resolve(config.target)
    );
  }
};

/**
 * 更新数据库ID到所有配置文件
 */
const updateDatabaseConfig = (dbId: string) => {
  console.log(`📝 Updating database ID (${dbId}) in configurations...`);

  // 更新环境变量
  updateEnvVar("DATABASE_ID", dbId);

  // 更新所有配置文件
  const configFiles = [
    "wrangler.json",
    "wrangler.email.json",
    "wrangler.cleanup.json",
  ];
  
  for (const filename of configFiles) {
    const configPath = resolve(filename);
    if (!existsSync(configPath)) continue;
    
    try {
      const json = JSON.parse(readFileSync(configPath, "utf-8"));
      if (json.d1_databases && json.d1_databases.length > 0) {
        json.d1_databases[0].database_id = dbId;
      }
      writeFileSync(configPath, JSON.stringify(json, null, 2));
      console.log(`✅ Updated database ID in ${filename}`);
    } catch (error) {
      console.error(`❌ Failed to update ${filename}:`, error);
    }
  }
};

/**
 * 更新KV命名空间ID到所有配置文件
 */
const updateKVConfig = (namespaceId: string) => {
  console.log(`📝 Updating KV namespace ID (${namespaceId}) in configurations...`);
  
  // 更新环境变量
  updateEnvVar("KV_NAMESPACE_ID", namespaceId);

  // KV命名空间只在主wrangler.json中使用
  const wranglerPath = resolve("wrangler.json");
  if (existsSync(wranglerPath)) {
    try {
      const json = JSON.parse(readFileSync(wranglerPath, "utf-8"));
      if (json.kv_namespaces && json.kv_namespaces.length > 0) {
        json.kv_namespaces[0].id = namespaceId;
      }
      writeFileSync(wranglerPath, JSON.stringify(json, null, 2));
      console.log(`✅ Updated KV namespace ID in wrangler.json`);
    } catch (error) {
      console.error(`❌ Failed to update wrangler.json:`, error);
    }
  }
};

/**
 * 检查并创建数据库
 */
const checkAndCreateDatabase = async () => {
  console.log(`🔍 Checking if database "${DATABASE_NAME}" exists...`);

  try {
    const database = await getDatabase();
    
    if (!database || !database.uuid) {
      throw new Error('Database object is missing a valid UUID');
    }
    
    updateDatabaseConfig(database.uuid);
    console.log(`✅ Database "${DATABASE_NAME}" already exists (ID: ${database.uuid})`);
  } catch (error) {
    if (error instanceof NotFoundError) {
      console.log(`⚠️ Database not found, creating new database...`);
      try {
        const database = await createDatabase();
        
        if (!database || !database.uuid) {
          throw new Error('Database object is missing a valid UUID');
        }
        
        updateDatabaseConfig(database.uuid);
        console.log(`✅ Database "${DATABASE_NAME}" created successfully (ID: ${database.uuid})`);
      } catch (createError) {
        console.error(`❌ Failed to create database:`, createError);
        throw createError;
      }
    } else {
      console.error(`❌ An error occurred while checking the database:`, error);
      throw error;
    }
  }
};

/**
 * 迁移数据库
 */
const migrateDatabase = () => {
  console.log("📝 Migrating remote database...");
  try {
    execSync("pnpm run db:migrate-remote", { stdio: "inherit" });
    console.log("✅ Database migration completed successfully");
  } catch (error) {
    console.error("❌ Database migration failed:", error);
    throw error;
  }
};

/**
 * 检查并创建KV命名空间
 */
const checkAndCreateKVNamespace = async () => {
  console.log(`🔍 Checking if KV namespace "${KV_NAMESPACE_NAME}" exists...`);

  try {
    if (!KV_NAMESPACE_ID) {
      console.log("⚠️ KV_NAMESPACE_ID is not set, creating a new KV namespace...");
      const namespace = await createKVNamespace();
      updateKVConfig(namespace.id);
      console.log(`✅ KV namespace "${KV_NAMESPACE_NAME}" created successfully (ID: ${namespace.id})`);
      return;
    }

    const namespace = await getKVNamespace(KV_NAMESPACE_ID);
    console.log(`✅ KV namespace "${KV_NAMESPACE_NAME}" already exists (ID: ${namespace.id})`);
  } catch (error) {
    if (error instanceof NotFoundError || (error instanceof Error && error.message?.includes("required"))) {
      console.log(`⚠️ KV namespace not found or invalid, creating new KV namespace...`);
      try {
        const namespace = await createKVNamespace();
        updateKVConfig(namespace.id);
        console.log(`✅ KV namespace "${KV_NAMESPACE_NAME}" created successfully (ID: ${namespace.id})`);
      } catch (createError) {
        console.error(`❌ Failed to create KV namespace:`, createError);
        throw createError;
      }
    } else {
      console.error(`❌ An error occurred while checking the KV namespace:`, error);
      throw error;
    }
  }
};

/**
 * 检查并创建Pages项目
 */
const checkAndCreatePages = async () => {
  console.log(`🔍 Checking if project "${PROJECT_NAME}" exists...`);

  try {
    await getPages();
    console.log("✅ Project already exists, proceeding with update...");
  } catch (error) {
    if (error instanceof NotFoundError) {
      console.log("⚠️ Project not found, creating new project...");
      const pages = await createPages();

      if (!PROJECT_URL && pages.subdomain) {
        console.log("⚠️ PROJECT_URL is empty, using pages default domain...");
        console.log("📝 Updating environment variables...");
        
        // 更新环境变量为默认的Pages域名
        const appUrl = `https://${pages.subdomain}`;
        updateEnvVar("PROJECT_URL", appUrl);
      }
    } else {
      console.error(`❌ An error occurred while checking the project:`, error);
      throw error;
    }
  }
};

/**
 * 推送Pages密钥
 */
const pushPagesSecret = () => {
  console.log("🔐 Pushing environment secrets to Pages...");
  
  try {
    // 确保.env文件存在
    if (!existsSync(resolve('.env'))) {
      setupEnvFile();
    }
    
    execSync(`pnpm dlx wrangler pages secret bulk .env`, { stdio: "inherit" });
    console.log("✅ Secrets pushed successfully");
  } catch (error) {
    console.error("❌ Failed to push secrets:", error);
    throw error;
  }
};

/**
 * 部署Pages应用
 */
const deployPages = () => {
  console.log("🚧 Deploying to Cloudflare Pages...");
  try {
    execSync("pnpm run build:pages && pnpm dlx wrangler pages deploy .vercel/output/static --branch main", { stdio: "inherit" });
    console.log("✅ Pages deployment completed successfully");
  } catch (error) {
    console.error("❌ Pages deployment failed:", error);
    throw error;
  }
};

/**
 * 部署Email Worker
 */
const deployEmailWorker = () => {
  console.log("🚧 Deploying Email Worker...");
  try {
    execSync("pnpm dlx wrangler deploy --config wrangler.email.json", { stdio: "inherit" });
    console.log("✅ Email Worker deployed successfully");
  } catch (error) {
    console.error("❌ Email Worker deployment failed:", error);
    // 继续执行而不中断
  }
};

/**
 * 部署Cleanup Worker
 */
const deployCleanupWorker = () => {
  console.log("🚧 Deploying Cleanup Worker...");
  try {
    execSync("pnpm dlx wrangler deploy --config wrangler.cleanup.json", { stdio: "inherit" });
    console.log("✅ Cleanup Worker deployed successfully");
  } catch (error) {
    console.error("❌ Cleanup Worker deployment failed:", error);
    // 继续执行而不中断
  }
};

/**
 * 创建或更新环境变量文件
 */
const setupEnvFile = () => {
  console.log("📄 Setting up environment file...");
  const envFilePath = resolve(".env");
  const envExamplePath = resolve(".env.example");
  
  // 如果.env文件不存在，则从.env.example复制创建
  if (!existsSync(envFilePath) && existsSync(envExamplePath)) {
    console.log("⚠️ .env file does not exist, creating from example...");
    
    // 从示例文件复制
    let envContent = readFileSync(envExamplePath, "utf-8");
    
    // 填充当前的环境变量
    const envVarMatches = envContent.match(/^([A-Z_]+)\s*=\s*".*?"/gm);
    if (envVarMatches) {
      for (const match of envVarMatches) {
        const varName = match.split("=")[0].trim();
        if (process.env[varName]) {
          const regex = new RegExp(`${varName}\\s*=\\s*".*?"`, "g");
          envContent = envContent.replace(regex, `${varName} = "${process.env[varName]}"`);
        }
      }
    }
    
    writeFileSync(envFilePath, envContent);
    console.log("✅ .env file created from example");
  } else if (existsSync(envFilePath)) {
    console.log("✨ .env file already exists");
  } else {
    console.error("❌ .env.example file not found!");
    throw new Error(".env.example file not found");
  }
};

/**
 * 更新环境变量
 */
const updateEnvVar = (name: string, value: string) => {
  // 首先更新进程环境变量
  process.env[name] = value;
  
  // 然后尝试更新.env文件
  const envFilePath = resolve(".env");
  if (!existsSync(envFilePath)) {
    setupEnvFile();
  }
  
  let envContent = readFileSync(envFilePath, "utf-8");
  const regex = new RegExp(`^${name}\\s*=\\s*".*?"`, "m");
  
  if (envContent.match(regex)) {
    envContent = envContent.replace(regex, `${name} = "${value}"`);
  } else {
    envContent += `\n${name} = "${value}"`;
  }
  
  writeFileSync(envFilePath, envContent);
  console.log(`✅ Updated ${name} in .env file`);
};

/**
 * 主函数
 */
const main = async () => {
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
