import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId, rating } = await req.json();

  if (!userId || typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const burger = await db.burger.findUnique({ where: { id } });
  if (!burger) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (burger.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.burger.update({ where: { id }, data: { rating } });
  return NextResponse.json({ ok: true });
}
