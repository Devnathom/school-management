-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TimetableEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classRoomId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "TimetableEntry_classRoomId_fkey" FOREIGN KEY ("classRoomId") REFERENCES "ClassRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TimetableEntry_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TimetableEntry_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TimetableEntry" ("classRoomId", "dayOfWeek", "id", "period", "subjectId", "teacherId") SELECT "classRoomId", "dayOfWeek", "id", "period", "subjectId", "teacherId" FROM "TimetableEntry";
DROP TABLE "TimetableEntry";
ALTER TABLE "new_TimetableEntry" RENAME TO "TimetableEntry";
CREATE UNIQUE INDEX "TimetableEntry_teacherId_dayOfWeek_period_key" ON "TimetableEntry"("teacherId", "dayOfWeek", "period");
CREATE UNIQUE INDEX "TimetableEntry_classRoomId_dayOfWeek_period_key" ON "TimetableEntry"("classRoomId", "dayOfWeek", "period");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
