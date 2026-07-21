import { parseTags } from "./format";
import { selectedLinkIds } from "./note-options";
import type { UiActions } from "./ui";

export interface NoteFormInput {
  title: string;
  body: string;
  tags: string[];
  links: string[];
  book_id?: string;
}

export function readNoteForm(
  form: HTMLFormElement,
  linksContainer: HTMLElement,
  actions: UiActions,
  bookId?: string,
): NoteFormInput {
  const data = new FormData(form);
  const input: NoteFormInput = {
    title: actions.field(data, "title"),
    body: actions.field(data, "body"),
    tags: parseTags(actions.field(data, "tags")),
    links: selectedLinkIds(linksContainer),
  };
  if (bookId !== undefined) {
    input.book_id = bookId;
  }

  return input;
}
