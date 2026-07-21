<?php

declare(strict_types=1);

namespace Recall\Tests;

use DateTimeImmutable;
use Recall\Domain\Book;
use Recall\Domain\ValueObject\Title;
use Recall\Domain\ValueObject\UserId;
use Recall\Infrastructure\Persistence\BookRepository;
use Recall\Infrastructure\Persistence\DatabaseContext;
use Testo\Assert;
use Testo\Test;

final class BookRepositoryTest
{
    #[Test]
    public function storesBookMetadataAndKeepsItPrivate(): void
    {
        $repo = new BookRepository(DatabaseContext::boot(':memory:')->orm);
        $ownerId = UserId::generate();
        $otherUserId = UserId::generate();
        $book = Book::create(Title::fromString('The Pragmatic Programmer'), 'Andrew Hunt', '/works/OL123W', 12345);

        $repo->save($ownerId, $book);

        $found = $repo->find($ownerId, $book->id);
        Assert::notNull($found);
        Assert::same($found->title->value, 'The Pragmatic Programmer');
        Assert::same($found->author, 'Andrew Hunt');
        Assert::same($found->openLibraryKey, '/works/OL123W');
        Assert::same($found->coverId, 12345);
        Assert::same($found->createdAt()->format(DateTimeImmutable::ATOM), $book->createdAt()->format(DateTimeImmutable::ATOM));
        Assert::same($repo->find($otherUserId, $book->id), null);
        Assert::true($repo->belongsToAnotherUser($otherUserId, $book->id));
    }
}
