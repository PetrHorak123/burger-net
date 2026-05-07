export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { db } = await import("@/lib/db");

    // Idempotent schema bootstrap — runs on every cold start, safe to re-run
    await db.$executeRaw`
      CREATE TABLE IF NOT EXISTS "User" (
        "id"        TEXT        NOT NULL,
        "alias"     TEXT        NOT NULL,
        "email"     TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      )
    `;

    await db.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Burger" (
        "id"        TEXT         NOT NULL,
        "price"     DOUBLE PRECISION NOT NULL,
        "userId"    TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Burger_pkey" PRIMARY KEY ("id")
      )
    `;

    await db.$executeRaw`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'Burger_userId_fkey'
        ) THEN
          ALTER TABLE "Burger"
            ADD CONSTRAINT "Burger_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$
    `;
  }
}
