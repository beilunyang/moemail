/**
 * Cloudflare Worker for cleaning up expired temporary accounts
 * This worker runs on a schedule to automatically clean up expired temporary accounts
 */

interface Env {
  SITE_URL: string;
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log("开始清理过期临时账号...");

    try {
      const response = await fetch(
        `${env.SITE_URL}/api/cleanup/temp-accounts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `清理请求失败: ${response.status} ${response.statusText}`
        );
      }

      const result = (await response.json()) as {
        success: boolean;
        cleanedCount?: number;
        error?: string;
      };
      console.log("清理结果:", result);

      if (result.success) {
        console.log(`成功清理了 ${result.cleanedCount} 个过期临时账号`);
      } else {
        console.error("清理失败:", result.error);
      }
    } catch (error) {
      console.error("清理过期临时账号时发生错误:", error);
    }
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    // 支持手动触发清理
    if (request.method === "POST") {
      try {
        const response = await fetch(
          `${env.SITE_URL}/api/cleanup/temp-accounts`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const result = (await response.json()) as {
          success: boolean;
          cleanedCount?: number;
          error?: string;
        };
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
          status: response.status,
        });
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : "清理失败",
          }),
          {
            headers: { "Content-Type": "application/json" },
            status: 500,
          }
        );
      }
    }

    return new Response("Temporary Account Cleanup Worker", {
      headers: { "Content-Type": "text/plain" },
    });
  },
};
