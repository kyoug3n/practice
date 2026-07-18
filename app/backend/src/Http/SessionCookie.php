<?php

declare(strict_types=1);

namespace Recall\Http;

use Psr\Http\Message\ResponseInterface as Response;
use Recall\Domain\SessionCredentials;
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

        foreach ($cookies->toHeaders() as $header) {
            if (is_string($header)) {
                $response = $response->withAddedHeader('Set-Cookie', $header);
            }
        }

        return $response;
    }
}
