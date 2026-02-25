import { GiftStatus, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbInitPromise: Promise<void> | undefined;
};

const runtimeDatabaseUrl =
  process.env.DATABASE_URL ??
  (process.env.NODE_ENV === "production" ? "file:/tmp/dev.db" : "file:./dev.db");

process.env.DATABASE_URL = runtimeDatabaseUrl;

const basePrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

async function bootstrapSqliteSchema() {
  await basePrisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Person" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "birthday" DATETIME,
      "notes" TEXT,
      "shareToken" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `);

  await basePrisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "Person_shareToken_key" ON "Person"("shareToken")',
  );

  await basePrisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "GiftIdea" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "personId" INTEGER NOT NULL,
      "title" TEXT NOT NULL,
      "description" TEXT,
      "url" TEXT,
      "status" TEXT NOT NULL DEFAULT 'IDEA',
      "giftedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "GiftIdea_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await basePrisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "GiftIdea_personId_idx" ON "GiftIdea"("personId")',
  );
}

async function seedIfEmpty() {
  const peopleCount = await basePrisma.person.count();
  if (peopleCount > 0) {
    return;
  }

  const peopleData = [
    {
      name: "Anna Meyer",
      birthday: new Date("1992-05-12"),
      notes: "Mag Bücher und Kaffee.",
      shareToken: "person-1-share",
      ideas: [
        {
          title: "Gutschein Buchhandlung",
          description: "Lokale Buchhandlung in der Innenstadt",
          status: GiftStatus.IDEA,
        },
        {
          title: "French Press",
          description: "Schwarz, 1 Liter",
          status: GiftStatus.RESERVED,
        },
      ],
    },
    {
      name: "Ben Schulz",
      birthday: new Date("1988-11-03"),
      notes: "Spielt gern Brettspiele.",
      shareToken: "person-2-share",
      ideas: [
        {
          title: "Flügelschlag Erweiterung",
          description: "Europa-Erweiterung",
          status: GiftStatus.IDEA,
        },
        {
          title: "Spielmatte",
          description: "Für Tabletop-Abende",
          status: GiftStatus.BOUGHT,
          giftedAt: new Date("2025-12-24"),
        },
      ],
    },
    {
      name: "Clara Hoffmann",
      birthday: new Date("1996-02-21"),
      notes: "Kocht und backt viel.",
      shareToken: "person-3-share",
      ideas: [
        {
          title: "Gewürz-Set",
          description: "Asiatische Gewürze",
          status: GiftStatus.IDEA,
        },
        {
          title: "Küchenschürze",
          description: "Leinen, dunkelgrün",
          status: GiftStatus.RESERVED,
        },
      ],
    },
    {
      name: "David Klein",
      birthday: new Date("1990-08-30"),
      notes: "Fährt viel Fahrrad.",
      shareToken: "person-4-share",
      ideas: [
        {
          title: "Fahrrad-Lichtset",
          description: "USB-aufladbar",
          status: GiftStatus.IDEA,
        },
        {
          title: "Satteltasche",
          description: "Wasserdicht",
          status: GiftStatus.IDEA,
          url: "https://example.com/satteltasche",
        },
      ],
    },
  ];

  for (const person of peopleData) {
    await basePrisma.person.create({
      data: {
        name: person.name,
        birthday: person.birthday,
        notes: person.notes,
        shareToken: person.shareToken,
        giftIdeas: {
          create: person.ideas,
        },
      },
    });
  }
}

async function ensureDatabaseInitialized() {
  if (!globalForPrisma.dbInitPromise) {
    globalForPrisma.dbInitPromise = (async () => {
      await bootstrapSqliteSchema();
      await seedIfEmpty();
    })();
  }

  await globalForPrisma.dbInitPromise;
}

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        await ensureDatabaseInitialized();
        return query(args);
      },
    },
  },
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = basePrisma;
}
