import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (!id) {
    return NextResponse.json({ error: "Ungültige ID." }, { status: 400 });
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
    return NextResponse.json({ error: "Person nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json(person);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (!id) {
    return NextResponse.json({ error: "Ungültige ID." }, { status: 400 });
  }

  const body = await request.json();
  const data: {
    name?: string;
    birthday?: Date | null;
    notes?: string | null;
  } = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "Name ist erforderlich." }, { status: 400 });
    }
    data.name = name;
  }

  if (typeof body.birthday === "string") {
    if (!body.birthday) {
      data.birthday = null;
    } else {
      const birthday = new Date(body.birthday);
      if (Number.isNaN(birthday.getTime())) {
        return NextResponse.json({ error: "Ungültiges Datum." }, { status: 400 });
      }
      data.birthday = birthday;
    }
  }

  if (typeof body.notes === "string") {
    data.notes = body.notes.trim() || null;
  }

  const updated = await prisma.person.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (!id) {
    return NextResponse.json({ error: "Ungültige ID." }, { status: 400 });
  }

  await prisma.person.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
