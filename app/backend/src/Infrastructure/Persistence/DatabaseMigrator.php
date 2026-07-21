<?php

declare(strict_types=1);

namespace Recall\Infrastructure\Persistence;

use Cycle\Database\DatabaseInterface;

/** Создаёт актуальную структуру SQLite без пересборки выданной базы. */
final class DatabaseMigrator
{
    public static function migrate(DatabaseInterface $db): void
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
            "CREATE TABLE IF NOT EXISTS books (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                author TEXT NOT NULL DEFAULT '',
                open_library_key TEXT NULL,
                cover_id INTEGER NULL,
                user_id TEXT NULL CHECK (user_id IS NULL OR length(user_id) = 36)
            )",
        );
        $db->execute(
            "CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                body TEXT NOT NULL DEFAULT '',
                tags TEXT NOT NULL DEFAULT '[]',
                links TEXT NOT NULL DEFAULT '[]',
                updated_at TEXT NOT NULL,
                book_id TEXT NULL,
                user_id TEXT NULL CHECK (user_id IS NULL OR length(user_id) = 36)
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
                due TEXT NOT NULL,
                user_id TEXT NULL CHECK (user_id IS NULL OR length(user_id) = 36)
            )",
        );
        $db->execute(
            "CREATE TABLE IF NOT EXISTS reviews (
                id TEXT PRIMARY KEY,
                card_id TEXT NOT NULL,
                grade TEXT NOT NULL,
                interval INTEGER NOT NULL,
                ease REAL NOT NULL,
                next_due TEXT NOT NULL,
                user_id TEXT NULL CHECK (user_id IS NULL OR length(user_id) = 36)
            )",
        );

        self::addUserOwnershipColumns($db);
        self::addNoteBookColumn($db);
    }

    /** Добавляет ownership-поля без пересборки уже выданной SQLite-базы. */
    private static function addUserOwnershipColumns(DatabaseInterface $db): void
    {
        foreach (['books', 'notes', 'cards', 'reviews'] as $table) {
            if (!$db->table($table)->hasColumn('user_id')) {
                $db->execute(
                    "ALTER TABLE $table ADD COLUMN user_id TEXT NULL CHECK (user_id IS NULL OR length(user_id) = 36)",
                );
            }
            $db->execute("CREATE INDEX IF NOT EXISTS {$table}_user_id_idx ON $table (user_id)");
        }
    }

    /** Добавляет связь заметки с книгой в уже выданную SQLite-базу. */
    private static function addNoteBookColumn(DatabaseInterface $db): void
    {
        if (!$db->table('notes')->hasColumn('book_id')) {
            $db->execute('ALTER TABLE notes ADD COLUMN book_id TEXT NULL');
        }
        $db->execute('CREATE INDEX IF NOT EXISTS notes_book_id_idx ON notes (book_id)');
    }
}
