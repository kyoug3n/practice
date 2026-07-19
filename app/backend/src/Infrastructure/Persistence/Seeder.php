<?php

declare(strict_types=1);

namespace Recall\Infrastructure\Persistence;

use DateTimeImmutable;
use Recall\Domain\Card;
use Recall\Domain\Note;
use Recall\Domain\ValueObject\CardText;
use Recall\Domain\ValueObject\Day;
use Recall\Domain\ValueObject\Interval;
use Recall\Domain\ValueObject\NoteIdList;
use Recall\Domain\ValueObject\TagList;
use Recall\Domain\ValueObject\Title;

/** Наполняет пустую базу демоданными, чтобы приложение было живым с первого запуска. */
final readonly class Seeder
{
    public function __construct(
        private NoteRepository $notes,
        private CardRepository $cards,
    ) {}

    public function seedIfEmpty(DateTimeImmutable $now): void
    {
        if ($this->cards->countAll() > 0) {
            return;
        }

        $spacedRepetition = Note::create(
            Title::fromString('Интервальное повторение'),
            'Повторяй прямо перед тем, как забудешь.',
            TagList::fromStrings(['обучение', 'память']),
            new NoteIdList(),
            $now,
        );
        $rust = Note::create(
            Title::fromString('Владение в Rust'),
            'У каждого значения один владелец.',
            TagList::fromStrings(['rust', 'программирование']),
            new NoteIdList(),
            $now,
        );
        $this->notes->saveLegacy($spacedRepetition);
        $this->notes->saveLegacy($rust);

        // Две карточки на сегодня, одна — через три дня.
        $today = Day::today($now);
        $later = $today->plusDays(Interval::ofDays(3));

        $this->cards->saveLegacy(Card::create($spacedRepetition->id, CardText::fromString('Что такое интервальное повторение?'), CardText::fromString('Повторение прямо перед забыванием.'), $now));
        $this->cards->saveLegacy(Card::create($rust->id, CardText::fromString('Сколько владельцев у значения в Rust?'), CardText::fromString('Ровно один.'), $now));

        $future = Card::create($spacedRepetition->id, CardText::fromString('Почему интервалы помогают?'), CardText::fromString('Они борются с кривой забывания.'), $now);
        $future->due = $later;
        $this->cards->saveLegacy($future);
    }
}
