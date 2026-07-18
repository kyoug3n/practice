<?php

declare(strict_types=1);

namespace Recall\Infrastructure\Persistence;

use Cycle\ORM\EntityManager;
use Cycle\ORM\ORMInterface;
use Cycle\ORM\Select;
use Recall\Domain\Review;

/** Доступ к повторениям через Cycle ORM. */
final readonly class ReviewRepository
{
    public function __construct(private ORMInterface $orm) {}

    /** @return list<Review> */
    public function all(): array
    {
        $reviews = [];
        foreach ((new Select($this->orm, Review::class))->orderBy('id')->fetchAll() as $review) {
            if ($review instanceof Review) {
                $reviews[] = $review;
            }
        }

        return $reviews;
    }

    public function save(Review $review): void
    {
        (new EntityManager($this->orm))->persist($review)->run();
    }
}
