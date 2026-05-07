import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { pin } = await req.json();

  if (!pin) {
    return NextResponse.json({ error: "pin required" }, { status: 400 });
  }

  if (pin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
