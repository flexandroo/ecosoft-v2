import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runReminders } from "@/lib/client-bot/reminders";

// Daily reminder run, called by a timer on the server:
//   curl -X POST http://127.0.0.1:3000/api/client-bot/cron -H "x-cron-secret: $SECRET"
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  const expected = process.env.TELEGRAM_CLIENT_BOT_SECRET;
  const got = req.headers.get("x-cron-secret");
  if (!expected || !got || expected.length !== got.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(got))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const result = await runReminders();
  console.log("[client-bot] reminders:", JSON.stringify(result));
  return NextResponse.json({ ok: true, ...result });
}
