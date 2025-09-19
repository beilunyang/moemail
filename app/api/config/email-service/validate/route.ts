export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { apiKey } = (await req.json()) as { apiKey?: string };
    if (!apiKey) {
      return new Response(JSON.stringify({ ok: false, error: "缺少 apiKey" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 轻量校验策略：
    // 1) 尝试 GET /emails?limit=1
    // 2) 若返回 200 -> 视为有效
    // 3) 若返回 401/403 且提示 “restricted to only send emails” -> 该 Key 为发送权限受限的 Restricted Key，
    //    对本系统“只用于发件”同样有效，因此也视为有效
    const res = await fetch("https://api.resend.com/emails?limit=1", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const status = res.status;
    let detail = "";
    try {
      const data: any = await res.json();
      const msg = (data?.message || data?.error || "").toString();
      // 允许 Restricted Key 的典型报错文案（Resend 官方错误信息）
      // e.g. "This API key is restricted to only send emails."
      const isRestrictedSendOnly =
        /restricted\s+to\s+only\s+send\s+emails/i.test(msg);
      if ((status === 401 || status === 403) && isRestrictedSendOnly) {
        return new Response(JSON.stringify({ ok: true, restricted: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      detail = msg || JSON.stringify(data) || "";
    } catch {}

    return new Response(
      JSON.stringify({
        ok: false,
        error: detail || `Resend 校验失败 (${status})`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
