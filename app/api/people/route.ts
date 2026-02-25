import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

function createShareToken() {
  return randomUUID().replaceAll("-", "").slice(0, 16);
}

export async function GET() {
  const people = await prisma.person.findMany({
    orderBy: { name: "asc" },
    include: { giftIdeas: true },
  });

  return NextResponse.json(
    people.map((person) => ({
      id: person.id,
      name: person.name,
      birthday: person.birthday,
      notes: person.notes,
      shareToken: person.shareToken,
      totalIdeas: person.giftIdeas.length,
      openIdeas: person.giftIdeas.filter((idea) => !idea.giftedAt).length,
    })),
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Name ist erforderlich." }, { status: 400 });
  }

  const birthday =
    typeof body.birthday === "string" && body.birthday
      ? new Date(body.birthday)
      : null;

  const notes = typeof body.notes === "string" ? body.notes.trim() : null;

  const created = await prisma.person.create({
    data: {
      name,
      birthday: birthday && !Number.isNaN(birthday.getTime()) ? birthday : null,
      notes: notes || null,
      shareToken: createShareToken(),
    },
  });

  return NextResponse.json(created, { status: 201 });
}
