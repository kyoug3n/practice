<?php

declare(strict_types=1);

namespace Recall\Http\Input;

use InvalidArgumentException;
use Recall\Domain\ValueObject\Title;
use Recall\Http\ValidationException;

/** Разбор тела запроса для сохранения книги. */
final readonly class BookInput
{
    private const int MAX_AUTHOR_LENGTH = 200;

    public function __construct(
        public Title $title,
        public string $author,
        public ?string $openLibraryKey,
        public ?int $coverId,
    ) {}

    /** @param array<array-key, mixed> $data */
    public static function fromArray(array $data): self
    {
        $errors = [];
        $title = null;
        try {
            $title = Title::fromString(self::str($data['title'] ?? ''));
        } catch (InvalidArgumentException $e) {
            $errors['title'] = $e->getMessage();
            $title = null;
        }

        $author = trim(self::str($data['author'] ?? ''));
        if (mb_strlen($author) > self::MAX_AUTHOR_LENGTH) {
            $errors['author'] = 'имя автора длиннее ' . self::MAX_AUTHOR_LENGTH . ' символов';
        }

        $coverId = self::coverId($data['cover_id'] ?? null);
        if ($coverId === false) {
            $errors['cover_id'] = 'идентификатор обложки должен быть положительным числом';
            $coverId = null;
        }

        if ($errors !== []) {
            throw new ValidationException('проверьте поля книги', $errors);
        }

        return new self($title, $author, self::nullableString($data['open_library_key'] ?? null), $coverId);
    }

    private static function str(mixed $value): string
    {
        return is_scalar($value) ? (string) $value : '';
    }

    private static function nullableString(mixed $value): ?string
    {
        $value = trim(self::str($value));

        return $value === '' ? null : $value;
    }

    private static function coverId(mixed $value): int|false|null
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (is_int($value)) {
            return $value > 0 ? $value : false;
        }
        if (is_string($value) && preg_match('/^[1-9]\d*$/', $value) === 1) {
            $number = (int) $value;

            return $number > 0 ? $number : false;
        }

        return false;
    }
}
