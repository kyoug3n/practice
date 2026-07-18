<?php

declare(strict_types=1);

namespace Recall\Domain;

use DateTimeImmutable;
use InvalidArgumentException;
use Recall\Domain\ValueObject\UserId;
use Recall\Domain\ValueObject\Username;

/** Учётная запись пользователя с хешем пароля. */
class User
{
    public function __construct(
        public UserId $id,
        public Username $username,
        public string $passwordHash,
    ) {}

    public static function register(Username $username, string $password): self
    {
        self::validatePassword($password);

        return new self(UserId::generate(), $username, password_hash($password, PASSWORD_DEFAULT));
    }

    public function createdAt(): DateTimeImmutable
    {
        return $this->id->createdAt();
    }

    public function verifiesPassword(string $password): bool
    {
        return password_verify($password, $this->passwordHash);
    }

    private static function validatePassword(string $password): void
    {
        $length = strlen($password);
        if ($length < 12 || $length > 72) {
            throw new InvalidArgumentException('пароль должен содержать от 12 до 72 байт');
        }
    }
}
