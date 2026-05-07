import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const burger = await db.burger.findUnique({ where: { id } });

  if (!burger) {
    return NextResponse.json({ error: "Burger not found" }, { status: 404 });
  }

  if (burger.userId !== null) {
    return NextResponse.json({ error: "Already claimed" }, { status: 409 });
  }

  const updated = await db.burger.update({
    where: { id, userId: null },
    data: { userId },
  });

  return NextResponse.json({ success: true, burger: updated });
}
