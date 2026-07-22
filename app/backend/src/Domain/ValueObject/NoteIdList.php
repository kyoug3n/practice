<?php

declare(strict_types=1);

namespace Recall\Domain\ValueObject;

use InvalidArgumentException;

/** Ссылки заметки на другие заметки. */
final readonly class NoteIdList
{
    private const string INVALID_LINK = 'ссылка на заметку должна быть UUID';

    /** @var list<NoteId> */
    public array $ids;

    public function __construct(NoteId ...$ids)
    {
        $this->ids = array_values($ids);
    }

    /** @param iterable<mixed> $raw */
    public static function fromStrings(iterable $raw): self
    {
        $ids = [];
        foreach ($raw as $value) {
            if (!is_string($value) || $value === '') {
                throw new InvalidArgumentException(self::INVALID_LINK);
            }

            try {
                $ids[] = NoteId::fromString($value);
            } catch (InvalidArgumentException $e) {
                throw new InvalidArgumentException(self::INVALID_LINK, $e->getCode(), previous: $e);
            }
        }

        return new self(...$ids);
    }

    /** @return list<string> */
    public function toStrings(): array
    {
        return array_map(static fn(NoteId $id): string => $id->toString(), $this->ids);
    }
}
