import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const { id, price, pin } = await req.json();

  if (!id || price === undefined || !pin) {
    return NextResponse.json({ error: "id, price and pin required" }, { status: 400 });
  }

  if (pin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  const numericPrice = parseFloat(price);
  if (isNaN(numericPrice) || numericPrice < 0) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  const existing = await db.burger.findUnique({ where: { id } });
  if (existing) {
    return NextResponse.json({ error: "Burger already registered" }, { status: 409 });
  }

  const burger = await db.burger.create({ data: { id, price: numericPrice } });

  return NextResponse.json({ success: true, burger }, { status: 201 });
}
