<?php

declare(strict_types=1);

namespace Recall\Http;

use LogicException;
use Psr\Http\Message\ServerRequestInterface;
use Recall\Domain\User;
use Recall\Domain\ValueObject\UserId;

/** Извлекает пользователя, уже проверенного AuthenticationMiddleware. */
final class CurrentUser
{
    public static function userId(ServerRequestInterface $request): UserId
    {
        $user = $request->getAttribute(AuthenticationMiddleware::USER_ATTRIBUTE);
        if (!$user instanceof User) {
            throw new LogicException('пользователь отсутствует в контексте запроса');
        }

        return $user->id;
    }
}
