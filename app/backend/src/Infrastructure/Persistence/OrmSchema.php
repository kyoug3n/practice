<?php

declare(strict_types=1);

namespace Recall\Infrastructure\Persistence;

use Cycle\ORM\Parser\Typecast;
use Cycle\ORM\SchemaInterface;
use Recall\Domain\Book;
use Recall\Domain\Card;
use Recall\Domain\Grade;
use Recall\Domain\Note;
use Recall\Domain\Review;
use Recall\Domain\Session;
use Recall\Domain\User;
use Recall\Domain\ValueObject\BookId;
use Recall\Domain\ValueObject\CardId;
use Recall\Domain\ValueObject\CardText;
use Recall\Domain\ValueObject\Day;
use Recall\Domain\ValueObject\Ease;
use Recall\Domain\ValueObject\Interval;
use Recall\Domain\ValueObject\NoteId;
use Recall\Domain\ValueObject\NoteIdList;
use Recall\Domain\ValueObject\ReviewId;
use Recall\Domain\ValueObject\SessionId;
use Recall\Domain\ValueObject\TagList;
use Recall\Domain\ValueObject\Title;
use Recall\Domain\ValueObject\UserId;
use Recall\Domain\ValueObject\Username;

/** Карта доменных сущностей для Cycle ORM. */
final class OrmSchema
{
    /** @return array<class-string, array<int, mixed>> */
    public static function map(): array
    {
        $handler = [ValueObjectTypecast::class, Typecast::class];

        return self::authenticationMap($handler) + self::bookMap($handler) + [
            Note::class => [
                SchemaInterface::ROLE => 'note',
                SchemaInterface::DATABASE => 'default',
                SchemaInterface::TABLE => 'notes',
                SchemaInterface::PRIMARY_KEY => 'id',
                SchemaInterface::TYPECAST_HANDLER => $handler,
                SchemaInterface::COLUMNS => [
                    'id' => 'id',
                    'title' => 'title',
                    'body' => 'body',
                    'tags' => 'tags',
                    'links' => 'links',
                    'updatedAt' => 'updated_at',
                    'bookId' => 'book_id',
                    'userId' => 'user_id',
                ],
                SchemaInterface::TYPECAST => [
                    'id' => NoteId::class,
                    'title' => Title::class,
                    'tags' => TagList::class,
                    'links' => NoteIdList::class,
                    'updatedAt' => 'datetime',
                    'bookId' => BookId::class,
                    'userId' => UserId::class,
                ],
                SchemaInterface::SCHEMA => [],
                SchemaInterface::RELATIONS => [],
            ],
            Card::class => [
                SchemaInterface::ROLE => 'card',
                SchemaInterface::DATABASE => 'default',
                SchemaInterface::TABLE => 'cards',
                SchemaInterface::PRIMARY_KEY => 'id',
                SchemaInterface::TYPECAST_HANDLER => $handler,
                SchemaInterface::COLUMNS => [
                    'id' => 'id',
                    'noteId' => 'note_id',
                    'front' => 'front',
                    'back' => 'back',
                    'ease' => 'ease',
                    'interval' => 'interval',
                    'due' => 'due',
                    'userId' => 'user_id',
                ],
                SchemaInterface::TYPECAST => [
                    'id' => CardId::class,
                    'noteId' => NoteId::class,
                    'front' => CardText::class,
                    'back' => CardText::class,
                    'ease' => Ease::class,
                    'interval' => Interval::class,
                    'due' => Day::class,
                    'userId' => UserId::class,
                ],
                SchemaInterface::SCHEMA => [],
                SchemaInterface::RELATIONS => [],
            ],
            Review::class => [
                SchemaInterface::ROLE => 'review',
                SchemaInterface::DATABASE => 'default',
                SchemaInterface::TABLE => 'reviews',
                SchemaInterface::PRIMARY_KEY => 'id',
                SchemaInterface::TYPECAST_HANDLER => $handler,
                SchemaInterface::COLUMNS => [
                    'id' => 'id',
                    'cardId' => 'card_id',
                    'grade' => 'grade',
                    'interval' => 'interval',
                    'ease' => 'ease',
                    'nextDue' => 'next_due',
                    'userId' => 'user_id',
                ],
                SchemaInterface::TYPECAST => [
                    'id' => ReviewId::class,
                    'cardId' => CardId::class,
                    'grade' => Grade::class,
                    'interval' => Interval::class,
                    'ease' => Ease::class,
                    'nextDue' => Day::class,
                    'userId' => UserId::class,
                ],
                SchemaInterface::SCHEMA => [],
                SchemaInterface::RELATIONS => [],
            ],
        ];
    }

    /**
     * @param  list<class-string> $handler
     * @return array<class-string, array<int, mixed>>
     */
    private static function authenticationMap(array $handler): array
    {
        return [
            User::class => [
                SchemaInterface::ROLE => 'user',
                SchemaInterface::DATABASE => 'default',
                SchemaInterface::TABLE => 'users',
                SchemaInterface::PRIMARY_KEY => 'id',
                SchemaInterface::TYPECAST_HANDLER => $handler,
                SchemaInterface::COLUMNS => [
                    'id' => 'id',
                    'username' => 'username',
                    'passwordHash' => 'password_hash',
                ],
                SchemaInterface::TYPECAST => [
                    'id' => UserId::class,
                    'username' => Username::class,
                ],
                SchemaInterface::SCHEMA => [],
                SchemaInterface::RELATIONS => [],
            ],
            Session::class => [
                SchemaInterface::ROLE => 'session',
                SchemaInterface::DATABASE => 'default',
                SchemaInterface::TABLE => 'sessions',
                SchemaInterface::PRIMARY_KEY => 'id',
                SchemaInterface::TYPECAST_HANDLER => $handler,
                SchemaInterface::COLUMNS => [
                    'id' => 'id',
                    'userId' => 'user_id',
                    'tokenHash' => 'token_hash',
                    'expiresAt' => 'expires_at',
                ],
                SchemaInterface::TYPECAST => [
                    'id' => SessionId::class,
                    'userId' => UserId::class,
                    'expiresAt' => 'datetime',
                ],
                SchemaInterface::SCHEMA => [],
                SchemaInterface::RELATIONS => [],
            ],
        ];
    }

    /**
     * @param  list<class-string> $handler
     * @return array<class-string, array<int, mixed>>
     */
    private static function bookMap(array $handler): array
    {
        return [
            Book::class => [
                SchemaInterface::ROLE => 'book',
                SchemaInterface::DATABASE => 'default',
                SchemaInterface::TABLE => 'books',
                SchemaInterface::PRIMARY_KEY => 'id',
                SchemaInterface::TYPECAST_HANDLER => $handler,
                SchemaInterface::COLUMNS => [
                    'id' => 'id',
                    'title' => 'title',
                    'author' => 'author',
                    'openLibraryKey' => 'open_library_key',
                    'coverId' => 'cover_id',
                    'userId' => 'user_id',
                ],
                SchemaInterface::TYPECAST => [
                    'id' => BookId::class,
                    'title' => Title::class,
                    'userId' => UserId::class,
                ],
                SchemaInterface::SCHEMA => [],
                SchemaInterface::RELATIONS => [],
            ],
        ];
    }
}
