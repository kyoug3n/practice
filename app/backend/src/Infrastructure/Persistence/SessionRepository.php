<?php

declare(strict_types=1);

namespace Recall\Infrastructure\Persistence;

use Cycle\ORM\EntityManager;
use Cycle\ORM\ORMInterface;
use Cycle\ORM\Select;
use DateTimeImmutable;
use Recall\Domain\Session;
use Recall\Domain\ValueObject\SessionToken;

/** Доступ к сессиям; токены ищутся только по их хешам. */
final readonly class SessionRepository
{
    public function __construct(private ORMInterface $orm) {}

    public function findByToken(SessionToken $token, DateTimeImmutable $now): ?Session
    {
        $session = (new Select($this->orm, Session::class))
            ->where('tokenHash', $token->hash())
            ->fetchOne();
        if (!$session instanceof Session) {
            return null;
        }
        if ($session->isExpired($now)) {
            $this->delete($session);

            return null;
        }

        return $session;
    }

    public function save(Session $session): void
    {
        (new EntityManager($this->orm))->persist($session)->run();
    }

    public function delete(Session $session): void
    {
        (new EntityManager($this->orm))->delete($session)->run();
    }
}
