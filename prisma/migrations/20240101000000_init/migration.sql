-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Burger" (
    "id" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Burger_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Burger" ADD CONSTRAINT "Burger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
