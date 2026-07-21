<?php

declare(strict_types=1);

namespace Recall\Http\Controller;

use InvalidArgumentException;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Recall\Domain\Book;
use Recall\Domain\ValueObject\BookId;
use Recall\Domain\ValueObject\UserId;
use Recall\Http\CurrentUser;
use Recall\Http\Input\BookInput;
use Recall\Http\Json;
use Recall\Http\Serializer;
use Recall\Infrastructure\Persistence\BookRepository;

final readonly class BooksController
{
    public function __construct(
        private BookRepository $books,
        private Serializer $serializer,
    ) {}

    public function index(Request $request, Response $response): Response
    {
        return Json::write(
            $response,
            array_map($this->serializer->serialize(...), $this->books->all(CurrentUser::userId($request))),
        );
    }

    /** @param array<array-key, mixed> $args */
    public function show(Request $request, Response $response, array $args): Response
    {
        $userId = CurrentUser::userId($request);
        $book = $this->lookup($userId, $args);

        return $book === null
            ? $this->notFoundOrForbidden($response, $userId, $args)
            : Json::write($response, $this->serializer->serialize($book));
    }

    public function create(Request $request, Response $response): Response
    {
        $input = BookInput::fromArray($this->body($request));
        $book = Book::create($input->title, $input->author, $input->openLibraryKey, $input->coverId);
        $this->books->save(CurrentUser::userId($request), $book);

        return Json::write($response, $this->serializer->serialize($book), 201);
    }

    /** @param array<array-key, mixed> $args */
    public function delete(Request $request, Response $response, array $args): Response
    {
        $userId = CurrentUser::userId($request);
        $book = $this->lookup($userId, $args);
        if ($book === null) {
            return $this->notFoundOrForbidden($response, $userId, $args);
        }

        $this->books->delete($userId, $book);

        return $response->withStatus(204);
    }

    /** @param array<array-key, mixed> $args */
    private function lookup(UserId $userId, array $args): ?Book
    {
        $raw = $args['id'] ?? null;
        if (!is_string($raw)) {
            return null;
        }
        try {
            return $this->books->find($userId, BookId::fromString($raw));
        } catch (InvalidArgumentException) {
            return null;
        }
    }

    /** @param array<array-key, mixed> $args */
    private function notFoundOrForbidden(
        Response $response,
        UserId $userId,
        array $args,
    ): Response {
        $raw = $args['id'] ?? null;
        if (!is_string($raw)) {
            return Json::error($response, 'book not found', 404);
        }
        try {
            $otherUsersBook = $this->books->belongsToAnotherUser($userId, BookId::fromString($raw));
        } catch (InvalidArgumentException) {
            return Json::error($response, 'book not found', 404);
        }

        return $otherUsersBook
            ? Json::error($response, 'forbidden', 403)
            : Json::error($response, 'book not found', 404);
    }

    /** @return array<array-key, mixed> */
    private function body(Request $request): array
    {
        $body = $request->getParsedBody();

        return is_array($body) ? $body : [];
    }
}
