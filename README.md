# jellyfin_multi_tag
**Adds badges with information about quality, episode count, series status, and more.**

> **Disclaimer:** I am not very experienced in coding, so Claude AI was used to help me create my tweaks and changes.

This is a fork to Druidblack's jellyfin_multi_tag script [Druidblack/jellyfin_multi_tag](https://github.com/Druidblack/jellyfin_multi_tag)
Which was inspired by [BobHasNoSoul/Jellyfin-Qualitytags](https://github.com/BobHasNoSoul/jellyfin-qualitytags).

[Screenshots can be found here](#Screenshots)

---

## Installation

1. Install the **JavaScript Injector Plugin** for Jellyfin
2. Get a free API key from [themoviedb.org](https://themoviedb.org)
3. Paste the contents of `multi_tag.js` into the plugin (replacing `API_KEY` with your TMDb key), save, and reload
4. For media bar integration, also inject `MediaBar_QualityTags.js`
5. If badges don't appear immediately, clear your browser/client cache. For Jellyfin Media Player the cache is at:
   `C:\Users\USERNAME\AppData\Local\Jellyfin Media Player\cache`

---

## Additional settings at the beggining of the file that can be adjusted:

```js
  const SHOW_DV_PROFILE = true;                  // DV P7/P8.x or just DV

  const SHOW_RATINGS = false;                    // show/hide rating badges completely
  const COLORIZE_RATING = false;                 // color indication of the rating
  const RATING_COLOR_TEXT_ONLY = false;          // if true: color the text, background #f0f0f0

  // Season plan and progress
  const ENABLE_PLANNED_EPISODES = true;          // pull up the planned number of episodes of the season
  const SHOW_SEASON_PROGRESS_BADGE = true;       // "Ep current/planned" if both numbers are present

  // TMDb (source for season plans and series status)
  const ENABLE_TMDB = true;                      // TMDb for seasonal plans
  const ENABLE_TMDB_ENDED = true;               // TMDb as a source of "Ended" status for TV series
  const TMDB_API_KEY = 'API_KEY';               // <<< insert your TMDb API key
  const TMDB_LANGUAGE = 'en-US';

  // Series: status badges
  const SHOW_SERIES_ENDED_BADGE = true;         // show the red "Ended" badge
  const SHOW_SERIES_CONTINUING_BADGE = true;    // show the green "Ongoing" badge
```

---

## Features

### Original features — unchanged

The following features from the original script are present and untouched:

- Music album format badge (FLAC, MP3, AAC, etc.)
- E-book format badge (EPUB, PDF, MOBI, etc.)
- Actor birthplace and country flag on person cards — supports text, flag emoji, or both (`PERSON_BIRTHPLACE_DISPLAY`); rendered via Twemoji for cross-platform consistency
- Actor age at time of current film/episode release date (top-left badge), plus current age or age at death (bottom-right badge)

### Original features — modified

The following original features are still present but have been extended or changed:

- **Video resolution** — still shows a resolution badge, but expanded (see [Video Quality](#video-quality))
- **Audio format** — still shown as a badge, but completely rewritten detection engine (see [Audio Quality](#audio-quality))
- **Ratings** — still shown, but now can be disabled entirely via `SHOW_RATINGS`
- **Series status and quality badge*** — "Ended" badge still present; now joined by an "Ongoing" badge (see [Series Status](#series-status))
- **Series quality badge** — New method for determining series quality; (see [Series quality detection fix](#Series-quality-detection-fix))

---

## Changes

### All comments translated from Russian to English

The original script's comments were in Russian, which have been translated to English.

---

### New on/off toggles

- `SHOW_RATINGS` — hide or show rating badges entirely. The original always showed them with no way to disable
- `SHOW_SERIES_CONTINUING_BADGE` — enable or disable the new "Ongoing" badge for currently airing series independently of the "Ended" badge

---

### Series status

Two separate status badges are now shown on series cards, both sourced from TMDb:

- 🔴 **Ended** — shown when TMDb reports the series as `ended`, `canceled`, or `cancelled` (controlled by `SHOW_SERIES_ENDED_BADGE`)
- 🟢 **Ongoing** — shown when TMDb reports the series as `returning series`, `in production`, or `planned` (controlled by `SHOW_SERIES_CONTINUING_BADGE`)

Both badges can be enabled or disabled independently.

---

### Series quality detection fix

The original script fetched whatever episode appeared first in the database when determining the quality badge for a series card — this could be a Season 0 special or an extra, resulting in a wrong or missing quality badge.

This fork first explicitly requests the first episode of Season 1 (`ParentIndexNumber: 1`). If no Season 1 episode exists, it falls back to any episode while still explicitly excluding Season 0 items.

---

### Video quality

#### HDR / Dolby Vision badges

| Badge | Color | Hex |
|---|---|---|
| DV (Dolby Vision) | ![](https://placehold.co/15x15/8000cc/8000cc.png) | `#8000cc` |
| HDR | ![](https://placehold.co/15x15/cc0000/cc0000.png) | `#cc0000` |

---

#### Resolution badges

The original had 3 resolution tiers (`4K`, `HD`, `SD`). This fork expands to 6 distinct tiers, each with its own badge color:

| Badge | Threshold | Color | Hex |
|---|---|---|---|
| 8K | ≥ 4320px height | ![](https://placehold.co/15x15/6600cc/6600cc.png) | `#6600cc` |
| 4K | ≥ 2160px height | ![](https://placehold.co/15x15/0066cc/0066cc.png) | `#0066cc` |
| 2K | ≥ 1440px height | ![](https://placehold.co/15x15/00cccc/00cccc.png) | `#00cccc` |
| 1080p | ≥ 1080px height | ![](https://placehold.co/15x15/009933/009933.png) | `#009933` |
| 720p | ≥ 720px height | ![](https://placehold.co/15x15/ffa500/ffa500.png) | `#ffa500` |
| SD | < 720px height | ![](https://placehold.co/15x15/666666/666666.png) | `#666666` |

The generic `HD` label from the original has been removed entirely.

---

### Audio quality

The original detected only 3 outcomes: `ATMOS`, `DD 5.1`, or `Stereo` — all based solely on channel count. This fork replaces that with a full scoring engine that identifies the actual codec from multiple Jellyfin metadata fields, then selects the best stream by format quality first and channel count second.

The detection now reads from: `DisplayTitle`, `Title`, `Profile`, `Codec`, `AudioCodec`, `Format`, `Container`, `ChannelLayout`, `CodecTag`, `CodecLongName` — this handles cases where Jellyfin strips codec fields from combined movie versions.

All audio badges include a channel suffix (e.g. `Dolby Atmos 7.1`, `DTS-HD MA 5.1`).

#### Audio hierarchy

| Score | Badge Label | Color | Hex |
|---|---|---|---|
| 21 | DTS:X | ![](https://placehold.co/15x15/00bcd4/00bcd4.png) | `#00bcd4` |
| 20 | Dolby Atmos | ![](https://placehold.co/15x15/00acc1/00acc1.png) | `#00acc1` |
| 19 | Dolby (TrueHD) | ![](https://placehold.co/15x15/0097a7/0097a7.png) | `#0097a7` |
| 18 | DD+ Atmos | ![](https://placehold.co/15x15/00838f/00838f.png) | `#00838f` |
| 17 | DTS-HD MA / PCM / LPCM / FLAC | ![](https://placehold.co/15x15/00796b/00796b.png) | `#00796b` |
| 16 | DTS-HD HRA | ![](https://placehold.co/15x15/00695c/00695c.png) | `#00695c` |
| 15 | DTS-HD | ![](https://placehold.co/15x15/004d40/004d40.png) | `#004d40` |
| 14 | DD+ | ![](https://placehold.co/15x15/f57c00/f57c00.png) | `#f57c00` |
| 13–11 | xHE-AAC / HE-AACv2 / AAC-ELD | ![](https://placehold.co/15x15/f57c00/f57c00.png) | `#f57c00` |
| 10 | DTS ES | ![](https://placehold.co/15x15/ef6c00/ef6c00.png) | `#ef6c00` |
| 9 | DD EX | ![](https://placehold.co/15x15/e65100/e65100.png) | `#e65100` |
| 8 | DTS | ![](https://placehold.co/15x15/7cb342/7cb342.png) | `#7cb342` |
| 7 | DD | ![](https://placehold.co/15x15/33691e/33691e.png) | `#33691e` |
| 6–3 | OPUS / AAC / AAC-LC / HE-AAC / AAC-LD | ![](https://placehold.co/15x15/33691e/33691e.png) | `#33691e` |
| 2 | Stereo | ![](https://placehold.co/15x15/546e7a/546e7a.png) | `#546e7a` |
| 1 | Mono | ![](https://placehold.co/15x15/455a64/455a64.png) | `#455a64` |

> PCM and LPCM additionally display bit depth where available (e.g. `PCM:S24 5.1`).

---

### Media bar integration

A companion script `MediaBar_QualityTags.js` is included in this repository. It integrates the quality tag data into the Jellyfin media bar, displaying the quality badges alongside the shown item's info.

---

### Persistent localStorage cache

Quality data is now cached in `localStorage` under the key `jellyfin_quality_cache_v1`, persisting across browser sessions for significantly faster badge rendering on repeat loads.

Cache entries are automatically invalidated by comparing Jellyfin's `DateModified` timestamp — if a file has been updated on the server, the cache entry for that item is discarded and re-fetched. Each item is only re-validated once per session. A utility function `window.clearJellyfinQualityCache()` is also exposed for manually clearing the cache from the browser console if needed.

---

### Shared window API

The following are exposed on the `window` object to allow companion scripts (such as `MediaBar_QualityTags.js`) to stay in sync with the quality tag script without duplicating logic:

- `window._jellyfinAudioColorMap` — the full audio format-to-color mapping
- `window._jellyfinDetectAudioLabel` — the audio detection function
- `window._jellyfinOverlayCache` — the live overlay cache


### Screenshots
![logo](https://github.com/Impulse139/JellyFin_MultiTag/blob/main/Img/MediaBar_Support_ScreenCap.jpg)
![logo1](https://github.com/Druidblack/jellyfin_multi_tag/blob/main/Img/8.jpg)
![logo2](https://github.com/Druidblack/jellyfin_multi_tag/blob/main/Img/2.jpg)
![logo3](https://github.com/Druidblack/jellyfin_multi_tag/blob/main/Img/3.jpg)
![logo4](https://github.com/Druidblack/jellyfin_multi_tag/blob/main/Img/4.png)
![logo3](https://github.com/Druidblack/jellyfin_multi_tag/blob/main/Img/9.jpg)


The original idea was created by https://github.com/BobHasNoSoul/Jellyfin-Qualitytags
