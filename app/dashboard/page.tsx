import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [peopleCount, ideasCount, openIdeasCount, recentIdeas, upcomingBirthdays] = await Promise.all([
    prisma.person.count(),
    prisma.giftIdea.count(),
    prisma.giftIdea.count({ where: { giftedAt: null } }),
    prisma.giftIdea.findMany({
      where: { giftedAt: null },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        person: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.person.findMany({
      where: { birthday: { not: null } },
      orderBy: { birthday: "asc" },
      take: 5,
      select: {
        id: true,
        name: true,
        birthday: true,
      },
    }),
  ]);

  return (
    <main className="page">
      <h1>Dashboard</h1>
      <p className="muted">Übersicht für eine Person.</p>

      <section className="grid stats-grid">
        <article className="card">
          <h2>Personen</h2>
          <p className="stat-value">{peopleCount}</p>
        </article>
        <article className="card">
          <h2>Ideen gesamt</h2>
          <p className="stat-value">{ideasCount}</p>
        </article>
        <article className="card">
          <h2>Offene Ideen</h2>
          <p className="stat-value">{openIdeasCount}</p>
        </article>
      </section>

      <section className="grid two-col">
        <article className="card">
          <h2>Neueste Geschenkideen</h2>
          {recentIdeas.length === 0 ? (
            <p className="muted">Noch keine Ideen vorhanden.</p>
          ) : (
            <ul className="list">
              {recentIdeas.map((idea) => (
                <li key={idea.id}>
                  <Link href={`/people/${idea.person.id}`}>{idea.title}</Link>
                  <span className="muted"> · {idea.person.name}</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="card">
          <h2>Nächste Geburtstage</h2>
          {upcomingBirthdays.length === 0 ? (
            <p className="muted">Keine Geburtstage hinterlegt.</p>
          ) : (
            <ul className="list">
              {upcomingBirthdays.map((person) => (
                <li key={person.id}>
                  <Link href={`/people/${person.id}`}>{person.name}</Link>
                  <span className="muted">
                    {" "}
                    · {person.birthday?.toLocaleDateString("de-DE")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}
