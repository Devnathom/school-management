-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'TEACHER',
    "teacherId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prefix" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "position" TEXT,
    "department" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentCode" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "classRoomId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Student_classRoomId_fkey" FOREIGN KEY ("classRoomId") REFERENCES "ClassRoom" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClassRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "homeroomTeacherId" TEXT,
    CONSTRAINT "ClassRoom_homeroomTeacherId_fkey" FOREIGN KEY ("homeroomTeacherId") REFERENCES "Teacher" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT
);

-- CreateTable
CREATE TABLE "TimetableEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classRoomId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    CONSTRAINT "TimetableEntry_classRoomId_fkey" FOREIGN KEY ("classRoomId") REFERENCES "ClassRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TimetableEntry_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TimetableEntry_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "unit" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "InventoryTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "requester" TEXT,
    "note" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryTransaction_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IncomingDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "regNo" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "docNo" TEXT NOT NULL,
    "docDate" DATETIME NOT NULL,
    "fromOrg" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "action" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "OutgoingDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "regNo" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "toOrg" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "docDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT
);

-- CreateTable
CREATE TABLE "Circular" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CircularAck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "circularId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "acknowledgedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CircularAck_circularId_fkey" FOREIGN KEY ("circularId") REFERENCES "Circular" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CircularAck_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_teacherId_key" ON "User"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentCode_key" ON "Student"("studentCode");

-- CreateIndex
CREATE UNIQUE INDEX "ClassRoom_name_year_key" ON "ClassRoom"("name", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TimetableEntry_teacherId_dayOfWeek_period_key" ON "TimetableEntry"("teacherId", "dayOfWeek", "period");

-- CreateIndex
CREATE UNIQUE INDEX "TimetableEntry_classRoomId_dayOfWeek_period_key" ON "TimetableEntry"("classRoomId", "dayOfWeek", "period");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_code_key" ON "InventoryItem"("code");

-- CreateIndex
CREATE UNIQUE INDEX "IncomingDocument_year_regNo_key" ON "IncomingDocument"("year", "regNo");

-- CreateIndex
CREATE UNIQUE INDEX "OutgoingDocument_year_regNo_key" ON "OutgoingDocument"("year", "regNo");

-- CreateIndex
CREATE UNIQUE INDEX "CircularAck_circularId_teacherId_key" ON "CircularAck"("circularId", "teacherId");
