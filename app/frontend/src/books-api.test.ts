import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("books api", () => {
  it("ищет книги с кодированным запросом", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    await api.searchBooks("rust & memory");

    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      "/books/search?q=rust%20%26%20memory",
    );
  });

  it("сохраняет выбранную книгу", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          id: "book-1",
          title: "The Rust Book",
          author: "Steve Klabnik",
          open_library_key: "/works/OL1W",
          cover_id: 42,
          created_at: "2026-07-21T00:00:00+00:00",
        },
        201,
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await api.createBook({
      title: "The Rust Book",
      author: "Steve Klabnik",
      open_library_key: "/works/OL1W",
      cover_id: 42,
    });

    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/books");
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).body).toBe(
      JSON.stringify({
        title: "The Rust Book",
        author: "Steve Klabnik",
        open_library_key: "/works/OL1W",
        cover_id: 42,
      }),
    );
  });
});
