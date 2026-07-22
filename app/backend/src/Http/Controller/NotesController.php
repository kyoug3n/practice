<?php

declare(strict_types=1);

namespace Recall\Http\Controller;

use DateTimeImmutable;
use InvalidArgumentException;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Recall\Domain\Note;
use Recall\Domain\ValueObject\BookId;
use Recall\Domain\ValueObject\NoteId;
use Recall\Domain\ValueObject\NoteIdList;
use Recall\Domain\ValueObject\Tag;
use Recall\Domain\ValueObject\UserId;
use Recall\Http\CurrentUser;
use Recall\Http\Input\NoteInput;
use Recall\Http\Json;
use Recall\Http\Serializer;
use Recall\Infrastructure\Persistence\BookRepository;
use Recall\Infrastructure\Persistence\NoteRepository;

final readonly class NotesController
{
    public function __construct(
        private NoteRepository $notes,
        private BookRepository $books,
        private Serializer $serializer,
        private DateTimeImmutable $now,
    ) {}

    public function index(Request $request, Response $response): Response
    {
        $tagParam = $request->getQueryParams()['tag'] ?? null;
        $tag = is_string($tagParam) && $tagParam !== '' ? Tag::fromString($tagParam) : null;

        return Json::write(
            $response,
            array_map($this->serializer->serialize(...), $this->notes->all(CurrentUser::userId($request), $tag)),
        );
    }

    /** @param array<array-key, mixed> $args */
    public function show(Request $request, Response $response, array $args): Response
    {
        $userId = CurrentUser::userId($request);
        $note = $this->lookup($userId, $args);

        return $note === null
            ? $this->notFoundOrForbidden($response, $userId, $args)
            : Json::write($response, $this->serializer->serialize($note));
    }

    public function create(Request $request, Response $response): Response
    {
        $input = NoteInput::fromArray($this->body($request));
        $userId = CurrentUser::userId($request);
        $bookError = $this->bookError($response, $userId, $input->bookId);
        if ($bookError !== null) {
            return $bookError;
        }
        $linkError = $this->linkError($response, $userId, $input->links);
        if ($linkError !== null) {
            return $linkError;
        }

        $note = Note::create($input->title, $input->body, $input->tags, $input->links, $this->now, $input->bookId);
        $this->notes->save($userId, $note);

        return Json::write($response, $this->serializer->serialize($note), 201);
    }

    /** @param array<array-key, mixed> $args */
    public function update(Request $request, Response $response, array $args): Response
    {
        $userId = CurrentUser::userId($request);
        $note = $this->lookup($userId, $args);
        if ($note === null) {
            return $this->notFoundOrForbidden($response, $userId, $args);
        }

        $input = NoteInput::fromArray($this->body($request));
        $bookError = $this->bookError($response, $userId, $input->bookId);
        if ($bookError !== null) {
            return $bookError;
        }
        $linkError = $this->linkError($response, $userId, $input->links);
        if ($linkError !== null) {
            return $linkError;
        }

        $note->revise($input->title, $input->body, $input->tags, $input->links, $this->now, $input->bookId);
        $this->notes->save($userId, $note);

        return Json::write($response, $this->serializer->serialize($note));
    }

    /** @param array<array-key, mixed> $args */
    public function delete(Request $request, Response $response, array $args): Response
    {
        $userId = CurrentUser::userId($request);
        $note = $this->lookup($userId, $args);
        if ($note === null) {
            return $this->notFoundOrForbidden($response, $userId, $args);
        }

        $this->notes->delete($userId, $note);

        return $response->withStatus(204);
    }

    /** @param array<array-key, mixed> $args */
    private function lookup(UserId $userId, array $args): ?Note
    {
        $raw = $args['id'] ?? null;
        if (!is_string($raw)) {
            return null;
        }
        try {
            return $this->notes->find($userId, NoteId::fromString($raw));
        } catch (InvalidArgumentException) {
            return null;
        }
    }

    /** @param array<array-key, mixed> $args */
    private function notFoundOrForbidden(Response $response, UserId $userId, array $args): Response
    {
        $raw = $args['id'] ?? null;
        if (!is_string($raw)) {
            return Json::error($response, 'note not found', 404);
        }
        try {
            $otherUsersNote = $this->notes->belongsToAnotherUser($userId, NoteId::fromString($raw));
        } catch (InvalidArgumentException) {
            return Json::error($response, 'note not found', 404);
        }

        return $otherUsersNote
            ? Json::error($response, 'forbidden', 403)
            : Json::error($response, 'note not found', 404);
    }

    private function bookError(Response $response, UserId $userId, ?BookId $bookId): ?Response
    {
        if ($bookId === null || $this->books->find($userId, $bookId) !== null) {
            return null;
        }

        return $this->books->belongsToAnotherUser($userId, $bookId)
            ? Json::error($response, 'forbidden', 403)
            : Json::error($response, 'book not found', 404);
    }

    private function linkError(Response $response, UserId $userId, NoteIdList $links): ?Response
    {
        foreach ($links->ids as $link) {
            if ($this->notes->find($userId, $link) !== null) {
                continue;
            }

            return $this->notes->belongsToAnotherUser($userId, $link)
                ? Json::error($response, 'forbidden', 403)
                : Json::error($response, 'note not found', 404);
        }

        return null;
    }

    /** @return array<array-key, mixed> */
    private function body(Request $request): array
    {
        $body = $request->getParsedBody();

        return is_array($body) ? $body : [];
    }
}
