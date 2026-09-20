import { genres } from '../assets/data/genres.json';
import type { RadioStation } from '../store/types';

type DescriptionTranslation = {
  // Separate the action from surrounding text so each language keeps its word order.
  listen: (name: string, includeSite: boolean) => [before: string, action: string, after: string];
  programming: (genres: string) => string;
  genres?: Record<string, string>;
};

// Regional variants share their base language. Keep music genre names where they
// are commonly used locally; translate descriptive categories such as news/talk.
const translations: Record<string, DescriptionTranslation> = {
  en: {
    listen: (name, includeSite) => ['', 'Listen live', ` to ${name}${includeSite ? ' on 1tuner.com' : ''}.`],
    programming: (genres) => `Online radio featuring ${genres}.`,
  },
  nl: {
    listen: (name, includeSite) => ['', 'Luister live', ` naar ${name}${includeSite ? ' op 1tuner.com' : ''}.`],
    programming: (genres) => `Online radio met ${genres}.`,
    genres: {
      alternative: 'alternatieve muziek',
      classical: 'klassieke muziek',
      electronic: 'elektronische muziek',
      local: 'lokale programma’s',
      news: 'nieuws',
      nonstop: 'non-stop muziek',
      talk: 'gesprekken',
      kids: 'kinderprogramma’s',
      sports: 'sport',
      world: 'wereldmuziek',
      filmmusic: 'filmmuziek',
      comedy: 'humor',
      drama: 'hoorspelen',
      history: 'geschiedenis',
    },
  },
  de: {
    listen: (name, includeSite) => ['', 'Hören Sie', ` ${name} live${includeSite ? ' auf 1tuner.com' : ''}.`],
    programming: (genres) => `Online-Radio mit ${genres}.`,
    genres: {
      alternative: 'Alternative',
      classical: 'klassischer Musik',
      electronic: 'elektronischer Musik',
      local: 'lokalen Inhalten',
      news: 'Nachrichten',
      talk: 'Gesprächen',
      pop: 'Pop',
      rock: 'Rock',
      dance: 'Dance',
      oldies: 'Oldies',
      sports: 'Sport',
      kids: 'Kinderprogrammen',
      world: 'Weltmusik',
    },
  },
  fr: {
    listen: (name, includeSite) => ['', 'Écoutez', ` ${name} en direct${includeSite ? ' sur 1tuner.com' : ''}.`],
    programming: (genres) => `Radio en ligne : ${genres}.`,
    genres: {
      alternative: 'musique alternative',
      classical: 'musique classique',
      electronic: 'musique électronique',
      local: 'programmes locaux',
      news: 'actualités',
      talk: 'débats',
      world: 'musiques du monde',
      filmmusic: 'musiques de films',
      oldies: 'rétro',
      sports: 'sport',
      kids: 'programmes jeunesse',
    },
  },
  es: {
    listen: (name, includeSite) => ['', 'Escucha', ` ${name} en directo${includeSite ? ' en 1tuner.com' : ''}.`],
    programming: (genres) => `Radio en línea con ${genres}.`,
    genres: {
      alternative: 'música alternativa',
      classical: 'música clásica',
      electronic: 'música electrónica',
      local: 'programación local',
      news: 'noticias',
      talk: 'tertulias',
      world: 'músicas del mundo',
      sports: 'deportes',
      kids: 'programas infantiles',
      oldies: 'éxitos de siempre',
    },
  },
  it: {
    listen: (name, includeSite) => ['', 'Ascolta', ` ${name} in diretta${includeSite ? ' su 1tuner.com' : ''}.`],
    programming: (genres) => `Radio online con ${genres}.`,
    genres: {
      alternative: 'musica alternativa',
      classical: 'musica classica',
      electronic: 'musica elettronica',
      local: 'programmi locali',
      news: 'notizie',
      talk: 'dibattiti',
      world: 'musica dal mondo',
      sports: 'sport',
      kids: 'programmi per bambini',
      oldies: 'successi del passato',
    },
  },
  pt: {
    listen: (name, includeSite) => ['', 'Ouça', ` ${name} ao vivo${includeSite ? ' no 1tuner.com' : ''}.`],
    programming: (genres) => `Rádio online com ${genres}.`,
    genres: {
      alternative: 'música alternativa',
      classical: 'música clássica',
      electronic: 'música eletrónica',
      local: 'programação local',
      news: 'notícias',
      talk: 'debates',
      world: 'música do mundo',
      sports: 'desporto',
      kids: 'programas infantis',
      oldies: 'êxitos de sempre',
    },
  },
  pl: {
    listen: (name, includeSite) => ['', 'Słuchaj', ` ${name} na żywo${includeSite ? ' na 1tuner.com' : ''}.`],
    programming: (genres) => `Radio internetowe: ${genres}.`,
    genres: {
      alternative: 'muzyka alternatywna',
      classical: 'muzyka klasyczna',
      electronic: 'muzyka elektroniczna',
      local: 'programy lokalne',
      news: 'wiadomości',
      talk: 'rozmowy',
      world: 'muzyka świata',
      sports: 'sport',
      kids: 'programy dla dzieci',
      oldies: 'dawne przeboje',
    },
  },
  sv: {
    listen: (name, includeSite) => ['', 'Lyssna', ` på ${name} live${includeSite ? ' på 1tuner.com' : ''}.`],
    programming: (genres) => `Webbradio med ${genres}.`,
    genres: {
      alternative: 'alternativ musik',
      classical: 'klassisk musik',
      electronic: 'elektronisk musik',
      local: 'lokala program',
      news: 'nyheter',
      talk: 'samtal',
      world: 'världsmusik',
      sports: 'sport',
      kids: 'barnprogram',
      oldies: 'gamla favoriter',
    },
  },
  hi: {
    listen: (name, includeSite) => [`${includeSite ? '1tuner.com पर ' : ''}${name} `, 'लाइव सुनें', '।'],
    programming: (genres) => `ऑनलाइन रेडियो: ${genres}।`,
    genres: { folk: 'लोक संगीत', pop: 'पॉप', news: 'समाचार', talk: 'बातचीत', classical: 'शास्त्रीय संगीत' },
  },
  he: {
    listen: (name, includeSite) => ['', 'האזינו', ` לשידור החי של ${name}${includeSite ? ' ב־1tuner.com' : ''}.`],
    programming: (genres) => `רדיו באינטרנט עם ${genres}.`,
    genres: {
      alternative: 'מוזיקה אלטרנטיבית',
      blues: 'בלוז',
      dance: 'דאנס',
      reggae: 'רגאיי',
      trance: 'טראנס',
      news: 'חדשות',
      talk: 'שיחות',
      pop: 'פופ',
      rock: 'רוק',
      classical: 'מוזיקה קלאסית',
    },
  },
  uk: {
    listen: (name, includeSite) => ['', 'Слухайте', ` ${name} наживо${includeSite ? ' на 1tuner.com' : ''}.`],
    programming: (genres) => `Онлайн-радіо: ${genres}.`,
    genres: {
      dance: 'танцювальна музика',
      hiphop: 'хіп-хоп',
      news: 'новини',
      pop: 'поп',
      talk: 'розмовні програми',
      rock: 'рок',
      classical: 'класична музика',
      alternative: 'альтернативна музика',
    },
  },
  el: {
    listen: (name, includeSite) => ['', 'Ακούστε', ` ${name} ζωντανά${includeSite ? ' στο 1tuner.com' : ''}.`],
    programming: (genres) => `Διαδικτυακό ραδιόφωνο με ${genres}.`,
    genres: {
      folk: 'παραδοσιακή μουσική',
      pop: 'ποπ',
      sports: 'αθλητικά',
      news: 'ειδήσεις',
      talk: 'συζητήσεις',
      rock: 'ροκ',
      classical: 'κλασική μουσική',
    },
  },
  sr: {
    listen: (name, includeSite) => ['', 'Слушајте', ` ${name} уживо${includeSite ? ' на 1tuner.com' : ''}.`],
    programming: (genres) => `Интернет радио: ${genres}.`,
    genres: {
      folk: 'народна музика',
      pop: 'поп',
      news: 'вести',
      talk: 'разговори',
      rock: 'рок',
      classical: 'класична музика',
      sports: 'спорт',
    },
  },
};

const genreNames = new Map(genres.map(({ id, name }) => [id, id === 'rnb' ? name : name.toLowerCase()]));

export function getRadioStationDescription(station: Pick<RadioStation, 'name' | 'language' | 'genres'>) {
  const baseLanguage = station.language.trim().toLowerCase().split(/[-_]/)[0];
  const language = Object.hasOwn(translations, baseLanguage) ? baseLanguage : 'en';
  const translation = translations[language];
  // Community stations can have duplicate, empty, or long lists of tags.
  const stationGenres = [...new Set((station.genres ?? []).map((genre) => genre.trim().toLowerCase()).filter(Boolean))]
    .slice(0, 5)
    .map((genre) =>
      translation.genres && Object.hasOwn(translation.genres, genre)
        ? translation.genres[genre]
        : (genreNames.get(genre) ?? genre),
    );
  const programming = stationGenres.length
    ? ` ${translation.programming(new Intl.ListFormat(language, { type: 'conjunction' }).format(stationGenres))}`
    : '';
  const [beforeAction, action, afterAction] = translation.listen(station.name, false);
  const text = beforeAction + action + afterAction + programming;
  const metaText = translation.listen(station.name, true).join('') + programming;

  return {
    text,
    beforeAction,
    action,
    afterAction: afterAction + programming,
    metaText,
    language,
    direction: language === 'he' ? ('rtl' as const) : ('ltr' as const),
  };
}
