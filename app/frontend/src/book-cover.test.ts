import { describe, expect, it } from "vitest";
import { bookCoverUrl } from "./book-cover";

describe("book covers", () => {
  it("строит URL обложки Open Library среднего размера", () => {
    expect(bookCoverUrl(12345)).toBe(
      "https://covers.openlibrary.org/b/id/12345-M.jpg?default=false",
    );
  });
});
