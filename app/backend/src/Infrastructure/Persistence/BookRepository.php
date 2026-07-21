<?php

declare(strict_types=1);

namespace Recall\Infrastructure\Persistence;

use Cycle\ORM\EntityManager;
use Cycle\ORM\ORMInterface;
use Cycle\ORM\Select;
use LogicException;
use Recall\Domain\Book;
use Recall\Domain\ValueObject\BookId;
use Recall\Domain\ValueObject\UserId;

/** Доступ к книгам через Cycle ORM. */
final readonly class BookRepository
{
    public function __construct(private ORMInterface $orm) {}

    /** @return list<Book> */
    public function all(UserId $userId): array
    {
        return $this->collect(
            (new Select($this->orm, Book::class))->where('userId', $userId->toString())->orderBy('id')->fetchAll(),
        );
    }

    public function find(UserId $userId, BookId $id): ?Book
    {
        foreach ((new Select($this->orm, Book::class))
            ->where('id', $id->toString())
            ->where('userId', $userId->toString())
            ->fetchAll() as $book) {
            if ($book instanceof Book) {
                return $book;
            }
        }

        return null;
    }

    public function belongsToAnotherUser(UserId $userId, BookId $id): bool
    {
        foreach ((new Select($this->orm, Book::class))->where('id', $id->toString())->fetchAll() as $book) {
            return $book instanceof Book && $book->userId?->toString() !== $userId->toString();
        }

        return false;
    }

    public function save(UserId $userId, Book $book): void
    {
        if ($book->userId === null) {
            $book->userId = $userId;
        } elseif ($book->userId->toString() !== $userId->toString()) {
            throw new LogicException('книга принадлежит другому пользователю');
        }

        (new EntityManager($this->orm))->persist($book)->run();
    }

    public function delete(UserId $userId, Book $book): void
    {
        if ($book->userId?->toString() !== $userId->toString()) {
            throw new LogicException('книга принадлежит другому пользователю');
        }

        (new EntityManager($this->orm))->delete($book)->run();
    }

    /**
     * @param  iterable<mixed> $rows
     * @return list<Book>
     */
    private function collect(iterable $rows): array
    {
        $books = [];
        foreach ($rows as $book) {
            if ($book instanceof Book) {
                $books[] = $book;
            }
        }

        return $books;
    }
}
