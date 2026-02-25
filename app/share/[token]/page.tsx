import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const person = await prisma.person.findUnique({
    where: { shareToken: token },
    select: {
      name: true,
      giftIdeas: {
        where: { giftedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          url: true,
        },
      },
    },
  });

  if (!person) {
    notFound();
  }

  return (
    <>
      <style>{`.site-header { display: none; }`}</style>
      <main className="page">
        <h1>Geschenkideen für {person.name}</h1>
        <p className="muted">Read-only Ansicht über Share-Link.</p>

        {person.giftIdeas.length === 0 ? (
          <p className="card">Keine offenen Ideen vorhanden.</p>
        ) : (
          <ul className="list card">
            {person.giftIdeas.map((idea) => (
              <li key={idea.id}>
                <strong>{idea.title}</strong>
                {idea.description ? <p>{idea.description}</p> : null}
                {idea.url ? (
                  <p>
                    <a href={idea.url} target="_blank" rel="noreferrer">
                      Link öffnen
                    </a>
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
