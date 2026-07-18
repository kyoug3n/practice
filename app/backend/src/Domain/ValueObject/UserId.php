<?php

declare(strict_types=1);

namespace Recall\Domain\ValueObject;

use Stringable;

/** Идентификатор пользователя. */
final readonly class UserId implements Stringable
{
    use UuidIdentity;
}
