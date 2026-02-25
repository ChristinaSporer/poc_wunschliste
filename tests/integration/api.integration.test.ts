import { describe, expect, it } from "vitest";

type PersonSummary = {
  id: number;
  name: string;
  shareToken: string;
};

type GiftIdea = {
  id: number;
  title: string;
  giftedAt?: string | null;
};

const shouldSkip = process.env.SKIP_INTEGRATION_TESTS === "1";
const testGroup = describe.skipIf(shouldSkip);
const baseUrl = process.env.INTEGRATION_BASE_URL ?? "http://127.0.0.1:4010";

testGroup("API integration flows", () => {
  it("creates a person and returns it in /api/people", async () => {
    const personName = `Integration Person ${Date.now()}`;

    const createResponse = await fetch(`${baseUrl}/api/people`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `  ${personName}  `,
        notes: "integration",
      }),
    });

    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()) as PersonSummary;
    expect(created.name).toBe(personName);
    expect(created.shareToken).toHaveLength(16);

    const listResponse = await fetch(`${baseUrl}/api/people`);
    expect(listResponse.status).toBe(200);

    const people = (await listResponse.json()) as PersonSummary[];
    const createdInList = people.find((person) => person.id === created.id);

    expect(createdInList).toBeDefined();
    expect(createdInList?.name).toBe(personName);
  });

  it("filters gifted ideas from share endpoint", async () => {
    const createPersonResponse = await fetch(`${baseUrl}/api/people`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: `Share Test ${Date.now()}` }),
    });

    expect(createPersonResponse.status).toBe(201);
    const person = (await createPersonResponse.json()) as PersonSummary;

    const openIdeaResponse = await fetch(`${baseUrl}/api/people/${person.id}/ideas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: "Visible Idea" }),
    });
    expect(openIdeaResponse.status).toBe(201);
    const openIdea = (await openIdeaResponse.json()) as GiftIdea;

    const giftedIdeaResponse = await fetch(`${baseUrl}/api/people/${person.id}/ideas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: "Hidden Idea" }),
    });
    expect(giftedIdeaResponse.status).toBe(201);
    const giftedIdea = (await giftedIdeaResponse.json()) as GiftIdea;

    const markGiftedResponse = await fetch(`${baseUrl}/api/ideas/${giftedIdea.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        giftedAt: new Date().toISOString(),
      }),
    });
    expect(markGiftedResponse.status).toBe(200);

    const shareResponse = await fetch(`${baseUrl}/api/share/${person.shareToken}`);
    expect(shareResponse.status).toBe(200);

    const shareIdeas = (await shareResponse.json()) as GiftIdea[];
    expect(shareIdeas.some((idea) => idea.id === openIdea.id)).toBe(true);
    expect(shareIdeas.some((idea) => idea.id === giftedIdea.id)).toBe(false);
    expect(shareIdeas.every((idea) => !("giftedAt" in idea))).toBe(true);
  });
});
