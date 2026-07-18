<?php

declare(strict_types=1);

namespace Recall\Tests;

use Recall\Domain\User;
use Recall\Domain\ValueObject\Username;
use Testo\Assert;
use Testo\Test;

final class UserTest
{
    #[Test]
    public function registersWithAHashInsteadOfThePassword(): void
    {
        $password = 'correct-horse-battery-staple';
        $user = User::register(Username::fromString('reader_01'), $password);

        Assert::true($user->verifiesPassword($password));
        Assert::false($user->verifiesPassword('another-correct-password'));
        Assert::false($user->passwordHash === $password);
    }
}
