import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const users = await db.user.findMany({
    include: { burgers: true },
  });

  const ranked = users
    .map((u) => ({
      id: u.id,
      alias: u.alias,
      total: u.burgers.reduce((sum, b) => sum + b.price, 0),
      count: u.burgers.length,
    }))
    .sort((a, b) => b.total - a.total);

  const totalBurgers = await db.burger.count();
  const totalRevenue = await db.burger.aggregate({ _sum: { price: true } });

  return NextResponse.json(
    {
      users: ranked,
      stats: {
        totalBurgers,
        totalRevenue: totalRevenue._sum.price ?? 0,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
