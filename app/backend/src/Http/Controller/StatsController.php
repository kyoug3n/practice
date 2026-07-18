<?php

declare(strict_types=1);

namespace Recall\Http\Controller;

use DateTimeImmutable;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Recall\Domain\Stats;
use Recall\Domain\ValueObject\Day;
use Recall\Http\Json;
use Recall\Http\Serializer;
use Recall\Infrastructure\Persistence\CardRepository;
use Recall\Infrastructure\Persistence\ReviewRepository;

final readonly class StatsController
{
    public function __construct(
        private CardRepository $cards,
        private ReviewRepository $reviews,
        private Serializer $serializer,
        private DateTimeImmutable $now,
    ) {}

    public function index(Request $request, Response $response): Response
    {
        $today = Day::today($this->now);
        $weekEnd = new Day($this->now->modify('+6 days')->format('Y-m-d'));
        $dueToday = 0;
        $dueWeek = 0;
        foreach ($this->cards->all() as $card) {
            if ($card->isDue($today)) {
                ++$dueToday;
            }
            if ($card->due->isOnOrBefore($weekEnd)) {
                ++$dueWeek;
            }
        }

        $reviewDays = [];
        foreach ($this->reviews->all() as $review) {
            $reviewDays[$review->createdAt()->format('Y-m-d')] = true;
        }
        $streak = 0;
        $streakDay = $this->now;
        while (isset($reviewDays[$streakDay->format('Y-m-d')])) {
            ++$streak;
            $streakDay = $streakDay->modify('-1 day');
        }

        $stats = new Stats(dueToday: $dueToday, dueWeek: $dueWeek, streak: $streak);

        return Json::write($response, $this->serializer->serialize($stats));
    }
}
