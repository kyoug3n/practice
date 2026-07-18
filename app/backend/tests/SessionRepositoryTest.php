<?php

declare(strict_types=1);

namespace Recall\Tests;

use DateTimeImmutable;
use Recall\Domain\Session;
use Recall\Domain\ValueObject\UserId;
use Recall\Infrastructure\Persistence\Orm;
use Recall\Infrastructure\Persistence\SessionRepository;
use Testo\Assert;
use Testo\Test;

final class SessionRepositoryTest
{
    #[Test]
    public function readsAnActiveSessionByItsOpaqueToken(): void
    {
        $repo = new SessionRepository(Orm::boot(':memory:')->orm);
        $now = new DateTimeImmutable('2026-07-18T12:00:00+00:00');
        $credentials = Session::start(UserId::generate(), $now);
        $repo->save($credentials->session);

        $found = $repo->findByToken($credentials->token, $now);

        Assert::notNull($found);
        Assert::same($found->userId->toString(), $credentials->session->userId->toString());
        Assert::false($found->tokenHash === (string) $credentials->token);
    }

    #[Test]
    public function removesExpiredSessions(): void
    {
        $repo = new SessionRepository(Orm::boot(':memory:')->orm);
        $now = new DateTimeImmutable('2026-07-18T12:00:00+00:00');
        $credentials = Session::start(UserId::generate(), $now);
        $repo->save($credentials->session);

        $found = $repo->findByToken($credentials->token, $now->modify('+31 days'));

        Assert::null($found);
    }
}
