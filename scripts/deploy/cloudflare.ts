import Cloudflare from "cloudflare";
import "dotenv/config";

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const PROJECT_URL = process.env.PROJECT_URL;
const PROJECT_NAME = process.env.PROJECT_NAME || "moemail";
const DB_NAME = process.env.DATABASE_NAME || "moemail-db";
const KV_NAMESPACE_NAME = process.env.KV_NAME || "moemail-kv";

const client = new Cloudflare({
  apiKey: CF_API_TOKEN,
});

export const getPages = async () => {
  try {
    const projectInfo = await client.pages.projects.get(PROJECT_NAME, {
      account_id: CF_ACCOUNT_ID,
    });

    return projectInfo;
  } catch (error) {
    throw error;
  }
};

export const createPages = async () => {
  try {
    console.log(`🆕 Creating new Cloudflare Pages project: "${PROJECT_NAME}"`);

    const project = await client.pages.projects.create({
      account_id: CF_ACCOUNT_ID,
      name: PROJECT_NAME,
      production_branch: "main",
    });

    if (PROJECT_URL) {
      console.log("🔗 Setting pages domain...");

      await client.pages.projects.domains.create(PROJECT_NAME, {
        account_id: CF_ACCOUNT_ID,
        name: PROJECT_URL?.split("://")[1],
      });

      console.log("✅ Pages domain set successfully");
    }

    console.log("✅ Project created successfully");

    return project;
  } catch (error) {
    throw error;
  }
};

export const getDatabase = async () => {
  try {
    const database = await client.d1.database.get(DB_NAME, {
      account_id: CF_ACCOUNT_ID,
    });

    return database;
  } catch (error) {
    throw error;
  }
};

export const createDatabase = async () => {
  try {
    console.log(`🆕 Creating new D1 database: "${DB_NAME}"`);
    const database = await client.d1.database.create({
      account_id: CF_ACCOUNT_ID,
      name: DB_NAME,
    });
    console.log("✅ Database created successfully");

    return database;
  } catch (error) {
    throw error;
  }
};

export const getKVNamespace = async (namespaceId: string) => {
  if (!namespaceId) {
    throw new Error("KV namespace ID is required");
  }
  
  try {
    const kvNamespace = await client.kv.namespaces.get(namespaceId, {
      account_id: CF_ACCOUNT_ID,
    });

    return kvNamespace;
  } catch (error) {
    throw error;
  }
};

export const createKVNamespace = async () => {
  try {
    console.log(`🆕 Creating new KV namespace: "${KV_NAMESPACE_NAME}"`);
    const kvNamespace = await client.kv.namespaces.create({
      account_id: CF_ACCOUNT_ID,
      title: KV_NAMESPACE_NAME,
    });
    console.log("✅ KV namespace created successfully");

    return kvNamespace;
  } catch (error) {
    throw error;
  }
};