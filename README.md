# jellyfin_multi_tag
**Adds tags with information about quality, number of episodes, etc.**
[DISSCLAIMER] I am not very experienced in coding, so Claude AI was used to help me create my tweaks and changes
All original features are still there
I also created a secondary script that adds support for MediaBar Plugin
The changes I implemented are [editing in progress]:
1. Translated all comments from Russian to English

![logo](https://github.com/Druidblack/jellyfin_multi_tag/blob/main/Img/8.jpg)
![logo2](https://github.com/Druidblack/jellyfin_multi_tag/blob/main/Img/2.jpg)
![logo3](https://github.com/Druidblack/jellyfin_multi_tag/blob/main/Img/3.jpg)
![logo4](https://github.com/Druidblack/jellyfin_multi_tag/blob/main/Img/4.png)
![logo3](https://github.com/Druidblack/jellyfin_multi_tag/blob/main/Img/9.jpg)

It can display the following information:
1. Video Resolution, hrd ,dv
2. The presence of sound in Atmos format
3. Rating of a movie, series, season, or episode
4. The completeness of the series
5. It shows how many episodes you have and how many in a season.
6. Shows formal audio for movies
7. Shows the format of music albums
8. Shows the format of e-books

#  For installation
1. Install the plugin [JavaScript Injector Plugin](https://github.com/n00bcodr/Jellyfin-JavaScript-Injector)
2. Get the API Key from the website https://themoviedb.org
3. Copy the contents of the file multi_tag.js (with Api key replacement) in the plugin. Save and reload the page.
After installation, you may need to clear the cache. The cache for JMP is located at C:\Users\USERNAME\AppData\Local\Jellyfin Media Player\cache

There are additional settings in the file:
```js
  const SHOW_DV_PROFILE = false;            // DV P7/P8.x or just DV
  const COLORIZE_RATING = true;            // color indication of the rating
  const RATING_COLOR_TEXT_ONLY = false;     // if true: we paint the text and background.

  // План и прогресс сезонов
  const ENABLE_PLANNED_EPISODES = true;     // pull up the planned number of episodes of the season
  const SHOW_SEASON_PROGRESS_BADGE = true;  // "Ep current/planned" if both numbers are present

  // TMDb (источник планов и статуса сериала)
  const ENABLE_TMDB = true;                 // TMDb for Seasonal plans
  const ENABLE_TMDB_ENDED = true;           // TMDb as a source of "Ended" status for TV series
  const TMDB_API_KEY = 'API_KEY';                  // <<< insert your TMDb API key
  const TMDB_LANGUAGE = 'en-US';

  // Сериалы: бейдж Ended
  const SHOW_SERIES_ENDED_BADGE = true;     // show the red "Ended" badge
```


The original idea was noticed by https://github.com/BobHasNoSoul/Jellyfin-Qualitytags
