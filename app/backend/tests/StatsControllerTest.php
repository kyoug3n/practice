<?php

declare(strict_types=1);

namespace Recall\Tests;

use DateTimeImmutable;
use DateTimeZone;
use Recall\Domain\Grade;
use Recall\Domain\Review;
use Recall\Domain\User;
use Recall\Domain\ValueObject\CardId;
use Recall\Domain\ValueObject\Day;
use Recall\Domain\ValueObject\Ease;
use Recall\Domain\ValueObject\Interval;
use Recall\Domain\ValueObject\ReviewId;
use Recall\Domain\ValueObject\UserId;
use Recall\Domain\ValueObject\Username;
use Recall\Http\AuthenticationMiddleware;
use Recall\Http\Controller\StatsController;
use Recall\Http\Serializer;
use Recall\Infrastructure\Persistence\CardRepository;
use Recall\Infrastructure\Persistence\DatabaseContext;
use Recall\Infrastructure\Persistence\ReviewRepository;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;
use Symfony\Component\Uid\UuidV7;
use Testo\Assert;
use Testo\Test;

final class StatsControllerTest
{
    #[Test]
    public function countsReviewsOnTheCurrentCalendarDay(): void
    {
        $orm = DatabaseContext::boot(':memory:')->orm;
        $cards = new CardRepository($orm);
        $reviews = new ReviewRepository($orm);
        $userId = UserId::generate();
        $timezone = new DateTimeZone('Europe/Amsterdam');
        $now = new DateTimeImmutable('2026-07-18T00:30:00', $timezone);
        $reviewAt = new DateTimeImmutable('2026-07-17T22:30:00+00:00');
        $reviewId = new ReviewId(new UuidV7(UuidV7::generate($reviewAt)));
        $review = new Review(
            $reviewId,
            CardId::generate(),
            Grade::Good,
            Interval::ofDays(1),
            Ease::default(),
            new Day('2026-07-19'),
        );
        $reviews->save($userId, $review);
        $user = new User($userId, Username::fromString('stats-user'), '');
        $request = (new ServerRequestFactory())
            ->createServerRequest('GET', '/stats')
            ->withAttribute(AuthenticationMiddleware::USER_ATTRIBUTE, $user);
        $response = (new StatsController($cards, $reviews, new Serializer(), $now))
            ->index($request, (new ResponseFactory())->createResponse());
        /** @var array{streak: int} $stats */
        $stats = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);

        Assert::same($stats['streak'], 1);
    }
}
