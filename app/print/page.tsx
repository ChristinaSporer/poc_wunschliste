import { prisma } from "@/lib/prisma";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

export default async function PrintPage() {
  const people = await prisma.person.findMany({
    orderBy: { name: "asc" },
    include: {
      giftIdeas: {
        where: { giftedAt: null },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return (
    <main className="page print-page">
      <h1>Druckansicht</h1>
      <p className="muted no-print">Nur offene Geschenkideen werden gezeigt.</p>
      <PrintButton />

      {people.map((person) => (
        <section key={person.id} className="card print-card">
          <h2>{person.name}</h2>
          {person.giftIdeas.length === 0 ? (
            <p className="muted">Keine offenen Ideen.</p>
          ) : (
            <ul className="list">
              {person.giftIdeas.map((idea) => (
                <li key={idea.id}>
                  <strong>{idea.title}</strong>
                  {idea.description ? ` – ${idea.description}` : ""}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </main>
  );
}
