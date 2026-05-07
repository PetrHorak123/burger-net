import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const burger = await db.burger.findUnique({ where: { id } });

  if (!burger) {
    return NextResponse.json({ exists: false }, { status: 404 });
  }

  return NextResponse.json({
    exists: true,
    price: burger.price,
    claimed: burger.userId !== null,
    userId: burger.userId,
  });
}
