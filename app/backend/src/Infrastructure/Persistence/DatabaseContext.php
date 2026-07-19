<?php

declare(strict_types=1);

namespace Recall\Infrastructure\Persistence;

use Cycle\Database\Config\DatabaseConfig;
use Cycle\Database\Config\SQLite\FileConnectionConfig;
use Cycle\Database\Config\SQLite\MemoryConnectionConfig;
use Cycle\Database\Config\SQLiteDriverConfig;
use Cycle\Database\DatabaseManager;
use Cycle\ORM\EntityManager;
use Cycle\ORM\Factory;
use Cycle\ORM\ORM as CycleOrm;
use Cycle\ORM\ORMInterface;
use Cycle\ORM\Schema;

/** Подключение к SQLite и точка входа для работы с Cycle ORM. */
final readonly class DatabaseContext
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

        DatabaseMigrator::migrate($dbal->database('default'));
        $orm = new CycleOrm(new Factory($dbal), new Schema(OrmSchema::map()));

        return new self($orm, $dbal);
    }

    public function entityManager(): EntityManager
    {
        return new EntityManager($this->orm);
    }
}
