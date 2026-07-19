<?php

declare(strict_types=1);

namespace Recall\Tests;

use DateTimeImmutable;
use Recall\Domain\Note;
use Recall\Domain\ValueObject\NoteIdList;
use Recall\Domain\ValueObject\TagList;
use Recall\Domain\ValueObject\Title;
use Recall\Domain\ValueObject\UserId;
use Recall\Infrastructure\Persistence\NoteRepository;
use Recall\Infrastructure\Persistence\Orm;
use Testo\Assert;
use Testo\Test;

/**
 * Пример теста для демонстрации харнесса. Добавьте свои.
 *
 * Запуск: vendor/bin/testo  (или: just test)
 */
final class NoteRepositoryTest
{
    #[Test]
    public function createsAndReadsBackANote(): void
    {
        $repo = new NoteRepository(Orm::boot(':memory:')->orm);
        $ownerId = UserId::generate();

        $note = Note::create(
            Title::fromString('Working memory'),
            'Holds a handful of items at once.',
            TagList::fromStrings(['Memory', 'memory', 'COGNITION']),
            new NoteIdList(),
            new DateTimeImmutable(),
        );
        $repo->save($ownerId, $note);

        $found = $repo->find($ownerId, $note->id);
        Assert::notNull($found);
        Assert::same($found->title->value, 'Working memory');
        // Теги хранятся канонично: в нижнем регистре и без повторов.
        Assert::same($found->tags->toStrings(), ['memory', 'cognition']);
        Assert::same($found->body, 'Holds a handful of items at once.');
        Assert::same($found->userId?->toString(), $ownerId->toString());
    }
}
