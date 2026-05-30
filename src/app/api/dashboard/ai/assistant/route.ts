import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { withErrorHandler, unauthorized, forbidden, tooMany } from "@/lib/api-handler";
import { rateLimit } from "@/lib/rate-limit";
import { hasFeature } from "@/lib/features";
import { chatComplete, type ChatMessage } from "@/lib/ai";
import { buildBusinessContext, assistantSystemPrompt } from "@/lib/ai-context";

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(20),
});

/**
 * Grounded AI business assistant.
 *
 * Injects a real-time snapshot of the tenant's business (sales, stock,
 * customers, forecast, promos) as a system prompt, then answers the user's
 * conversation. Pro+ feature, rate-limited.
 */
export const POST = withErrorHandler(async (req: Request) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();

  if (!(await hasFeature(session.user.tenantId, "aiAssistant"))) {
    throw forbidden("AI Assistant tersedia di paket Pro ke atas.");
  }

  const rl = rateLimit(`ai-chat:${session.user.id}`, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) throw tooMany("Terlalu banyak pesan ke AI, tunggu sebentar.");

  const { messages } = schema.parse(await req.json());

  const snapshot = await buildBusinessContext(session.user.tenantId);
  const system = assistantSystemPrompt(snapshot);

  const chat: ChatMessage[] = [
    { role: "system", content: system },
    ...messages.map((m) => ({ role: m.role, content: m.content }) as ChatMessage),
  ];

  const result = await chatComplete(chat, { maxTokens: 700, temperature: 0.5 });
  return NextResponse.json({ text: result.text, provider: result.provider });
});
