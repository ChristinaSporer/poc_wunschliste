import { prisma } from "@/lib/prisma";
import { PeopleClient } from "./people-client";

export const dynamic = "force-dynamic";

export type PersonListItem = {
  id: number;
  name: string;
  birthday: string | null;
  notes: string | null;
  shareToken: string;
  totalIdeas: number;
  openIdeas: number;
};

export default async function PeoplePage() {
  const people = await prisma.person.findMany({
    orderBy: { name: "asc" },
    include: {
      giftIdeas: {
        select: {
          giftedAt: true,
        },
      },
    },
  });

  const initialPeople: PersonListItem[] = people.map((person) => ({
    id: person.id,
    name: person.name,
    birthday: person.birthday ? person.birthday.toISOString() : null,
    notes: person.notes,
    shareToken: person.shareToken,
    totalIdeas: person.giftIdeas.length,
    openIdeas: person.giftIdeas.filter((idea) => !idea.giftedAt).length,
  }));

  return <PeopleClient initialPeople={initialPeople} />;
}
