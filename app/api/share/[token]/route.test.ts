import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUniqueMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    person: {
      findUnique: findUniqueMock,
    },
  },
}));

import { GET } from "./route";

describe("/api/share/[token]", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
  });

  it("returns 404 when token is invalid", async () => {
    findUniqueMock.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/share/invalid"), {
      params: Promise.resolve({ token: "invalid" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload).toEqual({ error: "Link ungültig." });
  });

  it("returns open gift ideas for valid token", async () => {
    findUniqueMock.mockResolvedValue({
      giftIdeas: [
        {
          id: 11,
          title: "Buch",
          description: "Roman",
          url: null,
          status: "IDEA",
        },
      ],
    });

    const response = await GET(new Request("http://localhost/api/share/token-1"), {
      params: Promise.resolve({ token: "token-1" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { shareToken: "token-1" },
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
    expect(payload).toEqual([
      {
        id: 11,
        title: "Buch",
        description: "Roman",
        url: null,
        status: "IDEA",
      },
    ]);
  });
});
