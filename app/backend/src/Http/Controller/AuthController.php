<?php

declare(strict_types=1);

namespace Recall\Http\Controller;

use DateTimeImmutable;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Recall\Domain\User;
use Recall\Http\Input\RegistrationInput;
use Recall\Http\Json;
use Recall\Infrastructure\Persistence\UserRepository;

final readonly class AuthController
{
    public function __construct(private UserRepository $users) {}

    public function register(Request $request, Response $response): Response
    {
        $input = RegistrationInput::fromArray($this->body($request));
        if ($this->users->findByUsername($input->username) !== null) {
            return Json::error($response, 'логин уже занят', 409, ['username' => 'выберите другой логин']);
        }

        $user = User::register($input->username, $input->password);
        $this->users->save($user);

        return Json::write($response, $this->profile($user), 201);
    }

    /** @return array<array-key, mixed> */
    private function body(Request $request): array
    {
        $body = $request->getParsedBody();

        return is_array($body) ? $body : [];
    }

    /** @return array{id: string, username: string, created_at: string} */
    private function profile(User $user): array
    {
        return [
            'id' => $user->id->toString(),
            'username' => $user->username->value,
            'created_at' => $user->createdAt()->format(DateTimeImmutable::ATOM),
        ];
    }
}
