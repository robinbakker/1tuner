import { expect, Page, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Only simulated events should drive this mocked media element. Native
    // source loading can otherwise emit unrelated errors during a retry.
    for (const event of ['error', 'stalled', 'playing', 'loadedmetadata', 'durationchange', 'timeupdate', 'ended']) {
      document.addEventListener(
        event,
        (e) => {
          if (e.isTrusted && e.target instanceof HTMLMediaElement) e.stopImmediatePropagation();
        },
        true,
      );
    }
    const positions = new WeakMap<HTMLMediaElement, number>();
    const sources = new WeakMap<HTMLMediaElement, string>();
    Object.defineProperties(HTMLMediaElement.prototype, {
      currentTime: {
        get() {
          return positions.get(this) ?? 0;
        },
        set(value: number) {
          positions.set(this, value);
        },
      },
      currentSrc: {
        get() {
          return sources.get(this) ?? '';
        },
      },
      duration: {
        get() {
          return Number(this.dataset.duration ?? 600);
        },
      },
      readyState: {
        get() {
          return 4;
        },
      },
      play: {
        value() {
          this.dataset.plays = String(Number(this.dataset.plays ?? 0) + 1);
          if (this.dataset.failPlay === 'true') return Promise.reject(new Error('Stream unavailable'));
          this.dispatchEvent(new Event('playing'));
          return Promise.resolve();
        },
      },
      pause: { value() {} },
      load: {
        value() {
          positions.set(this, 0);
          sources.set(this, this.getAttribute('src') || this.querySelector('source')?.src || '');
        },
      },
    });
  });
  await page.route('https://media.example/**', (route) => route.abort());
  await page.goto('/');
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const path = '/tests/fixtures/reconnect-state.ts';
        return (await import(path)).isDBLoaded.value;
      }),
    )
    .toBe(true);
  await page.evaluate(async () => {
    const path = '/tests/fixtures/reconnect-state.ts';
    const { settingsState } = await import(path);
    settingsState.value = { ...settingsState.value, disableReconnectNoise: true };
  });
});

async function startPlayer(page: Page, playType = 'radio') {
  await page.evaluate(async (playType) => {
    const path = '/tests/fixtures/reconnect-state.ts';
    const { playerState } = await import(path);
    playerState.value = {
      playType,
      isPlaying: true,
      contentID: 'reconnect-test',
      title: 'Reconnect test',
      imageUrl: '',
      pageLocation: '/',
      currentTime: 0,
      streams: [{ url: 'https://media.example/stream.mp3', mimetype: 'audio/mpeg' }],
    };
  }, playType);
  await expect(page.locator('audio')).toHaveAttribute('data-plays', '1');
}

for (const event of ['stalled', 'error']) {
  test(`recovers from a second ${event} after replacing the audio element`, async ({ page }) => {
    await startPlayer(page);
    const original = await page.locator('audio').elementHandle();
    await page.locator('audio').dispatchEvent(event);
    await expect.poll(() => original!.evaluate((audio) => audio.isConnected)).toBe(false);
    // A key change must not cancel the scheduled, cache-busted retry.
    await expect(page.locator('audio')).toHaveAttribute('src', /[?&]_=/);
    await expect(page.locator('audio')).toHaveAttribute('data-plays', '1');
    const replacement = await page.locator('audio').elementHandle();
    await page.locator('audio').dispatchEvent(event);
    await expect.poll(() => replacement!.evaluate((audio) => audio.isConnected)).toBe(false);
    await expect(page.locator('audio')).toHaveAttribute('src', /[?&]_=/);
    await expect(page.locator('audio')).toHaveAttribute('data-plays', '1');

    // Detached elements must no longer be able to start recovery.
    await original!.evaluate((audio, event) => audio.dispatchEvent(new Event(event)), event);
    await replacement!.evaluate((audio, event) => audio.dispatchEvent(new Event(event)), event);
    await page.waitForTimeout(600);
    await expect(page.locator('audio')).toHaveAttribute('data-plays', '1');
  });
}

test('a failed retry keeps retrying on the replacement element', async ({ page }) => {
  await startPlayer(page);
  await page.locator('audio').dispatchEvent('stalled');
  await expect(page.locator('audio')).not.toHaveAttribute('data-plays');
  await page.locator('audio').evaluate((audio) => {
    audio.dataset.failPlay = 'true';
  });
  await expect(page.locator('audio')).toHaveAttribute('data-plays', '1');
  await page.locator('audio').evaluate((audio) => {
    delete audio.dataset.failPlay;
  });
  await expect(page.locator('audio')).toHaveAttribute('data-plays', '2');
  await page.locator('audio').dispatchEvent('stalled');
  await expect(page.locator('audio')).toHaveAttribute('data-plays', '1');
});

test('pausing during a reconnect cancels the pending retry and allows a fresh recovery', async ({ page }) => {
  await startPlayer(page);
  await page.locator('audio').dispatchEvent('stalled');
  await expect(page.locator('audio')).not.toHaveAttribute('data-plays');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.waitForTimeout(600);
  await expect(page.locator('audio')).not.toHaveAttribute('src');
  await expect(page.locator('audio')).not.toHaveAttribute('data-plays');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  const resumed = await page.locator('audio').elementHandle();
  await page.locator('audio').dispatchEvent('stalled');
  await expect.poll(() => resumed!.evaluate((audio) => audio.isConnected)).toBe(false);
  await expect(page.locator('audio')).toHaveAttribute('src', /[?&]_=/);
});

test('a forced podcast remount restores playback and handles metadata, progress and completion', async ({ page }) => {
  await startPlayer(page, 'podcast');
  const original = await page.locator('audio').elementHandle();
  await page.evaluate(async () => {
    const path = '/tests/fixtures/reconnect-state.ts';
    const { audioKey, playbackRateSignal } = await import(path);
    playbackRateSignal.value = 1.5;
    audioKey.value++;
  });
  await expect.poll(() => original!.evaluate((audio) => audio.isConnected)).toBe(false);
  await expect(page.locator('audio')).toHaveAttribute('data-plays', '1');
  expect(await page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.playbackRate)).toBe(1.5);

  for (const [event, duration] of [
    ['loadedmetadata', 600],
    ['durationchange', 700],
  ] as const) {
    await page.locator('audio').evaluate(
      (audio, { event, duration }) => {
        audio.dataset.duration = String(duration);
        audio.dispatchEvent(new Event(event));
      },
      { event, duration },
    );
    await expect
      .poll(() =>
        page.evaluate(async () => {
          const path = '/tests/fixtures/reconnect-state.ts';
          return (await import(path)).durationSignal.value;
        }),
      )
      .toBe(duration);
  }
  await page.locator('audio').evaluate((audio: HTMLAudioElement) => {
    audio.currentTime = 42;
    audio.dispatchEvent(new Event('timeupdate'));
  });
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const path = '/tests/fixtures/reconnect-state.ts';
        return (await import(path)).currentTime.value;
      }),
    )
    .toBe(42);
  await original!.evaluate((audio) => audio.dispatchEvent(new Event('ended')));
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await page.locator('audio').dispatchEvent('ended');
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
});
