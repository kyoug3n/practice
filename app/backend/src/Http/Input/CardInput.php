<?php

declare(strict_types=1);

namespace Recall\Http\Input;

use InvalidArgumentException;
use Recall\Domain\ValueObject\CardText;
use Recall\Http\ValidationException;

/** Разбор тела запроса для создания/изменения карточки. */
final readonly class CardInput
{
    public function __construct(
        public string $noteId,
        public CardText $front,
        public CardText $back,
    ) {}

    /** @param array<array-key, mixed> $data */
    public static function fromArray(array $data): self
    {
        $errors = [];
        $front = null;
        $back = null;

        try {
            $front = CardText::fromString(self::str($data['front'] ?? ''));
        } catch (InvalidArgumentException $e) {
            $errors['front'] = $e->getMessage();
        }

        try {
            $back = CardText::fromString(self::str($data['back'] ?? ''));
        } catch (InvalidArgumentException $e) {
            $errors['back'] = $e->getMessage();
        }

        if ($errors !== [] || $front === null || $back === null) {
            throw new ValidationException('проверьте поля карточки', $errors);
        }

        return new self(self::str($data['note_id'] ?? ''), $front, $back);
    }

    private static function str(mixed $value): string
    {
        return is_scalar($value) ? (string) $value : '';
    }
}
