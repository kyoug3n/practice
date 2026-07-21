<?php

declare(strict_types=1);

namespace Recall\Infrastructure;

use Closure;
use JsonException;
use Recall\Domain\BookSearchResult;
use RuntimeException;

/** Ищет книги через Search API Open Library. */
final readonly class OpenLibraryClient
{
    private const int RESULT_LIMIT = 10;

    /** @var Closure(string): (?string) */
    private Closure $fetch;

    /** @param Closure(string): (?string)|null $fetch */
    public function __construct(?Closure $fetch = null)
    {
        $this->fetch = $fetch ?? static function (string $url): ?string {
            $context = stream_context_create([
                'http' => [
                    'method' => 'GET',
                    'timeout' => 5,
                    'header' => "Accept: application/json\r\nUser-Agent: Recall/1.0\r\n",
                ],
            ]);
            set_error_handler(static fn(int $severity, string $message, string $file, int $line): bool => true);
            try {
                $body = file_get_contents($url, false, $context);
            } finally {
                restore_error_handler();
            }

            return is_string($body) ? $body : null;
        };
    }

    /** @return list<BookSearchResult> */
    public function search(string $query): array
    {
        $url = 'https://openlibrary.org/search.json?' . http_build_query(
            [
                'q' => $query,
                'limit' => self::RESULT_LIMIT,
                'fields' => 'key,title,author_name,cover_i',
            ],
            '',
            '&',
            PHP_QUERY_RFC3986,
        );
        $body = ($this->fetch)($url);
        if ($body === null) {
            throw new RuntimeException('каталог книг недоступен');
        }

        try {
            $payload = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $e) {
            throw new RuntimeException('каталог книг вернул некорректный ответ', 0, $e);
        }

        $documents = is_array($payload) && is_array($payload['docs'] ?? null)
            ? array_values($payload['docs'])
            : [];

        return $this->results($documents);
    }

    /**
     * @param  array<array-key, mixed> $documents
     * @return list<BookSearchResult>
     */
    private function results(array $documents): array
    {
        $results = [];
        $seen = [];
        foreach ($documents as $document) {
            if (!is_array($document)) {
                continue;
            }
            $key = $this->stringValue($document['key'] ?? null);
            $title = trim($this->stringValue($document['title'] ?? null));
            if ($key === '') {
                continue;
            }
            if ($title === '') {
                continue;
            }
            if (isset($seen[$key])) {
                continue;
            }

            $seen[$key] = true;
            $results[] = new BookSearchResult(
                $title,
                $this->author($document['author_name'] ?? null),
                $key,
                $this->coverId($document['cover_i'] ?? null),
            );
        }

        return $results;
    }

    private function stringValue(mixed $value): string
    {
        return is_scalar($value) ? (string) $value : '';
    }

    private function author(mixed $value): string
    {
        if (!is_array($value)) {
            return '';
        }
        foreach ($value as $author) {
            if (is_scalar($author) && trim((string) $author) !== '') {
                return trim((string) $author);
            }
        }

        return '';
    }

    private function coverId(mixed $value): ?int
    {
        if (is_int($value) && $value > 0) {
            return $value;
        }
        if (is_string($value) && preg_match('/^[1-9]\d*$/', $value) === 1) {
            $coverId = (int) $value;

            return $coverId > 0 ? $coverId : null;
        }

        return null;
    }
}
