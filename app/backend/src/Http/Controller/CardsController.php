<?php

declare(strict_types=1);

namespace Recall\Http\Controller;

use DateTimeImmutable;
use InvalidArgumentException;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Recall\Domain\Card;
use Recall\Domain\ValueObject\CardId;
use Recall\Domain\ValueObject\NoteId;
use Recall\Domain\ValueObject\UserId;
use Recall\Http\CurrentUser;
use Recall\Http\Input\CardInput;
use Recall\Http\Json;
use Recall\Http\Serializer;
use Recall\Infrastructure\Persistence\CardRepository;
use Recall\Infrastructure\Persistence\NoteRepository;

final readonly class CardsController
{
    public function __construct(
        private CardRepository $cards,
        private NoteRepository $notes,
        private Serializer $serializer,
        private DateTimeImmutable $now,
    ) {}

    public function index(Request $request, Response $response): Response
    {
        return Json::write(
            $response,
            array_map($this->serializer->serialize(...), $this->cards->all(CurrentUser::userId($request))),
        );
    }

    /** @param array<array-key, mixed> $args */
    public function show(Request $request, Response $response, array $args): Response
    {
        $userId = CurrentUser::userId($request);
        $card = $this->lookup($userId, $args);

        return $card === null
            ? $this->notFoundOrForbidden($response, $userId, $args)
            : Json::write($response, $this->serializer->serialize($card));
    }

    public function create(Request $request, Response $response): Response
    {
        $input = CardInput::fromArray($this->body($request));
        $userId = CurrentUser::userId($request);

        try {
            $noteId = NoteId::fromString($input->noteId);
        } catch (InvalidArgumentException) {
            return Json::error($response, 'note not found', 404);
        }
        if ($this->notes->find($userId, $noteId) === null) {
            return $this->notes->belongsToAnotherUser($userId, $noteId)
                ? Json::error($response, 'forbidden', 403)
                : Json::error($response, 'note not found', 404);
        }

        $card = Card::create($noteId, $input->front, $input->back, $this->now);
        $this->cards->save($userId, $card);

        return Json::write($response, $this->serializer->serialize($card), 201);
    }

    /** @param array<array-key, mixed> $args */
    public function update(Request $request, Response $response, array $args): Response
    {
        $userId = CurrentUser::userId($request);
        $card = $this->lookup($userId, $args);
        if ($card === null) {
            return $this->notFoundOrForbidden($response, $userId, $args);
        }

        $input = CardInput::fromArray($this->body($request));
        try {
            $noteId = NoteId::fromString($input->noteId);
        } catch (InvalidArgumentException) {
            return Json::error($response, 'note not found', 404);
        }
        if ($this->notes->find($userId, $noteId) === null) {
            return $this->notes->belongsToAnotherUser($userId, $noteId)
                ? Json::error($response, 'forbidden', 403)
                : Json::error($response, 'note not found', 404);
        }

        $card->noteId = $noteId;
        $card->front = $input->front;
        $card->back = $input->back;
        $this->cards->save($userId, $card);

        return Json::write($response, $this->serializer->serialize($card));
    }

    /** @param array<array-key, mixed> $args */
    public function delete(Request $request, Response $response, array $args): Response
    {
        $userId = CurrentUser::userId($request);
        $card = $this->lookup($userId, $args);
        if ($card === null) {
            return $this->notFoundOrForbidden($response, $userId, $args);
        }

        $this->cards->delete($userId, $card);

        return $response->withStatus(204);
    }

    /** @param array<array-key, mixed> $args */
    private function lookup(UserId $userId, array $args): ?Card
    {
        $raw = $args['id'] ?? null;
        if (!is_string($raw)) {
            return null;
        }
        try {
            return $this->cards->find($userId, CardId::fromString($raw));
        } catch (InvalidArgumentException) {
            return null;
        }
    }

    /** @param array<array-key, mixed> $args */
    private function notFoundOrForbidden(Response $response, UserId $userId, array $args): Response
    {
        $raw = $args['id'] ?? null;
        if (!is_string($raw)) {
            return Json::error($response, 'card not found', 404);
        }
        try {
            $otherUsersCard = $this->cards->belongsToAnotherUser($userId, CardId::fromString($raw));
        } catch (InvalidArgumentException) {
            return Json::error($response, 'card not found', 404);
        }

        return $otherUsersCard
            ? Json::error($response, 'forbidden', 403)
            : Json::error($response, 'card not found', 404);
    }

    /** @return array<array-key, mixed> */
    private function body(Request $request): array
    {
        $body = $request->getParsedBody();

        return is_array($body) ? $body : [];
    }
}
