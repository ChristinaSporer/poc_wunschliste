import { NextResponse } from "next/server";
import { GiftStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function parseId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const personId = parseId(rawId);

  if (!personId) {
    return NextResponse.json({ error: "Ungültige ID." }, { status: 400 });
  }

  const ideas = await prisma.giftIdea.findMany({
    where: { personId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(ideas);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await context.params;
  const personId = parseId(rawId);

  if (!personId) {
    return NextResponse.json({ error: "Ungültige ID." }, { status: 400 });
  }

  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";

  if (!title) {
    return NextResponse.json({ error: "Titel ist erforderlich." }, { status: 400 });
  }

  const statusValues = Object.values(GiftStatus);
  const status =
    typeof body.status === "string" && statusValues.includes(body.status as GiftStatus)
      ? (body.status as GiftStatus)
      : GiftStatus.IDEA;

  const created = await prisma.giftIdea.create({
    data: {
      personId,
      title,
      description: typeof body.description === "string" ? body.description.trim() || null : null,
      url: typeof body.url === "string" ? body.url.trim() || null : null,
      status,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
