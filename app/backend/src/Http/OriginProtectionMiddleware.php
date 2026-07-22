<?php

declare(strict_types=1);

namespace Recall\Http;

use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

/** Защищает cookie-сессии от межсайтовых запросов, меняющих данные. */
final readonly class OriginProtectionMiddleware implements MiddlewareInterface
{
    public function __construct(
        private SessionCookie $cookie,
        private string $trustedOrigin,
        private ResponseFactoryInterface $responses,
    ) {}

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        if ($this->isUntrustedMutation($request)) {
            return Json::error($this->responses->createResponse(), 'недопустимый источник запроса', 403);
        }

        return $handler->handle($request);
    }

    private function isUntrustedMutation(ServerRequestInterface $request): bool
    {
        if (!in_array($request->getMethod(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return false;
        }

        $origin = $request->getHeaderLine('Origin');

        return $origin !== ''
            && $origin !== $this->trustedOrigin
            && $this->cookie->token($request) !== null;
    }
}
