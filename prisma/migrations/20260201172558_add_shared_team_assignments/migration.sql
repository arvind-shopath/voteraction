-- CreateTable
CREATE TABLE "UserAssemblyAssignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "assemblyId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserAssemblyAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserAssemblyAssignment_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "UserAssemblyAssignment_userId_idx" ON "UserAssemblyAssignment"("userId");

-- CreateIndex
CREATE INDEX "UserAssemblyAssignment_assemblyId_idx" ON "UserAssemblyAssignment"("assemblyId");

-- CreateIndex
CREATE INDEX "UserAssemblyAssignment_role_idx" ON "UserAssemblyAssignment"("role");

-- CreateIndex
CREATE UNIQUE INDEX "UserAssemblyAssignment_userId_assemblyId_role_key" ON "UserAssemblyAssignment"("userId", "assemblyId", "role");
