import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { findUniqueMock, notFoundMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    person: {
      findUnique: findUniqueMock,
    },
  },
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

import SharePage from "./page";

describe("/share/[token] page", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    notFoundMock.mockClear();
  });

  it("renders heading with person name", async () => {
    findUniqueMock.mockResolvedValue({
      name: "Anna",
      giftIdeas: [],
    });

    const element = await SharePage({
      params: Promise.resolve({ token: "abc123" }),
    });

    const html = renderToStaticMarkup(element);

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { shareToken: "abc123" },
      select: {
        name: true,
        giftIdeas: {
          where: { giftedAt: null },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            description: true,
            url: true,
          },
        },
      },
    });
    expect(html).toContain("Geschenkideen für Anna");
  });

  it("calls notFound when token is invalid", async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(
      SharePage({ params: Promise.resolve({ token: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
