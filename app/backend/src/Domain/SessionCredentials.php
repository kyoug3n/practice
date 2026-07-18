<?php

declare(strict_types=1);

namespace Recall\Domain;

use Recall\Domain\ValueObject\SessionToken;

/** Одноразово возвращаемая пара для установки cookie и сохранения сессии. */
final readonly class SessionCredentials
{
    public function __construct(
        public Session $session,
        public SessionToken $token,
    ) {}
}
