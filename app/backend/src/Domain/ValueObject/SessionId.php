<?php

declare(strict_types=1);

namespace Recall\Domain\ValueObject;

use Stringable;

/** Идентификатор сессии. */
final readonly class SessionId implements Stringable
{
    use UuidIdentity;
}
