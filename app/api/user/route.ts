import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const { id, alias, email } = await req.json();

  if (!id || !alias?.trim()) {
    return NextResponse.json({ error: "id and alias required" }, { status: 400 });
  }

  const user = await db.user.upsert({
    where: { id },
    create: { id, alias: alias.trim(), email: email?.trim() || null },
    update: {},
  });

  return NextResponse.json({ success: true, user }, { status: 201 });
}
