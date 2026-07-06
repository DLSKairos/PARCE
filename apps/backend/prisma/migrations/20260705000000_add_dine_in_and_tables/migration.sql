-- Fase 2: Consumir en tienda
-- Nuevos valores de enums
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'IN_TRANSIT' BEFORE 'DELIVERED';
ALTER TYPE "OrderType" ADD VALUE IF NOT EXISTS 'DINE_IN';

-- Mesas del restaurante
CREATE TABLE "tables" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tables_restaurantId_isActive_position_idx" ON "tables"("restaurantId", "isActive", "position");

ALTER TABLE "tables" ADD CONSTRAINT "tables_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Mesa en pedidos (snapshot del nombre + FK opcional)
ALTER TABLE "orders" ADD COLUMN "tableId" TEXT;
ALTER TABLE "orders" ADD COLUMN "tableLabel" TEXT;

ALTER TABLE "orders" ADD CONSTRAINT "orders_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;
