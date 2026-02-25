import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PersonDetailClient } from "./person-detail-client";

export const dynamic = "force-dynamic";

export type PersonDetail = {
  id: number;
  name: string;
  birthday: string | null;
  notes: string | null;
  shareToken: string;
  giftIdeas: {
    id: number;
    title: string;
    description: string | null;
    url: string | null;
    status: "IDEA" | "RESERVED" | "BOUGHT";
    giftedAt: string | null;
  }[];
};

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  const person = await prisma.person.findUnique({
    where: { id },
    include: {
      giftIdeas: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!person) {
    notFound();
  }

  const viewModel: PersonDetail = {
    id: person.id,
    name: person.name,
    birthday: person.birthday ? person.birthday.toISOString() : null,
    notes: person.notes,
    shareToken: person.shareToken,
    giftIdeas: person.giftIdeas.map((idea) => ({
      id: idea.id,
      title: idea.title,
      description: idea.description,
      url: idea.url,
      status: idea.status,
      giftedAt: idea.giftedAt ? idea.giftedAt.toISOString() : null,
    })),
  };

  return <PersonDetailClient person={viewModel} />;
}
