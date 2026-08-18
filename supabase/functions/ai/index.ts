import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";

const RATE_LIMIT_WINDOW_SECONDS = 300;
const RATE_LIMIT_MAX_REQUESTS = 20;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const { client } = await requireUser(req);

    const { prompt, jsonMode } = await req.json();
    if (typeof prompt !== "string" || prompt.trim().length === 0) {
      return jsonResponse({ error: "Prompt is required" }, 400);
    }

    if (prompt.length > 60000) {
      return jsonResponse({ error: "Prompt is too large" }, 413);
    }

    const { data: rateLimit, error: rateLimitError } = await client
      .rpc("check_ai_rate_limit", {
        p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
        p_max_requests: RATE_LIMIT_MAX_REQUESTS,
      })
      .single();

    if (rateLimitError) throw rateLimitError;

    if (!rateLimit?.allowed) {
      return jsonResponse(
        { error: `Rate limit exceeded. Try again in ${rateLimit?.retry_after_seconds ?? RATE_LIMIT_WINDOW_SECONDS}s.` },
        429,
      );
    }

    const apiKey = Deno.env.get("GROQ_API_KEY");
    if (!apiKey) return jsonResponse({ error: "Groq API key is not configured" }, 500);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        model: Deno.env.get("GROQ_MODEL") ?? "openai/gpt-oss-120b",
        temperature: 0.7,
        max_completion_tokens: 4096,
        top_p: 0.9,
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return jsonResponse({ error: data?.error?.message ?? "AI request failed" }, response.status);
    }

    return jsonResponse({ text: data?.choices?.[0]?.message?.content ?? "" });
  } catch (error) {
    if (error instanceof Response) {
      return new Response(error.body, {
        status: error.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return jsonResponse({ error: "AI request failed" }, 500);
  }
});
