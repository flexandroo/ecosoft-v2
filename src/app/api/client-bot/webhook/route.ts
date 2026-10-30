import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { handleClientUpdate, type ClientUpdate } from "@/lib/client-bot/bot";

// Telegram webhook of the customer bot (@sofiivkawater_service_bot).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function secretMatches(req: Request): boolean {
  const expected = process.env.TELEGRAM_CLIENT_BOT_SECRET;
  const got = req.headers.get("x-telegram-bot-api-secret-token");
  if (!expected || !got || expected.length !== got.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(got));
}

export async function POST(req: Request) {
  if (!secretMatches(req)) return NextResponse.json({ ok: false }, { status: 401 });
  let update: ClientUpdate;
  try {
    update = (await req.json()) as ClientUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }
  try {
    await handleClientUpdate(update);
  } catch (error) {
    console.error("[client-bot]", error);
  }
  // Always 200: Telegram would otherwise retry and repeat the action.
  return NextResponse.json({ ok: true });
}
