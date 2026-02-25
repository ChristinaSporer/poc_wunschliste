import { beforeEach, describe, expect, it, vi } from "vitest";

const { findManyMock, createMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    giftIdea: {
      findMany: findManyMock,
      create: createMock,
    },
  },
}));

import { GET, POST } from "./route";

describe("/api/people/[id]/ideas", () => {
  beforeEach(() => {
    findManyMock.mockReset();
    createMock.mockReset();
  });

  it("GET returns 400 for invalid person id", async () => {
    const response = await GET(new Request("http://localhost/api/people/x/ideas"), {
      params: Promise.resolve({ id: "x" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "Ungültige ID." });
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("GET returns ideas for person", async () => {
    findManyMock.mockResolvedValue([{ id: 1, title: "Buch" }]);

    const response = await GET(new Request("http://localhost/api/people/1/ideas"), {
      params: Promise.resolve({ id: "1" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(findManyMock).toHaveBeenCalledWith({
      where: { personId: 1 },
      orderBy: { createdAt: "desc" },
    });
    expect(payload).toEqual([{ id: 1, title: "Buch" }]);
  });

  it("POST validates missing title", async () => {
    const request = new Request("http://localhost/api/people/1/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "   " }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "1" }) });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "Titel ist erforderlich." });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("POST creates idea with default IDEA status", async () => {
    createMock.mockResolvedValue({
      id: 2,
      personId: 1,
      title: "Neue Idee",
      description: null,
      url: null,
      status: "IDEA",
    });

    const request = new Request("http://localhost/api/people/1/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "  Neue Idee  ", status: "INVALID" }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "1" }) });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(createMock).toHaveBeenCalledWith({
      data: {
        personId: 1,
        title: "Neue Idee",
        description: null,
        url: null,
        status: "IDEA",
      },
    });
    expect(payload).toEqual({
      id: 2,
      personId: 1,
      title: "Neue Idee",
      description: null,
      url: null,
      status: "IDEA",
    });
  });

  it("POST uses valid provided status and trims fields", async () => {
    createMock.mockResolvedValue({
      id: 3,
      personId: 1,
      title: "Set",
      description: "Beschreibung",
      url: "https://example.com",
      status: "RESERVED",
    });

    const request = new Request("http://localhost/api/people/1/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: " Set ",
        description: " Beschreibung ",
        url: " https://example.com ",
        status: "RESERVED",
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "1" }) });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(createMock).toHaveBeenCalledWith({
      data: {
        personId: 1,
        title: "Set",
        description: "Beschreibung",
        url: "https://example.com",
        status: "RESERVED",
      },
    });
    expect(payload).toEqual({
      id: 3,
      personId: 1,
      title: "Set",
      description: "Beschreibung",
      url: "https://example.com",
      status: "RESERVED",
    });
  });
});
