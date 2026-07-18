<?php

declare(strict_types=1);

namespace Recall\Domain\ValueObject;

use Stringable;

/** Непрозрачный токен сессии, пригодный для значения cookie. */
final readonly class SessionToken implements Stringable
{
    private function __construct(private string $value) {}

    public static function generate(): self
    {
        return new self(rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '='));
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
