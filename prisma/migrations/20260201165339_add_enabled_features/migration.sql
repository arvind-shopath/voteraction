/*
  Warnings:

  - Added the required column `assemblyId` to the `Booth` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assemblyId` to the `Issue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assemblyId` to the `Voter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assemblyId` to the `Worker` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Assembly" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Uttar Pradesh',
    "candidateName" TEXT,
    "candidateImageUrl" TEXT,
    "party" TEXT NOT NULL DEFAULT 'Independent',
    "themeColor" TEXT NOT NULL DEFAULT '#1E3A8A',
    "logoUrl" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "twitterUrl" TEXT,
    "prevPartyVotes" INTEGER NOT NULL DEFAULT 0,
    "prevCandidateVotes" INTEGER NOT NULL DEFAULT 0,
    "totalVoters" INTEGER NOT NULL DEFAULT 0,
    "totalBooths" INTEGER NOT NULL DEFAULT 0,
    "historicalResults" TEXT,
    "casteEquation" TEXT,
    "enabledFeatures" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "electionDate" DATETIME
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "candidateName" TEXT,
    "assemblyId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Campaign_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PublicRelation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "location" TEXT NOT NULL,
    "visitDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "atmosphere" TEXT,
    "assemblyId" INTEGER NOT NULL,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PublicRelation_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JansamparkRoute" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assemblyId" INTEGER NOT NULL,
    "posterMade" BOOLEAN NOT NULL DEFAULT false,
    "posterMadeAt" DATETIME,
    "posterMadeBy" INTEGER,
    "posterNotNeeded" BOOLEAN NOT NULL DEFAULT false,
    "posterStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JansamparkRoute_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JansamparkRoute_posterMadeBy_fkey" FOREIGN KEY ("posterMadeBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JansamparkVisit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "village" TEXT NOT NULL,
    "time" TEXT,
    "atmosphere" TEXT,
    "notes" TEXT,
    "routeId" INTEGER NOT NULL,
    CONSTRAINT "JansamparkVisit_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "JansamparkRoute" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "username" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'MANAGER',
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "expiryDate" DATETIME,
    "assemblyId" INTEGER,
    "campaignId" INTEGER,
    "name" TEXT,
    "mobile" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Account" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionToken" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "userId" INTEGER,
    "assemblyId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SystemLog_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SystemLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VoterFeedback" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "voterId" INTEGER NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "supportStatus" TEXT NOT NULL DEFAULT 'Neutral',
    "notes" TEXT,
    "isVoted" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "mobile" TEXT,
    "updatedByName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VoterFeedback_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "Voter" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VoterFeedback_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "dueDate" DATETIME,
    "workerId" INTEGER NOT NULL,
    "assemblyId" INTEGER NOT NULL,
    "report" TEXT,
    "mediaUrls" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Task_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "postType" TEXT NOT NULL DEFAULT 'Post',
    "platform" TEXT,
    "assemblyId" INTEGER NOT NULL,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "eventName" TEXT,
    "importantPeople" TEXT,
    "location" TEXT,
    "mediaUrls" TEXT,
    "videoUrl" TEXT,
    "liveLink" TEXT,
    "externalId" TEXT,
    CONSTRAINT "SocialPost_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "assemblyId" INTEGER NOT NULL,
    "boothNumber" INTEGER,
    "boothName" TEXT,
    "commonAddress" TEXT,
    "expectedCount" INTEGER,
    "startPage" INTEGER,
    "endPage" INTEGER,
    "totalVoters" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "logs" TEXT,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "ImportJob_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkerJanSampark" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "personName" TEXT NOT NULL,
    "mobile" TEXT,
    "village" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "atmosphere" TEXT DEFAULT 'Neutral',
    "workerId" INTEGER NOT NULL,
    "assemblyId" INTEGER NOT NULL,
    "voterId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkerJanSampark_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkerJanSampark_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Party" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#1E3A8A',
    "logo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ElectionHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "year" INTEGER NOT NULL,
    "candidateName" TEXT NOT NULL,
    "partyName" TEXT NOT NULL,
    "votesReceived" INTEGER NOT NULL,
    "votePercentage" REAL,
    "totalVotes" INTEGER,
    "result" TEXT,
    "margin" INTEGER,
    "assemblyId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ElectionHistory_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CandidatePostRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subject" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "importantPeople" TEXT,
    "description" TEXT,
    "photoUrls" TEXT,
    "videoUrls" TEXT,
    "postType" TEXT NOT NULL DEFAULT 'Post',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "facebookUrl" TEXT,
    "twitterUrl" TEXT,
    "instagramUrl" TEXT,
    "whatsappUrl" TEXT,
    "publishedAt" DATETIME,
    "assemblyId" INTEGER NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "acceptedAt" DATETIME,
    "acceptedBy" INTEGER,
    CONSTRAINT "CandidatePostRequest_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CandidatePostRequest_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CandidatePostRequest_acceptedBy_fkey" FOREIGN KEY ("acceptedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SocialMediaApproval" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "mediaUrls" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assemblyId" INTEGER NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "approvedBy" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    "rejectionReason" TEXT,
    "postedUrls" TEXT,
    "postedAt" DATETIME,
    CONSTRAINT "SocialMediaApproval_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SocialMediaApproval_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SocialMediaApproval_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CampaignMaterial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "materialType" TEXT NOT NULL,
    "fileUrls" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'ALL',
    "expiresAt" DATETIME,
    "assemblyId" INTEGER NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CampaignMaterial_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CampaignMaterial_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkerSocialTask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "taskType" TEXT NOT NULL,
    "postRequestId" INTEGER,
    "campaignMaterialId" INTEGER,
    "workerId" INTEGER NOT NULL,
    "assemblyId" INTEGER NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "liked" BOOLEAN NOT NULL DEFAULT false,
    "likedAt" DATETIME,
    "shared" BOOLEAN NOT NULL DEFAULT false,
    "sharedAt" DATETIME,
    "commented" BOOLEAN NOT NULL DEFAULT false,
    "commentedAt" DATETIME,
    "sharedOnWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "sharedOnFacebook" BOOLEAN NOT NULL DEFAULT false,
    "sharedOnInstagram" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkerSocialTask_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkerSocialTask_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkerSocialTask_postRequestId_fkey" FOREIGN KEY ("postRequestId") REFERENCES "CandidatePostRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WorkerSocialTask_campaignMaterialId_fkey" FOREIGN KEY ("campaignMaterialId") REFERENCES "CampaignMaterial" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkerSocialTaskProof" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "taskId" INTEGER NOT NULL,
    "proofType" TEXT NOT NULL,
    "screenshotUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "WorkerSocialTaskProof_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WorkerSocialTask" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booth" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" INTEGER NOT NULL,
    "name" TEXT,
    "area" TEXT,
    "totalVoters" INTEGER NOT NULL DEFAULT 0,
    "coveragePercent" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Medium',
    "inchargeName" TEXT,
    "inchargeMobile" TEXT,
    "historicalResults" TEXT,
    "casteEquation" TEXT,
    "assemblyId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booth_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Booth" ("area", "coveragePercent", "createdAt", "id", "inchargeMobile", "inchargeName", "name", "number", "status", "totalVoters", "updatedAt") SELECT "area", "coveragePercent", "createdAt", "id", "inchargeMobile", "inchargeName", "name", "number", "status", "totalVoters", "updatedAt" FROM "Booth";
DROP TABLE "Booth";
ALTER TABLE "new_Booth" RENAME TO "Booth";
CREATE UNIQUE INDEX "Booth_number_assemblyId_key" ON "Booth"("number", "assemblyId");
CREATE TABLE "new_Issue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'Open',
    "boothNumber" INTEGER,
    "reportedBy" TEXT,
    "daysPending" INTEGER NOT NULL DEFAULT 0,
    "assemblyId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "updatedByName" TEXT,
    "area" TEXT,
    "mediaUrls" TEXT,
    "videoUrl" TEXT,
    "village" TEXT,
    CONSTRAINT "Issue_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Issue" ("boothNumber", "category", "createdAt", "daysPending", "description", "id", "priority", "reportedBy", "status", "title", "updatedAt") SELECT "boothNumber", "category", "createdAt", "daysPending", "description", "id", "priority", "reportedBy", "status", "title", "updatedAt" FROM "Issue";
DROP TABLE "Issue";
ALTER TABLE "new_Issue" RENAME TO "Issue";
CREATE INDEX "Issue_assemblyId_idx" ON "Issue"("assemblyId");
CREATE TABLE "new_Voter" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "age" INTEGER,
    "gender" TEXT,
    "relativeName" TEXT,
    "relationType" TEXT,
    "houseNumber" TEXT,
    "familySize" INTEGER NOT NULL DEFAULT 1,
    "epic" TEXT,
    "boothNumber" INTEGER,
    "village" TEXT,
    "area" TEXT,
    "caste" TEXT,
    "subCaste" TEXT,
    "surname" TEXT,
    "supportStatus" TEXT NOT NULL DEFAULT 'Neutral',
    "notes" TEXT,
    "mobile" TEXT,
    "isVoted" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "updatedByName" TEXT,
    "assemblyId" INTEGER NOT NULL,
    "importJobId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "pannaPramukhId" INTEGER,
    CONSTRAINT "Voter_pannaPramukhId_fkey" FOREIGN KEY ("pannaPramukhId") REFERENCES "Worker" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Voter_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Voter_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "ImportJob" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Voter" ("age", "area", "boothNumber", "caste", "createdAt", "epic", "gender", "houseNumber", "id", "isVoted", "mobile", "name", "notes", "relationType", "relativeName", "supportStatus", "surname", "updatedAt", "village") SELECT "age", "area", "boothNumber", "caste", "createdAt", "epic", "gender", "houseNumber", "id", "isVoted", "mobile", "name", "notes", "relationType", "relativeName", "supportStatus", "surname", "updatedAt", "village" FROM "Voter";
DROP TABLE "Voter";
ALTER TABLE "new_Voter" RENAME TO "Voter";
CREATE UNIQUE INDEX "Voter_epic_key" ON "Voter"("epic");
CREATE INDEX "Voter_boothNumber_idx" ON "Voter"("boothNumber");
CREATE INDEX "Voter_pannaPramukhId_idx" ON "Voter"("pannaPramukhId");
CREATE INDEX "Voter_surname_idx" ON "Voter"("surname");
CREATE INDEX "Voter_caste_idx" ON "Voter"("caste");
CREATE INDEX "Voter_village_idx" ON "Voter"("village");
CREATE INDEX "Voter_assemblyId_idx" ON "Voter"("assemblyId");
CREATE INDEX "Voter_importJobId_idx" ON "Voter"("importJobId");
CREATE TABLE "new_Worker" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "mobile" TEXT,
    "type" TEXT NOT NULL DEFAULT 'FIELD',
    "userId" INTEGER,
    "boothId" INTEGER,
    "housesCovered" INTEGER NOT NULL DEFAULT 0,
    "attendanceRate" INTEGER NOT NULL DEFAULT 0,
    "performanceScore" INTEGER NOT NULL DEFAULT 0,
    "assemblyId" INTEGER NOT NULL,
    "campaignId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Worker_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Worker_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Worker_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Worker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Worker" ("attendanceRate", "boothId", "createdAt", "housesCovered", "id", "mobile", "name", "performanceScore", "updatedAt") SELECT "attendanceRate", "boothId", "createdAt", "housesCovered", "id", "mobile", "name", "performanceScore", "updatedAt" FROM "Worker";
DROP TABLE "Worker";
ALTER TABLE "new_Worker" RENAME TO "Worker";
CREATE UNIQUE INDEX "Worker_mobile_key" ON "Worker"("mobile");
CREATE UNIQUE INDEX "Worker_userId_key" ON "Worker"("userId");
CREATE INDEX "Worker_assemblyId_idx" ON "Worker"("assemblyId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "Assembly_number_key" ON "Assembly"("number");

-- CreateIndex
CREATE INDEX "Assembly_number_idx" ON "Assembly"("number");

-- CreateIndex
CREATE INDEX "Campaign_assemblyId_idx" ON "Campaign"("assemblyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VoterFeedback_voterId_campaignId_key" ON "VoterFeedback"("voterId", "campaignId");

-- CreateIndex
CREATE INDEX "Task_workerId_idx" ON "Task"("workerId");

-- CreateIndex
CREATE INDEX "Task_assemblyId_idx" ON "Task"("assemblyId");

-- CreateIndex
CREATE INDEX "SocialPost_assemblyId_idx" ON "SocialPost"("assemblyId");

-- CreateIndex
CREATE INDEX "SocialPost_status_idx" ON "SocialPost"("status");

-- CreateIndex
CREATE INDEX "SocialPost_postType_idx" ON "SocialPost"("postType");

-- CreateIndex
CREATE UNIQUE INDEX "Party_name_key" ON "Party"("name");

-- CreateIndex
CREATE INDEX "ElectionHistory_assemblyId_idx" ON "ElectionHistory"("assemblyId");

-- CreateIndex
CREATE INDEX "ElectionHistory_year_idx" ON "ElectionHistory"("year");

-- CreateIndex
CREATE INDEX "CandidatePostRequest_assemblyId_idx" ON "CandidatePostRequest"("assemblyId");

-- CreateIndex
CREATE INDEX "CandidatePostRequest_status_idx" ON "CandidatePostRequest"("status");

-- CreateIndex
CREATE INDEX "CandidatePostRequest_createdAt_idx" ON "CandidatePostRequest"("createdAt");

-- CreateIndex
CREATE INDEX "SocialMediaApproval_assemblyId_idx" ON "SocialMediaApproval"("assemblyId");

-- CreateIndex
CREATE INDEX "SocialMediaApproval_status_idx" ON "SocialMediaApproval"("status");

-- CreateIndex
CREATE INDEX "CampaignMaterial_assemblyId_idx" ON "CampaignMaterial"("assemblyId");

-- CreateIndex
CREATE INDEX "CampaignMaterial_createdAt_idx" ON "CampaignMaterial"("createdAt");

-- CreateIndex
CREATE INDEX "WorkerSocialTask_workerId_idx" ON "WorkerSocialTask"("workerId");

-- CreateIndex
CREATE INDEX "WorkerSocialTask_status_idx" ON "WorkerSocialTask"("status");

-- CreateIndex
CREATE INDEX "WorkerSocialTask_dueDate_idx" ON "WorkerSocialTask"("dueDate");

-- CreateIndex
CREATE INDEX "WorkerSocialTaskProof_taskId_idx" ON "WorkerSocialTaskProof"("taskId");

-- CreateIndex
CREATE INDEX "WorkerSocialTaskProof_expiresAt_idx" ON "WorkerSocialTaskProof"("expiresAt");
