-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "activationLimit" INTEGER NOT NULL,
    "activationsCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "promoCodeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE INDEX "Activation_email_idx" ON "Activation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Activation_promoCodeId_email_key" ON "Activation"("promoCodeId", "email");

-- AddForeignKey
ALTER TABLE "Activation" ADD CONSTRAINT "Activation_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
