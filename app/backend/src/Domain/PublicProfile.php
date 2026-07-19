<?php

declare(strict_types=1);

namespace Recall\Domain;

use DateTimeImmutable;
use Recall\Domain\ValueObject\Username;

/** Публичные достижения пользователя без его личных данных. */
final readonly class PublicProfile
{
    public function __construct(
        public Username $username,
        public DateTimeImmutable $createdAt,
        public int $cardsCount,
        public int $reviewsCount,
        public int $practiceDays,
        public int $currentStreak,
        public int $longestStreak,
    ) {}
}
