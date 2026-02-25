"use client";

import { useState } from "react";
import Link from "next/link";
import type { PersonListItem } from "./page";

type Props = {
  initialPeople: PersonListItem[];
};

export function PeopleClient({ initialPeople }: Props) {
  const [people, setPeople] = useState<PersonListItem[]>(initialPeople);
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onCreatePerson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          birthday,
          notes,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Speichern fehlgeschlagen");
      }

      const created = (await response.json()) as {
        id: number;
        name: string;
        birthday: string | null;
        notes: string | null;
        shareToken: string;
      };

      setPeople((currentPeople) =>
        [...currentPeople, {
          id: created.id,
          name: created.name,
          birthday: created.birthday,
          notes: created.notes,
          shareToken: created.shareToken,
          totalIdeas: 0,
          openIdeas: 0,
        }].sort((firstPerson, secondPerson) => firstPerson.name.localeCompare(secondPerson.name, "de")),
      );

      setName("");
      setBirthday("");
      setNotes("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unbekannter Fehler");
    } finally {
      setSaving(false);
    }
  }

  async function onDeletePerson(id: number) {
    const confirmed = window.confirm("Person wirklich löschen?");
    if (!confirmed) return;

    const response = await fetch(`/api/people/${id}`, { method: "DELETE" });
    if (response.ok) {
      setPeople((currentPeople) => currentPeople.filter((person) => person.id !== id));
    }
  }

  return (
    <main className="page">
      <h1>Personen</h1>
      <p className="muted">Personen verwalten und Share-Links erzeugen.</p>

      <section className="card">
        <h2>Neue Person</h2>
        <form className="form" onSubmit={onCreatePerson}>
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

          {error ? <p className="error">{error}</p> : null}
          <button type="submit" disabled={saving}>
            {saving ? "Speichert..." : "Person anlegen"}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Alle Personen</h2>
        {people.length === 0 ? (
          <p className="muted">Noch keine Personen vorhanden.</p>
        ) : (
          <ul className="list people-list">
            {people.map((person) => (
              <li key={person.id}>
                <div>
                  <Link href={`/people/${person.id}`}>{person.name}</Link>
                  <p className="muted">
                    Offene Ideen: {person.openIdeas} / {person.totalIdeas}
                    {person.birthday
                      ? ` · Geburtstag: ${new Date(person.birthday).toLocaleDateString("de-DE")}`
                      : ""}
                  </p>
                </div>
                <div className="actions">
                  <a href={`/share/${person.shareToken}`} target="_blank" rel="noreferrer">
                    Share-Link
                  </a>
                  <button type="button" onClick={() => onDeletePerson(person.id)}>
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
