import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateMock, deleteMock } = vi.hoisted(() => ({
  updateMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    giftIdea: {
      update: updateMock,
      delete: deleteMock,
    },
  },
}));

import { DELETE, PATCH } from "./route";

describe("/api/ideas/[id]", () => {
  beforeEach(() => {
    updateMock.mockReset();
    deleteMock.mockReset();
  });

  it("PATCH returns 400 for invalid id", async () => {
    const request = new Request("http://localhost/api/ideas/x", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Neue Idee" }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "x" }) });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "Ungültige ID." });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("PATCH returns 400 for invalid status", async () => {
    const request = new Request("http://localhost/api/ideas/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "INVALID" }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "1" }) });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "Ungültiger Status." });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("PATCH updates idea and returns 200", async () => {
    updateMock.mockResolvedValue({
      id: 1,
      title: "Neue Idee",
      description: "Beschreibung",
      url: "https://example.com",
      status: "BOUGHT",
      giftedAt: new Date("2026-02-25"),
    });

    const request = new Request("http://localhost/api/ideas/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "  Neue Idee  ",
        description: "  Beschreibung  ",
        url: " https://example.com ",
        status: "BOUGHT",
        giftedAt: "2026-02-25",
      }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "1" }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        title: "Neue Idee",
        description: "Beschreibung",
        url: "https://example.com",
        status: "BOUGHT",
        giftedAt: new Date("2026-02-25"),
      },
    });
    expect(payload).toEqual({
      id: 1,
      title: "Neue Idee",
      description: "Beschreibung",
      url: "https://example.com",
      status: "BOUGHT",
      giftedAt: "2026-02-25T00:00:00.000Z",
    });
  });

  it("DELETE returns 400 for invalid id", async () => {
    const response = await DELETE(new Request("http://localhost/api/ideas/0"), {
      params: Promise.resolve({ id: "0" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "Ungültige ID." });
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("DELETE removes idea and returns 204", async () => {
    deleteMock.mockResolvedValue({ id: 1 });

    const response = await DELETE(new Request("http://localhost/api/ideas/1"), {
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(204);
    expect(deleteMock).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
