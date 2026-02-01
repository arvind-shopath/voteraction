-- CreateTable
CREATE TABLE "Voter" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "age" INTEGER,
    "gender" TEXT,
    "relativeName" TEXT,
    "relationType" TEXT,
    "houseNumber" TEXT,
    "epic" TEXT,
    "boothNumber" INTEGER,
    "village" TEXT,
    "area" TEXT,
    "caste" TEXT,
    "surname" TEXT,
    "supportStatus" TEXT NOT NULL DEFAULT 'Neutral',
    "notes" TEXT,
    "mobile" TEXT,
    "isVoted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Booth" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" INTEGER NOT NULL,
    "name" TEXT,
    "area" TEXT,
    "totalVoters" INTEGER NOT NULL DEFAULT 0,
    "coveragePercent" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Medium',
    "inchargeName" TEXT,
    "inchargeMobile" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Worker" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "mobile" TEXT,
    "boothId" INTEGER,
    "housesCovered" INTEGER NOT NULL DEFAULT 0,
    "attendanceRate" INTEGER NOT NULL DEFAULT 0,
    "performanceScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'Open',
    "boothNumber" INTEGER,
    "reportedBy" TEXT,
    "daysPending" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Voter_epic_key" ON "Voter"("epic");

-- CreateIndex
CREATE INDEX "Voter_boothNumber_idx" ON "Voter"("boothNumber");

-- CreateIndex
CREATE INDEX "Voter_surname_idx" ON "Voter"("surname");

-- CreateIndex
CREATE INDEX "Voter_caste_idx" ON "Voter"("caste");

-- CreateIndex
CREATE INDEX "Voter_village_idx" ON "Voter"("village");

-- CreateIndex
CREATE UNIQUE INDEX "Booth_number_key" ON "Booth"("number");
