import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;

  const person = await prisma.person.findUnique({
    where: { shareToken: token },
    select: {
      giftIdeas: {
        where: { giftedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          url: true,
          status: true,
        },
      },
    },
  });

  if (!person) {
    return NextResponse.json({ error: "Link ungültig." }, { status: 404 });
  }

  return NextResponse.json(person.giftIdeas);
}
