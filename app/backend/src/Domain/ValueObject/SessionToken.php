<?php

declare(strict_types=1);

namespace Recall\Domain\ValueObject;

use InvalidArgumentException;
use Stringable;

/** Непрозрачный токен сессии, пригодный для значения cookie. */
final readonly class SessionToken implements Stringable
{
    private function __construct(private string $value) {}

    public static function generate(): self
    {
        return new self(rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '='));
    }

    public static function fromString(string $value): self
    {
        if (preg_match('/^[A-Za-z0-9_-]{43}$/', $value) !== 1) {
            throw new InvalidArgumentException('некорректный токен сессии');
        }

        return new self($value);
    }

    public function hash(): string
    {
        return hash('sha256', $this->value);
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
