<?php

declare(strict_types=1);

namespace Recall\Infrastructure\Persistence;

use Cycle\ORM\EntityManager;
use Cycle\ORM\ORMInterface;
use Cycle\ORM\Select;
use LogicException;
use Recall\Domain\Card;
use Recall\Domain\ValueObject\CardId;
use Recall\Domain\ValueObject\Day;
use Recall\Domain\ValueObject\UserId;

/** Доступ к карточкам через Cycle ORM. */
final readonly class CardRepository
{
    public function __construct(private ORMInterface $orm) {}

    /** @return list<Card> */
    public function all(UserId $userId): array
    {
        return $this->collect(
            (new Select($this->orm, Card::class))->where('userId', $userId->toString())->orderBy('id')->fetchAll(),
        );
    }

    /** @return list<Card> */
    public function dueOn(UserId $userId, Day $day): array
    {
        return $this->collect(
            (new Select($this->orm, Card::class))
                ->where('userId', $userId->toString())
                ->where('due', '<=', $day->value)
                ->orderBy('id')
                ->fetchAll(),
        );
    }

    public function find(UserId $userId, CardId $id): ?Card
    {
        foreach ((new Select($this->orm, Card::class))
            ->where('id', $id->toString())
            ->where('userId', $userId->toString())
            ->fetchAll() as $card) {
            if ($card instanceof Card) {
                return $card;
            }
        }

        return null;
    }

    public function belongsToAnotherUser(UserId $userId, CardId $id): bool
    {
        foreach ((new Select($this->orm, Card::class))->where('id', $id->toString())->fetchAll() as $card) {
            return $card instanceof Card && $card->userId?->toString() !== $userId->toString();
        }

        return false;
    }

    public function countAll(): int
    {
        return (new Select($this->orm, Card::class))->count();
    }

    public function save(UserId $userId, Card $card): void
    {
        $this->assignOwner($userId, $card);

        (new EntityManager($this->orm))->persist($card)->run();
    }

    /** Сохраняет стартовые данные без владельца, чтобы они не стали данными случайного пользователя. */
    public function saveLegacy(Card $card): void
    {
        (new EntityManager($this->orm))->persist($card)->run();
    }

    public function delete(UserId $userId, Card $card): void
    {
        $this->assertOwner($userId, $card);

        (new EntityManager($this->orm))->delete($card)->run();
    }

    private function assignOwner(UserId $userId, Card $card): void
    {
        if ($card->userId === null) {
            $card->userId = $userId;

            return;
        }

        $this->assertOwner($userId, $card);
    }

    private function assertOwner(UserId $userId, Card $card): void
    {
        if ($card->userId?->toString() !== $userId->toString()) {
            throw new LogicException('карточка принадлежит другому пользователю');
        }
    }

    /**
     * @param  iterable<mixed> $rows
     * @return list<Card>
     */
    private function collect(iterable $rows): array
    {
        $cards = [];
        foreach ($rows as $row) {
            if ($row instanceof Card) {
                $cards[] = $row;
            }
        }

        return $cards;
    }
}
