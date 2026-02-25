"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PersonDetail } from "./page";

type Props = {
  person: PersonDetail;
};

export function PersonDetailClient({ person }: Props) {
  const router = useRouter();
  const [name, setName] = useState(person.name);
  const [birthday, setBirthday] = useState(person.birthday?.slice(0, 10) ?? "");
  const [notes, setNotes] = useState(person.notes ?? "");
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaDescription, setIdeaDescription] = useState("");
  const [ideaUrl, setIdeaUrl] = useState("");
  const [savingPerson, setSavingPerson] = useState(false);
  const [savingIdea, setSavingIdea] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return `/share/${person.shareToken}`;
    return `${window.location.origin}/share/${person.shareToken}`;
  }, [person.shareToken]);

  async function onSavePerson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingPerson(true);

    await fetch(`/api/people/${person.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, birthday, notes }),
    });

    setSavingPerson(false);
    router.refresh();
  }

  async function onCreateIdea(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingIdea(true);

    await fetch(`/api/people/${person.id}/ideas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: ideaTitle,
        description: ideaDescription,
        url: ideaUrl,
        status: "IDEA",
      }),
    });

    setIdeaTitle("");
    setIdeaDescription("");
    setIdeaUrl("");
    setSavingIdea(false);
    router.refresh();
  }

  async function markAsGifted(ideaId: number) {
    await fetch(`/api/ideas/${ideaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ giftedAt: new Date().toISOString(), status: "BOUGHT" }),
    });
    router.refresh();
  }

  async function reopenIdea(ideaId: number) {
    await fetch(`/api/ideas/${ideaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ giftedAt: "", status: "IDEA" }),
    });
    router.refresh();
  }

  async function removeIdea(ideaId: number) {
    const confirmed = window.confirm("Idee wirklich löschen?");
    if (!confirmed) return;

    await fetch(`/api/ideas/${ideaId}`, {
      method: "DELETE",
    });
    router.refresh();
  }

  return (
    <main className="page">
      <p>
        <Link href="/people">← Zurück zu Personen</Link>
      </p>
      <h1>{person.name}</h1>

      <section className="card">
        <h2>Person bearbeiten</h2>
        <form className="form" onSubmit={onSavePerson}>
          <label>
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label>
            Geburtstag
            <input
              type="date"
              value={birthday}
              onChange={(event) => setBirthday(event.target.value)}
            />
          </label>
          <label>
            Notizen
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
          </label>
          <button type="submit" disabled={savingPerson}>
            {savingPerson ? "Speichert..." : "Speichern"}
          </button>
        </form>
        <p className="muted">
          Share-Link: <a href={shareUrl}>{shareUrl}</a>
        </p>
      </section>

      <section className="card">
        <h2>Neue Idee</h2>
        <form className="form" onSubmit={onCreateIdea}>
          <label>
            Titel
            <input
              value={ideaTitle}
              onChange={(event) => setIdeaTitle(event.target.value)}
              required
            />
          </label>
          <label>
            Beschreibung
            <textarea
              value={ideaDescription}
              onChange={(event) => setIdeaDescription(event.target.value)}
              rows={2}
            />
          </label>
          <label>
            URL
            <input value={ideaUrl} onChange={(event) => setIdeaUrl(event.target.value)} />
          </label>
          <button type="submit" disabled={savingIdea}>
            {savingIdea ? "Speichert..." : "Idee hinzufügen"}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Geschenkideen</h2>
        {person.giftIdeas.length === 0 ? (
          <p className="muted">Noch keine Ideen vorhanden.</p>
        ) : (
          <ul className="list ideas-list">
            {person.giftIdeas.map((idea) => (
              <li key={idea.id}>
                <div>
                  <strong>{idea.title}</strong>
                  {idea.description ? <p>{idea.description}</p> : null}
                  {idea.url ? (
                    <p>
                      <a href={idea.url} target="_blank" rel="noreferrer">
                        Link öffnen
                      </a>
                    </p>
                  ) : null}
                  <p className="muted">
                    Status: {idea.status}
                    {idea.giftedAt
                      ? ` · Verschenkt am ${new Date(idea.giftedAt).toLocaleDateString("de-DE")}`
                      : ""}
                  </p>
                </div>
                <div className="actions">
                  {idea.giftedAt ? (
                    <button type="button" onClick={() => reopenIdea(idea.id)}>
                      Reaktivieren
                    </button>
                  ) : (
                    <button type="button" onClick={() => markAsGifted(idea.id)}>
                      Als verschenkt markieren
                    </button>
                  )}
                  <button type="button" onClick={() => removeIdea(idea.id)}>
                    Löschen
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
