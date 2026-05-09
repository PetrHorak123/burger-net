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
  const ratingResult = await db.$queryRaw<[{ avg: number | null }]>`
    SELECT AVG(rating) as avg FROM "Burger" WHERE rating IS NOT NULL
  `;
  const avgRating = Number(ratingResult[0]?.avg ?? 0);

  return NextResponse.json(
    {
      users: ranked,
      stats: {
        totalBurgers,
        avgRating,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
