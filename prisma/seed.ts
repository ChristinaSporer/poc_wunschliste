import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function token(index: number) {
  return `person-${index}-${Math.random().toString(36).slice(2, 10)}`;
}

async function main() {
  await prisma.giftIdea.deleteMany();
  await prisma.person.deleteMany();

  const peopleData = [
    {
      name: "Anna Meyer",
      birthday: new Date("1992-05-12"),
      notes: "Mag Bücher und Kaffee.",
      ideas: [
        {
          title: "Gutschein Buchhandlung",
          description: "Lokale Buchhandlung in der Innenstadt",
          status: "IDEA" as const,
        },
        {
          title: "French Press",
          description: "Schwarz, 1 Liter",
          status: "RESERVED" as const,
        },
      ],
    },
    {
      name: "Ben Schulz",
      birthday: new Date("1988-11-03"),
      notes: "Spielt gern Brettspiele.",
      ideas: [
        {
          title: "Flügelschlag Erweiterung",
          description: "Europa-Erweiterung",
          status: "IDEA" as const,
        },
        {
          title: "Spielmatte",
          description: "Für Tabletop-Abende",
          status: "BOUGHT" as const,
          giftedAt: new Date("2025-12-24"),
        },
      ],
    },
    {
      name: "Clara Hoffmann",
      birthday: new Date("1996-02-21"),
      notes: "Kocht und backt viel.",
      ideas: [
        {
          title: "Gewürz-Set",
          description: "Asiatische Gewürze",
          status: "IDEA" as const,
        },
        {
          title: "Küchenschürze",
          description: "Leinen, dunkelgrün",
          status: "RESERVED" as const,
        },
      ],
    },
    {
      name: "David Klein",
      birthday: new Date("1990-08-30"),
      notes: "Fährt viel Fahrrad.",
      ideas: [
        {
          title: "Fahrrad-Lichtset",
          description: "USB-aufladbar",
          status: "IDEA" as const,
        },
        {
          title: "Satteltasche",
          description: "Wasserdicht",
          status: "IDEA" as const,
          url: "https://example.com/satteltasche",
        },
      ],
    },
  ];

  for (let index = 0; index < peopleData.length; index += 1) {
    const person = peopleData[index];
    await prisma.person.create({
      data: {
        name: person.name,
        birthday: person.birthday,
        notes: person.notes,
        shareToken: token(index + 1),
        giftIdeas: {
          create: person.ideas,
        },
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
