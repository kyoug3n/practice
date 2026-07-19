<?php

declare(strict_types=1);

namespace Recall\Domain;

use DateTimeImmutable;
use Recall\Domain\ValueObject\CardId;
use Recall\Domain\ValueObject\Day;
use Recall\Domain\ValueObject\Ease;
use Recall\Domain\ValueObject\Interval;
use Recall\Domain\ValueObject\ReviewId;
use Recall\Domain\ValueObject\UserId;

/** Зафиксированная оценка карточки и полученное расписание. */
class Review
{
    public function __construct(
        public ReviewId $id,
        public CardId $cardId,
        public Grade $grade,
        public Interval $interval,
        public Ease $ease,
        public Day $nextDue,
        public ?UserId $userId = null,
    ) {}

    public function createdAt(): DateTimeImmutable
    {
        return $this->id->createdAt();
    }
}
