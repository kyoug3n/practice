<?php

declare(strict_types=1);

namespace Recall\Http;

use DateTimeImmutable;
use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Recall\Infrastructure\Persistence\SessionRepository;
use Recall\Infrastructure\Persistence\UserRepository;

/** Добавляет текущего пользователя в request context для защищённых маршрутов. */
final readonly class AuthenticationMiddleware implements MiddlewareInterface
{
    public const string USER_ATTRIBUTE = 'recall.user';

    public function __construct(
        private SessionCookie $cookie,
        private SessionRepository $sessions,
        private UserRepository $users,
        private DateTimeImmutable $now,
        private ResponseFactoryInterface $responses,
    ) {}

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        if (!$this->requiresAuthentication($request)) {
            return $handler->handle($request);
        }

        $token = $this->cookie->token($request);
        if ($token === null) {
            return $this->unauthorized();
        }

        $session = $this->sessions->findByToken($token, $this->now);
        if ($session === null) {
            return $this->unauthorized();
        }

        $user = $this->users->find($session->userId);
        if ($user === null) {
            return $this->unauthorized();
        }

        return $handler->handle($request->withAttribute(self::USER_ATTRIBUTE, $user));
    }

    private function requiresAuthentication(ServerRequestInterface $request): bool
    {
        if ($request->getMethod() === 'OPTIONS') {
            return false;
        }

        $path = $request->getUri()->getPath();
        if (in_array($path, ['/stats', '/auth/me'], true)) {
            return true;
        }

        return array_any(
            ['/notes', '/cards', '/reviews'],
            fn(string $prefix): bool => $path === $prefix || str_starts_with($path, "$prefix/"),
        );
    }

    private function unauthorized(): ResponseInterface
    {
        return Json::error($this->responses->createResponse(), 'необходима авторизация', 401);
    }
}
