<?php

declare(strict_types=1);

namespace Recall\Http\Controller;

use DateTimeImmutable;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Recall\Domain\Session;
use Recall\Domain\User;
use Recall\Http\Input\LoginInput;
use Recall\Http\Input\RegistrationInput;
use Recall\Http\Json;
use Recall\Http\SessionCookie;
use Recall\Infrastructure\Persistence\SessionRepository;
use Recall\Infrastructure\Persistence\UserRepository;

final readonly class AuthController
{
    public function __construct(
        private UserRepository $users,
        private SessionRepository $sessions,
        private SessionCookie $cookie,
        private DateTimeImmutable $now,
    ) {}

    public function register(Request $request, Response $response): Response
    {
        $input = RegistrationInput::fromArray($this->body($request));
        if ($this->users->findByUsername($input->username) !== null) {
            return Json::error($response, 'логин уже занят', 409, ['username' => 'выберите другой логин']);
        }

        $user = User::register($input->username, $input->password);
        $this->users->save($user);
        $credentials = Session::start($user->id, $this->now);
        $this->sessions->save($credentials->session);

        return $this->cookie->add(Json::write($response, $this->profile($user), 201), $credentials);
    }

    public function login(Request $request, Response $response): Response
    {
        $input = LoginInput::fromArray($this->body($request));
        $user = $this->users->findByUsername($input->username);
        if ($user === null || !$user->verifiesPassword($input->password)) {
            return Json::error($response, 'неверный логин или пароль', 401);
        }

        $credentials = Session::start($user->id, $this->now);
        $this->sessions->save($credentials->session);

        return $this->cookie->add(Json::write($response, $this->profile($user)), $credentials);
    }

    public function currentUser(Request $request, Response $response): Response
    {
        $token = $this->cookie->token($request);
        if ($token === null) {
            return Json::error($response, 'необходима авторизация', 401);
        }

        $session = $this->sessions->findByToken($token, $this->now);
        if ($session === null) {
            return Json::error($response, 'необходима авторизация', 401);
        }

        $user = $this->users->find($session->userId);
        if ($user === null) {
            return Json::error($response, 'необходима авторизация', 401);
        }

        return Json::write($response, $this->profile($user));
    }

    public function logout(Request $request, Response $response): Response
    {
        $token = $this->cookie->token($request);
        if ($token !== null) {
            $session = $this->sessions->findByToken($token, $this->now);
            if ($session !== null) {
                $this->sessions->delete($session);
            }
        }

        return $this->cookie->clear($response->withStatus(204));
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
