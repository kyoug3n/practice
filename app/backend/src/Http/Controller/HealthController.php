<?php

declare(strict_types=1);

namespace Recall\Http\Controller;

use Cycle\Database\DatabaseInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Recall\Http\Json;
use Throwable;

/** Проверяет, что приложение может выполнить запрос к своей базе данных. */
final readonly class HealthController
{
    public function __construct(private DatabaseInterface $database) {}

    public function show(Request $request, Response $response): Response
    {
        try {
            $this->database->query('SELECT 1')->fetchColumn();
        } catch (Throwable) {
            return Json::error($response, 'database unavailable', 503);
        }

        return Json::write($response, ['status' => 'ok', 'database' => 'ok']);
    }
}
