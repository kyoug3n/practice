<?php

declare(strict_types=1);

namespace Recall\Infrastructure\Persistence;

use Cycle\ORM\EntityManager;
use Cycle\ORM\ORMInterface;
use Cycle\ORM\Select;
use Recall\Domain\User;
use Recall\Domain\ValueObject\UserId;
use Recall\Domain\ValueObject\Username;

/** Доступ к учётным записям через Cycle ORM. */
final readonly class UserRepository
{
    public function __construct(private ORMInterface $orm) {}

    public function find(UserId $id): ?User
    {
        return $this->first(
            (new Select($this->orm, User::class))->where('id', $id->toString())->fetchAll(),
        );
    }

    public function findByUsername(Username $username): ?User
    {
        return $this->first(
            (new Select($this->orm, User::class))->where('username', $username->value)->fetchAll(),
        );
    }

    public function save(User $user): void
    {
        (new EntityManager($this->orm))->persist($user)->run();
    }

    /** @param iterable<mixed> $rows */
    private function first(iterable $rows): ?User
    {
        foreach ($rows as $user) {
            if ($user instanceof User) {
                return $user;
            }
        }

        return null;
    }
}
