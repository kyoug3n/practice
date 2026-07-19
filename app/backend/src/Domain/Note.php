<?php

declare(strict_types=1);

namespace Recall\Domain;

use DateTimeImmutable;
use Recall\Domain\ValueObject\NoteId;
use Recall\Domain\ValueObject\NoteIdList;
use Recall\Domain\ValueObject\TagList;
use Recall\Domain\ValueObject\Title;
use Recall\Domain\ValueObject\UserId;

/** Заметка: заголовок, текст, теги и ссылки на другие заметки. */
class Note
{
    public function __construct(
        public NoteId $id,
        public Title $title,
        public string $body,
        public TagList $tags,
        public NoteIdList $links,
        public DateTimeImmutable $updatedAt,
        public ?UserId $userId = null,
    ) {}

    public static function create(
        Title $title,
        string $body,
        TagList $tags,
        NoteIdList $links,
        DateTimeImmutable $now,
    ): self {
        return new self(NoteId::generate(), $title, $body, $tags, $links, $now);
    }

    /** Момент создания берётся из UUIDv7 — отдельного поля не держим. */
    public function createdAt(): DateTimeImmutable
    {
        return $this->id->createdAt();
    }

    public function revise(Title $title, string $body, TagList $tags, NoteIdList $links, DateTimeImmutable $now): void
    {
        $this->title = $title;
        $this->body = $body;
        $this->tags = $tags;
        $this->links = $links;
        $this->updatedAt = $now;
    }
}
