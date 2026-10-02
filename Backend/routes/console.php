<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// RS-11: limpieza de tokens vencidos (los vencidos ya se rechazan; esto evita que la tabla crezca).
Schedule::command('sanctum:prune-expired --hours=24')->daily();
