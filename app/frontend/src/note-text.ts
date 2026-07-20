import { tagLabel } from "./format";

const NOTE_TEXT_LIMIT = 35;

export function truncateNoteTitle(value: string): string {
  return value.length > NOTE_TEXT_LIMIT
    ? `${value.slice(0, NOTE_TEXT_LIMIT - 3)}...`
    : value;
}

export function truncateNoteTags(tags: string[]): string {
  const full = tagLabel(tags).trim();
  if (full.length <= NOTE_TEXT_LIMIT) {
    return full;
  }

  const visible: string[] = [];
  for (const tag of tags) {
    const candidate = tagLabel([...visible, tag]).trim();
    if (candidate.length + 3 > NOTE_TEXT_LIMIT) {
      break;
    }
    visible.push(tag);
  }
  return visible.length > 0
    ? `${tagLabel(visible).trim()}...`
    : `${full.slice(0, NOTE_TEXT_LIMIT - 3)}...`;
}
