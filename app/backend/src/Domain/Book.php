<?php

declare(strict_types=1);

namespace Recall\Domain;

use DateTimeImmutable;
use InvalidArgumentException;
use Recall\Domain\ValueObject\BookId;
use Recall\Domain\ValueObject\Title;
use Recall\Domain\ValueObject\UserId;

/** Книга-источник заметок и её обложка из внешнего каталога. */
class Book
{
    private const int MAX_AUTHOR_LENGTH = 200;
    private const int MAX_OPEN_LIBRARY_KEY_LENGTH = 200;

    public function __construct(
        public BookId $id,
        public Title $title,
        public string $author,
        public ?string $openLibraryKey,
        public ?int $coverId,
        public ?UserId $userId = null,
    ) {
        $this->author = $this->author($author);
        $this->openLibraryKey = $this->openLibraryKey($openLibraryKey);
        $this->coverId = $this->coverId($coverId);
    }

    public static function create(
        Title $title,
        string $author,
        ?string $openLibraryKey,
        ?int $coverId,
    ): self {
        return new self(BookId::generate(), $title, $author, $openLibraryKey, $coverId);
    }

    /** Момент создания берётся из UUIDv7 — отдельного поля не держим. */
    public function createdAt(): DateTimeImmutable
    {
        return $this->id->createdAt();
    }

    private function author(string $author): string
    {
        $author = trim($author);
        if (mb_strlen($author) > self::MAX_AUTHOR_LENGTH) {
            throw new InvalidArgumentException('имя автора длиннее ' . self::MAX_AUTHOR_LENGTH . ' символов');
        }

        return $author;
    }

    private function openLibraryKey(?string $key): ?string
    {
        if ($key === null) {
            return null;
        }

        $key = trim($key);
        if ($key === '') {
            return null;
        }
        if (mb_strlen($key) > self::MAX_OPEN_LIBRARY_KEY_LENGTH) {
            throw new InvalidArgumentException(
                'идентификатор Open Library длиннее ' . self::MAX_OPEN_LIBRARY_KEY_LENGTH . ' символов',
            );
        }

        return $key;
    }

    private function coverId(?int $coverId): ?int
    {
        if ($coverId === null) {
            return null;
        }
        if ($coverId < 1) {
            throw new InvalidArgumentException('идентификатор обложки должен быть положительным');
        }

        return $coverId;
    }
}
