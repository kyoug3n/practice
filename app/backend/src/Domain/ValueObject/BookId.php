<?php

declare(strict_types=1);

namespace Recall\Domain\ValueObject;

use Stringable;

/** Идентификатор книги. */
final readonly class BookId implements Stringable
{
    use UuidIdentity;
}
