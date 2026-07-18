<?php

declare(strict_types=1);

namespace Recall\Http\Input;

use InvalidArgumentException;
use Recall\Domain\ValueObject\Username;
use Recall\Http\ValidationException;

/** Данные для входа по логину и паролю. */
final readonly class LoginInput
{
    public function __construct(
        public Username $username,
        public string $password,
    ) {}

    /** @param array<array-key, mixed> $data */
    public static function fromArray(array $data): self
    {
        $password = $data['password'] ?? null;
        if (!is_string($password) || $password === '') {
            throw new ValidationException('проверьте данные для входа', ['password' => 'укажите пароль']);
        }

        return new self(self::username($data['username'] ?? null), $password);
    }

    private static function username(mixed $raw): Username
    {
        if (!is_string($raw)) {
            throw new ValidationException('проверьте данные для входа', ['username' => 'укажите логин']);
        }
        try {
            return Username::fromString($raw);
        } catch (InvalidArgumentException $exception) {
            throw new ValidationException('проверьте данные для входа', ['username' => $exception->getMessage()]);
        }
    }
}
