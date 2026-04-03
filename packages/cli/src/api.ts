import { loadConfig } from "./config.js";
import { log } from "./output.js";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<unknown> {
  const config = loadConfig();

  if (!config.apiUrl) {
    log("Error: API URL not configured. Run: moemail config set api-url <url>");
    process.exit(2);
  }
  if (!config.apiKey) {
    log("Error: API Key not configured. Run: moemail config set api-key <key>");
    process.exit(2);
  }

  const url = `${config.apiUrl.replace(/\/$/, "")}${path}`;
  const headers: Record<string, string> = {
    "X-API-Key": config.apiKey,
  };
  if (body) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 || res.status === 403) {
    log("Error: Authentication failed. Check your API Key.");
    process.exit(2);
  }

  if (res.status === 204) {
    return null;
  }

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(res.status, (data as any).error || `HTTP ${res.status}`);
  }

  return data;
}

export const api = {
  getConfig: () => request("GET", "/api/config"),

  createEmail: (body: { name?: string; expiryTime: number; domain: string; subdomain?: string }) =>
    request("POST", "/api/emails/generate", body as any),

  listEmails: (cursor?: string) =>
    request("GET", `/api/emails${cursor ? `?cursor=${cursor}` : ""}`),

  listMessages: (emailId: string, cursor?: string) =>
    request("GET", `/api/emails/${emailId}${cursor ? `?cursor=${cursor}` : ""}`),

  getMessage: (emailId: string, messageId: string) =>
    request("GET", `/api/emails/${emailId}/${messageId}`),

  deleteEmail: (emailId: string) =>
    request("DELETE", `/api/emails/${emailId}`),

  deleteMessage: (emailId: string, messageId: string) =>
    request("DELETE", `/api/emails/${emailId}/${messageId}`),

  sendEmail: (emailId: string, body: { to: string; subject: string; content: string }) =>
    request("POST", `/api/emails/${emailId}/send`, body),
};
