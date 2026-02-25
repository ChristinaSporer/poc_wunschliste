import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUniqueMock, updateMock, deleteMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  updateMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    person: {
      findUnique: findUniqueMock,
      update: updateMock,
      delete: deleteMock,
    },
  },
}));

import { DELETE, GET, PATCH } from "./route";

describe("/api/people/[id]", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    updateMock.mockReset();
    deleteMock.mockReset();
  });

  it("GET returns 400 for invalid id", async () => {
    const response = await GET(new Request("http://localhost/api/people/x"), {
      params: Promise.resolve({ id: "x" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "Ungültige ID." });
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("GET returns 404 when person is missing", async () => {
    findUniqueMock.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/people/1"), {
      params: Promise.resolve({ id: "1" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload).toEqual({ error: "Person nicht gefunden." });
  });

  it("GET returns person with ideas", async () => {
    findUniqueMock.mockResolvedValue({
      id: 1,
      name: "Anna",
      giftIdeas: [],
    });

    const response = await GET(new Request("http://localhost/api/people/1"), {
      params: Promise.resolve({ id: "1" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        giftIdeas: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
    expect(payload).toEqual({ id: 1, name: "Anna", giftIdeas: [] });
  });

  it("PATCH validates empty name", async () => {
    const request = new Request("http://localhost/api/people/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "   " }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "1" }) });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "Name ist erforderlich." });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("PATCH updates person", async () => {
    updateMock.mockResolvedValue({
      id: 1,
      name: "Clara",
      birthday: new Date("1996-02-21"),
      notes: "Notiz",
    });

    const request = new Request("http://localhost/api/people/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "  Clara ",
        birthday: "1996-02-21",
        notes: "  Notiz  ",
      }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "1" }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        name: "Clara",
        birthday: new Date("1996-02-21"),
        notes: "Notiz",
      },
    });
    expect(payload).toEqual({
      id: 1,
      name: "Clara",
      birthday: "1996-02-21T00:00:00.000Z",
      notes: "Notiz",
    });
  });

  it("DELETE returns 400 for invalid id", async () => {
    const response = await DELETE(new Request("http://localhost/api/people/0"), {
      params: Promise.resolve({ id: "0" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "Ungültige ID." });
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("DELETE removes person and returns 204", async () => {
    deleteMock.mockResolvedValue({ id: 1 });

    const response = await DELETE(new Request("http://localhost/api/people/1"), {
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(204);
    expect(deleteMock).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
