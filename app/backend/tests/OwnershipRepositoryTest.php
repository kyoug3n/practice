<?php

declare(strict_types=1);

namespace Recall\Tests;

use DateTimeImmutable;
use Recall\Domain\Card;
use Recall\Domain\Grade;
use Recall\Domain\Note;
use Recall\Domain\ValueObject\CardText;
use Recall\Domain\ValueObject\NoteIdList;
use Recall\Domain\ValueObject\TagList;
use Recall\Domain\ValueObject\Title;
use Recall\Domain\ValueObject\UserId;
use Recall\Infrastructure\Persistence\CardRepository;
use Recall\Infrastructure\Persistence\NoteRepository;
use Recall\Infrastructure\Persistence\Orm;
use Recall\Infrastructure\Persistence\ReviewRepository;
use Testo\Assert;
use Testo\Test;

final class OwnershipRepositoryTest
{
    #[Test]
    public function readsOnlyTheCurrentUsersData(): void
    {
        $orm = Orm::boot(':memory:')->orm;
        $notes = new NoteRepository($orm);
        $cards = new CardRepository($orm);
        $reviews = new ReviewRepository($orm);
        $owner = UserId::generate();
        $other = UserId::generate();
        $now = new DateTimeImmutable('2026-07-19T12:00:00+00:00');

        $note = Note::create(
            Title::fromString('Private note'),
            '',
            new TagList(),
            new NoteIdList(),
            $now,
        );
        $notes->save($owner, $note);
        $card = Card::create($note->id, CardText::fromString('Question'), CardText::fromString('Answer'), $now);
        $cards->save($owner, $card);
        $reviews->save($owner, $card->grade(Grade::Good, $now));

        Assert::true($notes->belongsToAnotherUser($other, $note->id));
        Assert::false($notes->belongsToAnotherUser($owner, $note->id));
        Assert::same($notes->all($other, null), []);
        Assert::null($notes->find($other, $note->id));
        Assert::true($cards->belongsToAnotherUser($other, $card->id));
        Assert::false($cards->belongsToAnotherUser($owner, $card->id));
        Assert::same($cards->all($other), []);
        Assert::null($cards->find($other, $card->id));
        Assert::same($reviews->all($other), []);
    }
}
