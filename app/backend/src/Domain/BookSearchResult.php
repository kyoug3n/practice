<?php

declare(strict_types=1);

namespace Recall\Domain;

/** Нормализованный результат поиска книги во внешнем каталоге. */
final readonly class BookSearchResult
{
    public function __construct(
        public string $title,
        public string $author,
        public string $openLibraryKey,
        public ?int $coverId,
    ) {}
}
