-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "PeriodTime" (
    "period" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "PeriodTime_pkey" PRIMARY KEY ("period")
);
