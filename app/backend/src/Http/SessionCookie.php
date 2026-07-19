<?php

declare(strict_types=1);

namespace Recall\Http;

use InvalidArgumentException;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Recall\Domain\SessionCredentials;
use Recall\Domain\ValueObject\SessionToken;
use Slim\Psr7\Cookies;

/** Устанавливает непрозрачный токен сессии в безопасной browser-cookie. */
final class SessionCookie
{
    public const string NAME = 'recall_session';

    public function add(Response $response, SessionCredentials $credentials): Response
    {
        $cookies = new Cookies();
        $cookies->set(self::NAME, [
            'value' => (string) $credentials->token,
            'path' => '/',
            'expires' => $credentials->session->expiresAt->getTimestamp(),
            'httponly' => true,
            'samesite' => 'lax',
        ]);

        return $this->attach($response, $cookies);
    }

    public function clear(Response $response): Response
    {
        $cookies = new Cookies();
        $cookies->set(self::NAME, [
            'value' => '',
            'path' => '/',
            'expires' => 1,
            'httponly' => true,
            'samesite' => 'lax',
        ]);

        return $this->attach($response, $cookies);
    }

    public function token(Request $request): ?SessionToken
    {
        $value = $request->getCookieParams()[self::NAME] ?? null;
        if (!is_string($value)) {
            return null;
        }

        try {
            return SessionToken::fromString($value);
        } catch (InvalidArgumentException) {
            return null;
        }
    }

    private function attach(Response $response, Cookies $cookies): Response
    {
        foreach ($cookies->toHeaders() as $header) {
            if (is_string($header)) {
                $response = $response->withAddedHeader('Set-Cookie', $header);
            }
        }

        return $response;
    }
}
