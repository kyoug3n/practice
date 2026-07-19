// Небольшой типизированный клиент к API Recall.

const BASE: string =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  "http://localhost:8080";

export interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  links: string[];
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: string;
  note_id: string;
  front: string;
  back: string;
  ease: number;
  interval: number;
  due: string;
  created_at: string;
}

export interface Stats {
  due_today: number;
  due_week: number;
  streak: number;
}

export interface User {
  id: string;
  username: string;
  created_at: string;
}

export interface PublicProfile {
  username: string;
  created_at: string;
  cards_count: number;
  reviews_count: number;
  practice_days: number;
  current_streak: number;
  longest_streak: number;
}

export type Grade = "again" | "hard" | "good" | "easy";

// Ошибка обращения к API с понятным пользователю текстом.
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function messageFrom(body: unknown, fallback: string): string {
  if (typeof body === "object" && body !== null && "error" in body) {
    const error: unknown = (body as Record<string, unknown>).error;
    if (typeof error === "string" && error !== "") {
      return error;
    }
  }
  return fallback;
}

async function http<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  try {
    response = await fetch(`${BASE}${path}`, {
      ...init,
      credentials: "include",
      headers,
    });
  } catch {
    throw new ApiError("Сервер недоступен", 0);
  }

  if (!response.ok) {
    const fallback = `${response.status} ${response.statusText}`;
    const body: unknown = await response.json().catch(() => null);
    throw new ApiError(messageFrom(body, fallback), response.status);
  }

  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T);
}

export const api = {
  register: (input: { username: string; password: string }) =>
    http<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  login: (input: { username: string; password: string }) =>
    http<User>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  me: () => http<User>("/auth/me"),
  logout: async (): Promise<void> => {
    await http("/auth/logout", { method: "POST" });
  },
  listNotes: (tag?: string) =>
    http<Note[]>(`/notes${tag ? `?tag=${encodeURIComponent(tag)}` : ""}`),
  createNote: (input: { title: string; body: string; tags: string[] }) =>
    http<Note>("/notes", { method: "POST", body: JSON.stringify(input) }),
  updateNote: (
    id: string,
    input: { title: string; body: string; tags: string[]; links: string[] },
  ) =>
    http<Note>(`/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  createCard: (input: { note_id: string; front: string; back: string }) =>
    http<Card>("/cards", { method: "POST", body: JSON.stringify(input) }),
  deleteNote: async (id: string): Promise<void> => {
    await http(`/notes/${id}`, { method: "DELETE" });
  },

  queue: () => http<Card[]>("/reviews/queue"),
  grade: async (cardId: string, grade: Grade): Promise<void> => {
    await http(`/reviews/${cardId}`, {
      method: "POST",
      body: JSON.stringify({ grade }),
    });
  },

  stats: () => http<Stats>("/stats"),
  profile: (username: string) =>
    http<PublicProfile>(`/users/${encodeURIComponent(username)}`),
};
