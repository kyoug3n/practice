<?php

declare(strict_types=1);

namespace Recall\Domain\ValueObject;

use InvalidArgumentException;
use Stringable;

/** Публичный логин пользователя и будущая часть URL профиля. */
final readonly class Username implements Stringable
{
    public function __construct(public string $value)
    {
        if (preg_match('/^[a-z0-9][a-z0-9_-]{2,31}$/', $value) !== 1) {
            throw new InvalidArgumentException('логин: 3–32 строчных латинских символа, цифры, _ или -');
        }
    }

    public static function fromString(string $value): self
    {
        return new self($value);
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
