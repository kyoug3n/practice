<?php

declare(strict_types=1);

namespace Recall\Domain;

use DateTimeImmutable;
use Recall\Domain\ValueObject\SessionId;
use Recall\Domain\ValueObject\SessionToken;
use Recall\Domain\ValueObject\UserId;

/** Сессия пользователя; исходный токен в БД не хранится. */
class Session
{
    public function __construct(
        public SessionId $id,
        public UserId $userId,
        public string $tokenHash,
        public DateTimeImmutable $expiresAt,
    ) {}

    public static function start(UserId $userId, DateTimeImmutable $now): SessionCredentials
    {
        $token = SessionToken::generate();
        $session = new self(
            SessionId::generate(),
            $userId,
            $token->hash(),
            $now->modify('+30 days'),
        );

        return new SessionCredentials($session, $token);
    }

    public function isExpired(DateTimeImmutable $now): bool
    {
        return $this->expiresAt <= $now;
    }
}
