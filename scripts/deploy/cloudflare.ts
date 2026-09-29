import Cloudflare from "cloudflare";
import "dotenv/config";

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CUSTOM_DOMAIN = process.env.CUSTOM_DOMAIN;
const PROJECT_NAME = process.env.PROJECT_NAME || "moemail";
const DATABASE_NAME = process.env.DATABASE_NAME || "moemail-db";
const KV_NAMESPACE_NAME = process.env.KV_NAMESPACE_NAME || "moemail-kv";
const DATABASE_ID = process.env.DATABASE_ID;

const client = new Cloudflare({
  apiKey: CF_API_TOKEN,
});

export const getPages = async () => {
  const projectInfo = await client.pages.projects.get(PROJECT_NAME, {
    account_id: CF_ACCOUNT_ID,
  });

  return projectInfo;
};

export const createPages = async () => {
  console.log(`🆕 Creating new Cloudflare Pages project: "${PROJECT_NAME}"`);

  const project = await client.pages.projects.create({
    account_id: CF_ACCOUNT_ID,
    name: PROJECT_NAME,
    production_branch: "master",
  });

  if (CUSTOM_DOMAIN) {
    console.log("🔗 Setting pages domain...");

    await client.pages.projects.domains.create(PROJECT_NAME, {
      account_id: CF_ACCOUNT_ID,
      name: CUSTOM_DOMAIN,
    });

    console.log("✅ Pages domain set successfully");
  }

  console.log("✅ Project created successfully");

  return project;
};

export const getDatabase = async () => {
  if (DATABASE_ID) {
    return {
      uuid: DATABASE_ID,
    }
  }

  const database = await client.d1.database.get(DATABASE_NAME, {
    account_id: CF_ACCOUNT_ID,
  });

  return database;
};

export const createDatabase = async () => {
  console.log(`🆕 Creating new D1 database: "${DATABASE_NAME}"`);

  const database = await client.d1.database.create({
    account_id: CF_ACCOUNT_ID,
    name: DATABASE_NAME,
  });

  console.log("✅ Database created successfully");

  return database;
};

export const getKVNamespaceList = async () => {
  const kvNamespaces = [];

  for await (const namespace of client.kv.namespaces.list({
    account_id: CF_ACCOUNT_ID,
  })) {
    kvNamespaces.push(namespace);
  }

  return kvNamespaces;
};

export const createKVNamespace = async () => {
  console.log(`🆕 Creating new KV namespace: "${KV_NAMESPACE_NAME}"`);

  const kvNamespace = await client.kv.namespaces.create({
    account_id: CF_ACCOUNT_ID,
    title: KV_NAMESPACE_NAME,
  });

  console.log("✅ KV namespace created successfully");

  return kvNamespace;
};
