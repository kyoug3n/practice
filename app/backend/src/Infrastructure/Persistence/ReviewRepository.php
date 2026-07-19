<?php

declare(strict_types=1);

namespace Recall\Infrastructure\Persistence;

use Cycle\ORM\EntityManager;
use Cycle\ORM\ORMInterface;
use Cycle\ORM\Select;
use LogicException;
use Recall\Domain\Review;
use Recall\Domain\ValueObject\UserId;

/** Доступ к повторениям через Cycle ORM. */
final readonly class ReviewRepository
{
    public function __construct(private ORMInterface $orm) {}

    /** @return list<Review> */
    public function all(UserId $userId): array
    {
        $reviews = [];
        foreach ((new Select($this->orm, Review::class))
            ->where('userId', $userId->toString())
            ->orderBy('id')
            ->fetchAll() as $review) {
            if ($review instanceof Review) {
                $reviews[] = $review;
            }
        }

        return $reviews;
    }

    public function save(UserId $userId, Review $review): void
    {
        if ($review->userId === null) {
            $review->userId = $userId;
        } elseif ($review->userId->toString() !== $userId->toString()) {
            throw new LogicException('повторение принадлежит другому пользователю');
        }

        (new EntityManager($this->orm))->persist($review)->run();
    }
}
