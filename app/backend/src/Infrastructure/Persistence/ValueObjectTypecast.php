<?php

declare(strict_types=1);

namespace Recall\Infrastructure\Persistence;

use Cycle\ORM\Parser\CastableInterface;
use Cycle\ORM\Parser\UncastableInterface;
use Recall\Domain\ValueObject\BookId;
use Recall\Domain\ValueObject\CardId;
use Recall\Domain\ValueObject\CardText;
use Recall\Domain\ValueObject\Day;
use Recall\Domain\ValueObject\Ease;
use Recall\Domain\ValueObject\Interval;
use Recall\Domain\ValueObject\NoteId;
use Recall\Domain\ValueObject\NoteIdList;
use Recall\Domain\ValueObject\ReviewId;
use Recall\Domain\ValueObject\SessionId;
use Recall\Domain\ValueObject\TagList;
use Recall\Domain\ValueObject\Title;
use Recall\Domain\ValueObject\UserId;
use Recall\Domain\ValueObject\Username;

/**
 * Единая точка перевода значений между БД и доменными value-объектами.
 * Домен остаётся чистым: знание о хранении живёт здесь, в инфраструктуре.
 */
final class ValueObjectTypecast implements CastableInterface, UncastableInterface
{
    /** @var array<string, callable(mixed): mixed> */
    private array $cast = [];

    /** @var array<string, callable(mixed): mixed> */
    private array $uncast = [];

    /**
     * @param  array<non-empty-string, mixed> $rules
     * @return array<non-empty-string, mixed>
     */
    public function setRules(array $rules): array
    {
        foreach ($rules as $field => $rule) {
            if (!is_string($rule)) {
                continue;
            }
            $pair = $this->pair($rule);
            if ($pair === null) {
                continue;
            }
            [$this->cast[$field], $this->uncast[$field]] = $pair;
            unset($rules[$field]);
        }

        return $rules;
    }

    /**
     * @param  array<array-key, mixed> $data
     * @return array<array-key, mixed>
     */
    public function cast(array $data): array
    {
        foreach ($this->cast as $field => $convert) {
            if (isset($data[$field])) {
                $data[$field] = $convert($data[$field]);
            }
        }

        return $data;
    }

    /**
     * @param  array<array-key, mixed> $data
     * @return array<array-key, mixed>
     */
    public function uncast(array $data): array
    {
        foreach ($this->uncast as $field => $convert) {
            if (isset($data[$field])) {
                $data[$field] = $convert($data[$field]);
            }
        }

        return $data;
    }

    /** @return array{0: callable(mixed): mixed, 1: callable(mixed): mixed}|null */
    private function pair(string $rule): ?array
    {
        $identity = $this->identityPair($rule);
        if ($identity !== null) {
            return $identity;
        }

        return match ($rule) {
            Username::class => [
                static fn(mixed $v): Username => new Username(self::str($v)),
                static fn(mixed $v): string => $v instanceof Username ? $v->value : self::str($v),
            ],
            Title::class => [
                static fn(mixed $v): Title => new Title(self::str($v)),
                static fn(mixed $v): string => $v instanceof Title ? $v->value : self::str($v),
            ],
            CardText::class => [
                static fn(mixed $v): CardText => new CardText(self::str($v)),
                static fn(mixed $v): string => $v instanceof CardText ? $v->value : self::str($v),
            ],
            Day::class => [
                static fn(mixed $v): Day => new Day(self::str($v)),
                static fn(mixed $v): string => $v instanceof Day ? $v->value : self::str($v),
            ],
            Ease::class => [
                static fn(mixed $v): Ease => new Ease(self::float($v)),
                static fn(mixed $v): float => $v instanceof Ease ? $v->value : self::float($v),
            ],
            Interval::class => [
                static fn(mixed $v): Interval => new Interval(self::int($v)),
                static fn(mixed $v): int => $v instanceof Interval ? $v->days : self::int($v),
            ],
            TagList::class => [
                static fn(mixed $v): TagList => TagList::fromStrings(self::list($v)),
                static fn(mixed $v): string => self::json($v instanceof TagList ? $v->toStrings() : []),
            ],
            NoteIdList::class => [
                static fn(mixed $v): NoteIdList => NoteIdList::fromStrings(self::list($v)),
                static fn(mixed $v): string => self::json($v instanceof NoteIdList ? $v->toStrings() : []),
            ],
            default => null,
        };
    }

    /** @return array{0: callable(mixed): mixed, 1: callable(mixed): mixed}|null */
    private function identityPair(string $rule): ?array
    {
        return match ($rule) {
            BookId::class => [
                static fn(mixed $v): BookId => BookId::fromString(self::str($v)),
                static fn(mixed $v): string => $v instanceof BookId ? $v->toString() : self::str($v),
            ],
            CardId::class => [
                static fn(mixed $v): CardId => CardId::fromString(self::str($v)),
                static fn(mixed $v): string => $v instanceof CardId ? $v->toString() : self::str($v),
            ],
            NoteId::class => [
                static fn(mixed $v): NoteId => NoteId::fromString(self::str($v)),
                static fn(mixed $v): string => $v instanceof NoteId ? $v->toString() : self::str($v),
            ],
            ReviewId::class => [
                static fn(mixed $v): ReviewId => ReviewId::fromString(self::str($v)),
                static fn(mixed $v): string => $v instanceof ReviewId ? $v->toString() : self::str($v),
            ],
            SessionId::class => [
                static fn(mixed $v): SessionId => SessionId::fromString(self::str($v)),
                static fn(mixed $v): string => $v instanceof SessionId ? $v->toString() : self::str($v),
            ],
            UserId::class => [
                static fn(mixed $v): UserId => UserId::fromString(self::str($v)),
                static fn(mixed $v): string => $v instanceof UserId ? $v->toString() : self::str($v),
            ],
            default => null,
        };
    }

    private static function str(mixed $value): string
    {
        return is_scalar($value) ? (string) $value : '';
    }

    private static function float(mixed $value): float
    {
        return is_numeric($value) ? (float) $value : 0.0;
    }

    private static function int(mixed $value): int
    {
        return is_numeric($value) ? (int) $value : 0;
    }

    /** @return list<mixed> */
    private static function list(mixed $value): array
    {
        if (is_array($value)) {
            return array_values($value);
        }
        if (is_string($value)) {
            $decoded = json_decode($value, true);

            return is_array($decoded) ? array_values($decoded) : [];
        }

        return [];
    }

    /** @param list<string> $value */
    private static function json(array $value): string
    {
        return json_encode($value, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    }
}
