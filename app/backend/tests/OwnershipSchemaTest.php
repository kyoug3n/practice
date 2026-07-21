<?php

declare(strict_types=1);

namespace Recall\Tests;

use PDO;
use Recall\Infrastructure\Persistence\DatabaseContext;
use RuntimeException;
use Testo\Assert;
use Testo\Test;

final class OwnershipSchemaTest
{
    #[Test]
    public function addsOwnerColumnsAndIndexesToAnExistingDatabase(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'recall-ownership-');
        if (!is_string($path)) {
            throw new RuntimeException('не удалось создать временную базу');
        }

        try {
            $this->createLegacySchema($path);
            $database = DatabaseContext::boot($path)->dbal->database('default');

            foreach (['books', 'notes', 'cards', 'reviews'] as $table) {
                $schema = $database->table($table);
                Assert::true($schema->hasColumn('user_id'));
                Assert::true($schema->hasIndex(['user_id']));
            }
            Assert::true($database->table('notes')->hasColumn('book_id'));
            Assert::true($database->table('notes')->hasIndex(['book_id']));
        } finally {
            unlink($path);
        }
    }

    private function createLegacySchema(string $path): void
    {
        $database = new PDO('sqlite:' . $path);
        $database->exec('CREATE TABLE notes (id TEXT PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL, tags TEXT NOT NULL, links TEXT NOT NULL, updated_at TEXT NOT NULL)');
        $database->exec('CREATE TABLE cards (id TEXT PRIMARY KEY, note_id TEXT NOT NULL, front TEXT NOT NULL, back TEXT NOT NULL, ease REAL NOT NULL, interval INTEGER NOT NULL, due TEXT NOT NULL)');
        $database->exec('CREATE TABLE reviews (id TEXT PRIMARY KEY, card_id TEXT NOT NULL, grade TEXT NOT NULL, interval INTEGER NOT NULL, ease REAL NOT NULL, next_due TEXT NOT NULL)');
    }
}
