<?php

declare(strict_types=1);

namespace Recall\Tests;

use InvalidArgumentException;
use Recall\Domain\ValueObject\NoteIdList;
use RuntimeException;
use Testo\Assert;
use Testo\Test;

final class NoteIdListTest
{
    #[Test]
    public function rejectsEmptyAndNonStringLinks(): void
    {
        foreach (['', null, 42] as $value) {
            $this->assertInvalid($value);
        }
    }

    #[Test]
    public function rejectsMalformedUuidLinks(): void
    {
        $this->assertInvalid('not-a-uuid');
    }

    private function assertInvalid(mixed $value): void
    {
        try {
            NoteIdList::fromStrings([$value]);
        } catch (InvalidArgumentException $e) {
            Assert::same($e->getMessage(), 'ссылка на заметку должна быть UUID');

            return;
        }

        throw new RuntimeException('некорректная ссылка не была отклонена');
    }
}
