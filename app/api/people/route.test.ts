import { beforeEach, describe, expect, it, vi } from "vitest";

const { findManyMock, createMock, randomUUIDMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  createMock: vi.fn(),
  randomUUIDMock: vi.fn(() => "123e4567-e89b-12d3-a456-426614174000"),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    person: {
      findMany: findManyMock,
      create: createMock,
    },
  },
}));

vi.mock("crypto", () => ({
  randomUUID: randomUUIDMock,
}));

import { GET, POST } from "./route";

describe("/api/people", () => {
  beforeEach(() => {
    findManyMock.mockReset();
    createMock.mockReset();
    randomUUIDMock.mockClear();
  });

  it("GET returns mapped people with open and total idea counts", async () => {
    findManyMock.mockResolvedValue([
      {
        id: 1,
        name: "Anna",
        birthday: new Date("1992-05-12"),
        notes: "Mag Bücher",
        shareToken: "token-anna",
        giftIdeas: [
          { giftedAt: null },
          { giftedAt: new Date("2025-12-24") },
          { giftedAt: null },
        ],
      },
    ]);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual([
      {
        id: 1,
        name: "Anna",
        birthday: "1992-05-12T00:00:00.000Z",
        notes: "Mag Bücher",
        shareToken: "token-anna",
        totalIdeas: 3,
        openIdeas: 2,
      },
    ]);
  });

  it("POST returns 400 when name is missing", async () => {
    const request = new Request("http://localhost/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "   " }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "Name ist erforderlich." });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("POST creates a person and returns 201", async () => {
    createMock.mockResolvedValue({
      id: 10,
      name: "Clara",
      birthday: new Date("1996-02-21"),
      notes: "Kocht",
      shareToken: "123e4567e89b12d3",
    });

    const request = new Request("http://localhost/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "  Clara  ",
        birthday: "1996-02-21",
        notes: "  Kocht  ",
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledWith({
      data: {
        name: "Clara",
        birthday: new Date("1996-02-21"),
        notes: "Kocht",
        shareToken: "123e4567e89b12d3",
      },
    });
    expect(payload).toEqual({
      id: 10,
      name: "Clara",
      birthday: "1996-02-21T00:00:00.000Z",
      notes: "Kocht",
      shareToken: "123e4567e89b12d3",
    });
  });
});
