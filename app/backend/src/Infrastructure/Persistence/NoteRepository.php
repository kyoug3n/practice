<?php

declare(strict_types=1);

namespace Recall\Infrastructure\Persistence;

use Cycle\ORM\EntityManager;
use Cycle\ORM\ORMInterface;
use Cycle\ORM\Select;
use LogicException;
use Recall\Domain\Note;
use Recall\Domain\ValueObject\NoteId;
use Recall\Domain\ValueObject\Tag;
use Recall\Domain\ValueObject\UserId;

/** Доступ к заметкам через Cycle ORM. */
final readonly class NoteRepository
{
    public function __construct(private ORMInterface $orm) {}

    /** @return list<Note> */
    public function all(UserId $userId, ?Tag $tag): array
    {
        $notes = [];
        foreach ((new Select($this->orm, Note::class))
            ->where('userId', $userId->toString())
            ->orderBy('id')
            ->fetchAll() as $note) {
            if ($note instanceof Note && ($tag === null || $note->tags->contains($tag))) {
                $notes[] = $note;
            }
        }

        return $notes;
    }

    public function find(UserId $userId, NoteId $id): ?Note
    {
        foreach ((new Select($this->orm, Note::class))
            ->where('id', $id->toString())
            ->where('userId', $userId->toString())
            ->fetchAll() as $note) {
            if ($note instanceof Note) {
                return $note;
            }
        }

        return null;
    }

    public function save(UserId $userId, Note $note): void
    {
        $this->assignOwner($userId, $note);

        (new EntityManager($this->orm))->persist($note)->run();
    }

    /** Сохраняет стартовые данные без владельца, чтобы они не стали данными случайного пользователя. */
    public function saveLegacy(Note $note): void
    {
        (new EntityManager($this->orm))->persist($note)->run();
    }

    public function delete(UserId $userId, Note $note): void
    {
        $this->assertOwner($userId, $note);

        (new EntityManager($this->orm))->delete($note)->run();
    }

    private function assignOwner(UserId $userId, Note $note): void
    {
        if ($note->userId === null) {
            $note->userId = $userId;

            return;
        }

        $this->assertOwner($userId, $note);
    }

    private function assertOwner(UserId $userId, Note $note): void
    {
        if ($note->userId?->toString() !== $userId->toString()) {
            throw new LogicException('заметка принадлежит другому пользователю');
        }
    }
}
