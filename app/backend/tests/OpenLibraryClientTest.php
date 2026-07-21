<?php

declare(strict_types=1);

namespace Recall\Tests;

use Recall\Infrastructure\OpenLibraryClient;
use Testo\Assert;
use Testo\Test;

final class OpenLibraryClientTest
{
    #[Test]
    public function normalizesSearchResultsAndSkipsDuplicates(): void
    {
        $requestedUrl = '';
        $client = new OpenLibraryClient(static function (string $url) use (&$requestedUrl): string {
            $requestedUrl = $url;

            return json_encode([
                'docs' => [
                    [
                        'key' => '/works/OL123W',
                        'title' => 'The Pragmatic Programmer',
                        'author_name' => ['Andrew Hunt', 'David Thomas'],
                        'cover_i' => 12345,
                    ],
                    [
                        'key' => '/works/OL123W',
                        'title' => 'Duplicate',
                    ],
                    [
                        'key' => '/works/OL456W',
                        'title' => 'No cover',
                        'author_name' => [],
                    ],
                    ['title' => 'Missing key'],
                ],
            ], JSON_THROW_ON_ERROR);
        });

        $results = $client->search('rust & memory');

        Assert::same(count($results), 2);
        Assert::same($results[0]->title, 'The Pragmatic Programmer');
        Assert::same($results[0]->author, 'Andrew Hunt');
        Assert::same($results[0]->openLibraryKey, '/works/OL123W');
        Assert::same($results[0]->coverId, 12345);
        Assert::same($results[1]->author, '');
        Assert::same($results[1]->coverId, null);
        Assert::true(str_contains($requestedUrl, 'q=rust%20%26%20memory'));
        Assert::true(str_contains($requestedUrl, 'limit=10'));
    }
}
