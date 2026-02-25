import { NextResponse } from "next/server";
import { GiftStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function parseId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
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
    title?: string;
    description?: string | null;
    url?: string | null;
    status?: GiftStatus;
    giftedAt?: Date | null;
  } = {};

  if (typeof body.title === "string") {
    const title = body.title.trim();
    if (!title) {
      return NextResponse.json({ error: "Titel ist erforderlich." }, { status: 400 });
    }
    data.title = title;
  }

  if (typeof body.description === "string") {
    data.description = body.description.trim() || null;
  }

  if (typeof body.url === "string") {
    data.url = body.url.trim() || null;
  }

  if (typeof body.status === "string") {
    const statusValues = Object.values(GiftStatus);
    if (!statusValues.includes(body.status as GiftStatus)) {
      return NextResponse.json({ error: "Ungültiger Status." }, { status: 400 });
    }
    data.status = body.status as GiftStatus;
  }

  if (typeof body.giftedAt === "string") {
    if (!body.giftedAt) {
      data.giftedAt = null;
    } else {
      const giftedAt = new Date(body.giftedAt);
      if (Number.isNaN(giftedAt.getTime())) {
        return NextResponse.json({ error: "Ungültiges Datum." }, { status: 400 });
      }
      data.giftedAt = giftedAt;
    }
  }

  const updated = await prisma.giftIdea.update({
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

  await prisma.giftIdea.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
