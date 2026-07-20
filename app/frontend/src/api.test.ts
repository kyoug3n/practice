import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "./api";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("api client", () => {
  it("разбирает JSON успешного ответа", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([{ id: "1" }]));
    vi.stubGlobal("fetch", fetchMock);

    const notes = await api.listNotes();

    expect(notes).toEqual([{ id: "1" }]);
  });

  it("кодирует тег в query-параметре", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    await api.listNotes("c++ и rust");

    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("/notes?tag=c%2B%2B%20%D0%B8%20rust");
  });

  it("на 204 возвращает undefined и не парсит тело", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.deleteNote("1")).resolves.toBeUndefined();
  });

  it("изменяет карточку через PUT", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        id: "card-1",
        note_id: "note-1",
        front: "new question",
        back: "new answer",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await api.updateCard("card-1", {
      note_id: "note-1",
      front: "new question",
      back: "new answer",
    });

    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/cards/card-1");
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.method).toBe("PUT");
    expect(init.body).toBe(
      JSON.stringify({
        note_id: "note-1",
        front: "new question",
        back: "new answer",
      }),
    );
  });

  it("удаляет карточку через DELETE", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.deleteCard("card-1")).resolves.toBeUndefined();

    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/cards/card-1");
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).method).toBe("DELETE");
  });

  it("превращает ошибку сервера с полем error в ApiError", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ error: "note not found" }, 404));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.queue()).rejects.toMatchObject({
      name: "ApiError",
      message: "note not found",
      status: 404,
    });
  });

  it("на ошибку без тела использует статус как сообщение", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(null, { status: 500, statusText: "Server Error" }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.stats()).rejects.toMatchObject({
      status: 500,
      message: "500 Server Error",
    });
  });

  it("сетевой сбой превращает в ApiError со статусом 0", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);

    const error = await api.stats().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(0);
  });

  it("не даёт вызывающему затереть Content-Type", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: "1" }, 201));
    vi.stubGlobal("fetch", fetchMock);

    await api.createNote({ title: "t", body: "b", tags: [] });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect((init.headers as Headers).get("Content-Type")).toBe(
      "application/json",
    );
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
  });

  it("регистрирует пользователя через API", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(
          { id: "1", username: "reader_01", created_at: "2026-07-19" },
          201,
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    await api.register({
      username: "reader_01",
      password: "correct-horse-battery-staple",
    });

    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/auth/register");
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).credentials).toBe(
      "include",
    );
  });

  it("выполняет вход пользователя через API", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(
          { id: "1", username: "reader_01", created_at: "2026-07-19" },
          200,
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    await api.login({
      username: "reader_01",
      password: "correct-horse-battery-staple",
    });

    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/auth/login");
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(init.body).toBe(
      JSON.stringify({
        username: "reader_01",
        password: "correct-horse-battery-staple",
      }),
    );
    expect(init.credentials).toBe("include");
  });

  it("запрашивает текущего пользователя через API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        id: "1",
        username: "reader_01",
        created_at: "2026-07-19",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await api.me();

    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/auth/me");
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.credentials).toBe("include");
  });

  it("завершает сессию через API", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.logout()).resolves.toBeUndefined();

    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/auth/logout");
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
  });

  it("запрашивает публичный профиль с кодированным логином", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        username: "reader_01",
        created_at: "2026-07-19T12:00:00+00:00",
        cards_count: 4,
        reviews_count: 12,
        practice_days: 3,
        current_streak: 2,
        longest_streak: 4,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await api.profile("reader_01");

    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/users/reader_01");
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).credentials).toBe(
      "include",
    );
  });
});
