<?php

declare(strict_types=1);

namespace Recall\Http\Controller;

use DateTimeImmutable;
use InvalidArgumentException;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Recall\Domain\Grade;
use Recall\Domain\PublicProfile;
use Recall\Domain\Review;
use Recall\Domain\ValueObject\Username;
use Recall\Http\Json;
use Recall\Http\Serializer;
use Recall\Infrastructure\Persistence\CardRepository;
use Recall\Infrastructure\Persistence\ReviewRepository;
use Recall\Infrastructure\Persistence\UserRepository;

/** Публичная статистика пользователя без доступа к его личным данным. */
final readonly class ProfileController
{
    public function __construct(
        private UserRepository $users,
        private CardRepository $cards,
        private ReviewRepository $reviews,
        private Serializer $serializer,
        private DateTimeImmutable $now,
    ) {}

    /** @param array<array-key, mixed> $args */
    public function show(Request $request, Response $response, array $args): Response
    {
        $rawUsername = $args['username'] ?? null;
        if (!is_string($rawUsername)) {
            return $this->notFound($response);
        }

        try {
            $username = Username::fromString($rawUsername);
        } catch (InvalidArgumentException) {
            return $this->notFound($response);
        }

        $user = $this->users->findByUsername($username);
        if ($user === null) {
            return $this->notFound($response);
        }

        $reviews = $this->reviews->all($user->id);
        [$practiceDays, $currentStreak, $longestStreak] = $this->reviewStats($reviews);
        $reviewsCount = count(array_filter(
            $reviews,
            static fn(Review $review): bool => $review->grade !== Grade::Again,
        ));
        $profile = new PublicProfile(
            username: $user->username,
            createdAt: $user->createdAt(),
            cardsCount: $this->cards->countForUser($user->id),
            reviewsCount: $reviewsCount,
            practiceDays: $practiceDays,
            currentStreak: $currentStreak,
            longestStreak: $longestStreak,
        );

        return Json::write($response, $this->serializer->serialize($profile));
    }

    /**
     * @param list<Review> $reviews
     * @return array{0: int, 1: int, 2: int}
     */
    private function reviewStats(array $reviews): array
    {
        $days = [];
        $timezone = $this->now->getTimezone();
        foreach ($reviews as $review) {
            $day = $review->createdAt()->setTimezone($timezone)->format('Y-m-d');
            $days[$day] = true;
        }

        $dates = array_keys($days);
        sort($dates);
        $longest = 0;
        $run = 0;
        $previous = null;
        foreach ($dates as $date) {
            $isNextDay = $previous !== null
                && (new DateTimeImmutable($date, $timezone))->modify('-1 day')->format('Y-m-d') === $previous;
            $run = $isNextDay ? $run + 1 : 1;
            $longest = max($longest, $run);
            $previous = $date;
        }

        $current = 0;
        $day = $this->now;
        while (isset($days[$day->format('Y-m-d')])) {
            ++$current;
            $day = $day->modify('-1 day');
        }

        return [count($days), $current, $longest];
    }

    private function notFound(Response $response): Response
    {
        return Json::error($response, 'профиль не найден', 404);
    }
}
