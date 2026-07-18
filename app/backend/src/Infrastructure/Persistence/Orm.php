<?php

declare(strict_types=1);

namespace Recall\Infrastructure\Persistence;

use Cycle\Database\Config\DatabaseConfig;
use Cycle\Database\Config\SQLite\FileConnectionConfig;
use Cycle\Database\Config\SQLite\MemoryConnectionConfig;
use Cycle\Database\Config\SQLiteDriverConfig;
use Cycle\Database\DatabaseInterface;
use Cycle\Database\DatabaseManager;
use Cycle\ORM\EntityManager;
use Cycle\ORM\Factory;
use Cycle\ORM\ORM as CycleOrm;
use Cycle\ORM\ORMInterface;
use Cycle\ORM\Parser\Typecast;
use Cycle\ORM\Schema;
use Cycle\ORM\SchemaInterface;
use Recall\Domain\Card;
use Recall\Domain\Grade;
use Recall\Domain\Note;
use Recall\Domain\Review;
use Recall\Domain\Session;
use Recall\Domain\User;
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

/**
 * Сборка Cycle ORM: подключение к SQLite, схема (заданная массивом, без
 * аннотаций в домене и без компиляции на каждый запрос) и точка входа ORM.
 */
final readonly class Orm
{
    private function __construct(
        public ORMInterface $orm,
        public DatabaseManager $dbal,
    ) {}

    public static function boot(string $databasePath): self
    {
        if ($databasePath !== ':memory:') {
            $dir = dirname($databasePath);
            if (!is_dir($dir)) {
                mkdir($dir, 0o755, true);
            }
        }

        $connection = $databasePath === ':memory:'
            ? new MemoryConnectionConfig()
            : new FileConnectionConfig(database: $databasePath);

        $dbal = new DatabaseManager(new DatabaseConfig([
            'default' => 'default',
            'databases' => ['default' => ['connection' => 'sqlite']],
            'connections' => ['sqlite' => new SQLiteDriverConfig(connection: $connection)],
        ]));

        self::migrate($dbal->database('default'));

        $orm = new CycleOrm(new Factory($dbal), new Schema(self::map()));

        return new self($orm, $dbal);
    }

    public function entityManager(): EntityManager
    {
        return new EntityManager($this->orm);
    }

    private static function migrate(DatabaseInterface $db): void
    {
        $db->execute(
            "CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL
            )",
        );
        $db->execute(
            "CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                token_hash TEXT NOT NULL UNIQUE,
                expires_at TEXT NOT NULL
            )",
        );
        $db->execute(
            "CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                body TEXT NOT NULL DEFAULT '',
                tags TEXT NOT NULL DEFAULT '[]',
                links TEXT NOT NULL DEFAULT '[]',
                updated_at TEXT NOT NULL
            )",
        );
        $db->execute(
            "CREATE TABLE IF NOT EXISTS cards (
                id TEXT PRIMARY KEY,
                note_id TEXT NOT NULL,
                front TEXT NOT NULL,
                back TEXT NOT NULL,
                ease REAL NOT NULL,
                interval INTEGER NOT NULL,
                due TEXT NOT NULL
            )",
        );
        $db->execute(
            "CREATE TABLE IF NOT EXISTS reviews (
                id TEXT PRIMARY KEY,
                card_id TEXT NOT NULL,
                grade TEXT NOT NULL,
                interval INTEGER NOT NULL,
                ease REAL NOT NULL,
                next_due TEXT NOT NULL
            )",
        );
    }

    /** @return array<class-string, array<int, mixed>> */
    private static function map(): array
    {
        $handler = [ValueObjectTypecast::class, Typecast::class];

        return self::authenticationMap($handler) + [
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
                ],
                SchemaInterface::TYPECAST => [
                    'id' => NoteId::class,
                    'title' => Title::class,
                    'tags' => TagList::class,
                    'links' => NoteIdList::class,
                    'updatedAt' => 'datetime',
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
                ],
                SchemaInterface::TYPECAST => [
                    'id' => CardId::class,
                    'noteId' => NoteId::class,
                    'front' => CardText::class,
                    'back' => CardText::class,
                    'ease' => Ease::class,
                    'interval' => Interval::class,
                    'due' => Day::class,
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
                ],
                SchemaInterface::TYPECAST => [
                    'id' => ReviewId::class,
                    'cardId' => CardId::class,
                    'grade' => Grade::class,
                    'interval' => Interval::class,
                    'ease' => Ease::class,
                    'nextDue' => Day::class,
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
}
