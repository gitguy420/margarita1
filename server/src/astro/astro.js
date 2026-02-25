import * as Astronomy from 'astronomy-engine';
import { DateTime } from 'luxon';
import tzLookup from 'tz-lookup';

const PLANETS = [
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto'
];

const SIGNS = [
  'Овен',
  'Телец',
  'Близнецы',
  'Рак',
  'Лев',
  'Дева',
  'Весы',
  'Скорпион',
  'Стрелец',
  'Козерог',
  'Водолей',
  'Рыбы'
];

const ELEMENTS = ['Огонь', 'Земля', 'Воздух', 'Вода'];

const ASPECTS = [
  { name: 'Соединение', angle: 0, orb: 8, weight: 3 },
  { name: 'Оппозиция', angle: 180, orb: 8, weight: -2 },
  { name: 'Трин', angle: 120, orb: 6, weight: 2 },
  { name: 'Квадрат', angle: 90, orb: 6, weight: -2 },
  { name: 'Секстиль', angle: 60, orb: 4, weight: 1 }
];

function normalizeAngle(angle) {
  let a = angle % 360;
  if (a < 0) a += 360;
  return a;
}

function angleDiff(a, b) {
  let diff = Math.abs(a - b) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

function signOf(angle) {
  const idx = Math.floor(normalizeAngle(angle) / 30);
  return SIGNS[idx];
}

function elementOf(angle) {
  const idx = Math.floor(normalizeAngle(angle) / 30);
  return ELEMENTS[idx % 4];
}

function buildElementBalance(positions) {
  const balance = { 'Огонь': 0, 'Земля': 0, 'Воздух': 0, 'Вода': 0 };
  for (const p of positions) {
    balance[p.element] = (balance[p.element] || 0) + 1;
  }
  return balance;
}

function balanceToPercent(balance) {
  const total = Object.values(balance).reduce((s, v) => s + v, 0) || 1;
  const out = {};
  for (const [k, v] of Object.entries(balance)) {
    out[k] = Math.round((v / total) * 100);
  }
  return out;
}

function formatAngle(angle) {
  const norm = normalizeAngle(angle);
  const deg = Math.floor(norm);
  const min = Math.round((norm - deg) * 60);
  return `${deg}°${String(min).padStart(2, '0')}`;
}

function getTimeZone(lat, lon) {
  try {
    return tzLookup(lat, lon);
  } catch (e) {
    return 'UTC';
  }
}

function toUtcDate({ date, time, isTimeUnknown, tz }) {
  const safeTime = time || '12:00';
  const dt = DateTime.fromISO(`${date}T${safeTime}`, { zone: tz });
  return { utc: dt.toUTC().toJSDate(), local: dt, usedTime: safeTime, isTimeUnknown };
}

function planetLongitude(body, utcDate) {
  const time = Astronomy.MakeTime(utcDate);
  const vec = Astronomy.GeoVector(body, time, true);
  const ecl = Astronomy.Ecliptic(vec);
  return normalizeAngle(ecl.elon);
}

export function buildChart(person) {
  const tz = getTimeZone(person.location.lat, person.location.lon);
  const { utc, local, usedTime, isTimeUnknown } = toUtcDate({
    date: person.birthDate,
    time: person.birthTime,
    isTimeUnknown: person.isTimeUnknown,
    tz
  });

  const positions = PLANETS.map((body) => {
    const lon = planetLongitude(body, utc);
    return {
      body,
      lon,
      sign: signOf(lon),
      element: elementOf(lon),
      formatted: formatAngle(lon)
    };
  });

  const elementBalance = buildElementBalance(positions);

  return {
    person,
    tz,
    local,
    usedTime,
    isTimeUnknown,
    positions,
    elementBalance,
    elementPercent: balanceToPercent(elementBalance)
  };
}

export function buildSynastry(chartA, chartB) {
  const aspects = [];
  for (const a of chartA.positions) {
    for (const b of chartB.positions) {
      const diff = angleDiff(a.lon, b.lon);
      for (const asp of ASPECTS) {
        const delta = Math.abs(diff - asp.angle);
        if (delta <= asp.orb) {
          aspects.push({
            a: a.body,
            b: b.body,
            aspect: asp.name,
            angle: diff,
            orb: delta,
            weight: asp.weight
          });
          break;
        }
      }
    }
  }

  const totalScore = aspects.reduce((sum, a) => sum + a.weight, 0);
  const harmony = Math.max(0, Math.min(100, Math.round(50 + totalScore * 2)));

  const topAspects = [...aspects]
    .sort((x, y) => Math.abs(x.orb) - Math.abs(y.orb))
    .slice(0, 8);

  return { aspects, harmony, topAspects };
}

export function buildNarrative({ chartA, chartB, synastry }) {
  const score = synastry.harmony;
  const mood = score >= 70 ? 'вдохновляющее и поддерживающее' : score >= 50 ? 'живое и динамичное' : 'требующее внимания и зрелости';

  const timeNoteA = chartA.isTimeUnknown ? '⚠️ Время рождения неизвестно, поэтому расчёт домов и асцендента пропущен.' : '';
  const timeNoteB = chartB.isTimeUnknown ? '⚠️ Время рождения неизвестно, поэтому расчёт домов и асцендента пропущен.' : '';

  const elementBlend = (label, a, b) => {
    const topA = Object.entries(a).sort((x, y) => y[1] - x[1])[0][0];
    const topB = Object.entries(b).sort((x, y) => y[1] - x[1])[0][0];
    return `${label}: у партнёра A преобладает ${topA.toLowerCase()}, у партнёра B — ${topB.toLowerCase()}.`;
  };

  const PLANET_THEMES = {
    Sun: 'идентичность и жизненная сила',
    Moon: 'эмоции и чувство безопасности',
    Mercury: 'мышление и общение',
    Venus: 'любовь и ценности',
    Mars: 'инициатива и страсть',
    Jupiter: 'рост и вдохновение',
    Saturn: 'ответственность и границы',
    Uranus: 'свобода и перемены',
    Neptune: 'мечты и интуиция',
    Pluto: 'глубина и трансформация'
  };

  const aspectTone = (asp) => {
    if (asp === 'Соединение') return 'сильное притяжение и чувство единства';
    if (asp === 'Трин') return 'естественный поток и лёгкость';
    if (asp === 'Секстиль') return 'мягкую поддержку и сотрудничество';
    if (asp === 'Квадрат') return 'напряжение, которое важно проживать осознанно';
    if (asp === 'Оппозиция') return 'полярность, которая учит балансу';
    return 'значимую динамику';
  };

  const pairKey = (a, b) => [a, b].sort().join('-');

  const PAIR_TEXTS = {
    'Mercury-Sun':
      'Союз подсвечивает желание быть услышанными и понятыми: мысли и самоощущение начинают звучать в унисон.',
    'Mercury-Venus':
      'Тёплые слова, комплименты и эстетика становятся языком вашей близости.',
    'Mercury-Moon':
      'Разговоры здесь — про чувства. Важно оставлять место для уязвимости и мягкости.',
    'Venus-Mars':
      'Это искра и притяжение: романтика легко переходит в страсть, когда вы внимательны друг к другу.',
    'Sun-Moon':
      'Классическая связка «я и мы»: чувство дома и идентичности становятся опорой союза.',
    'Jupiter-Saturn':
      'Баланс между ростом и ответственностью. Этот аспект помогает строить долговременное.',
    'Mars-Saturn':
      'Важна зрелость и терпение: энергия требует формы и границ.',
    'Uranus-Venus':
      'Свобода и нестандартность в любви: отношения живут, когда есть пространство.',
    'Neptune-Moon':
      'Сильная эмпатия и интуиция. Нужны ясные договорённости, чтобы не растворяться.',
    'Pluto-Venus':
      'Глубокая трансформация через любовь. Важно не уходить в контроль и страхи.'
  };

  const aspectAdvice = (asp, a, b) => {
    const base = [
      'Фиксируйте, что в этом аспекте помогает вам чувствовать связь.',
      'Берегите тон общения — он важнее, чем правота.',
      'Создавайте маленькие совместные ритуалы.'
    ];
    if (asp === 'Квадрат') {
      return [
        'Замечайте триггеры заранее и делайте паузу.',
        'Договаривайтесь о границах и способах поддержки.',
        'Переводите спор в “мы против проблемы”.'
      ];
    }
    if (asp === 'Оппозиция') {
      return [
        'Ищите баланс между разными потребностями.',
        'Смотрите на различия как на ресурс.',
        'Давайте друг другу право быть “не как я”.'
      ];
    }
    if (a === 'Mercury' || b === 'Mercury') {
      return [
        'Договаривайтесь о правилах общения заранее.',
        'Пересказывайте услышанное, чтобы избежать ошибок.',
        'Используйте мягкие формулировки.'
      ];
    }
    if (a === 'Venus' || b === 'Venus') {
      return [
        'Признавайте ценности друг друга.',
        'Сохраняйте романтику в мелочах.',
        'Создавайте совместные символы пары.'
      ];
    }
    if (a === 'Mars' || b === 'Mars') {
      return [
        'Давайте выход энергии через совместные активности.',
        'Снижайте резкость в спорах.',
        'Отмечайте сильные стороны партнёра.'
      ];
    }
    return base;
  };

  const aspectStory = synastry.topAspects.map((a) => ({
    title: `${PLANET_LABELS[a.a]} — ${a.aspect} — ${PLANET_LABELS[a.b]}`,
    text: `${
      PAIR_TEXTS[pairKey(a.a, a.b)] ||
      `Этот аспект приносит ${aspectTone(a.aspect)} между темами ${PLANET_THEMES[a.a]} и ${PLANET_THEMES[a.b]}.`
    }`,
    bullets: aspectAdvice(a.aspect, a.a, a.b)
  }));

  return {
    summary: `Это ${mood} соединение с индексом гармонии ${score}/100. Ваши сильные стороны проявляются через эмоциональную близость, обмен идеями и общие ценности.`,
    strengths: [
      'Быстрое ощущение “своего человека” и желание поддерживать друг друга.',
      'Естественная тяга к совместным планам и вдохновляющим разговорам.',
      'Хороший потенциал для гармонизации быта через чёткие договорённости.'
    ],
    growth: [
      'Важно беречь личные границы и не ставить ожидания выше возможностей партнёра.',
      'Напряжённые аспекты лучше проживать через честный диалог, а не через молчание.',
      'Добавляйте в отношения ритуалы заботы — они усиливают стабильность.'
    ],
    emotional: `Эмоциональная совместимость ощущается как ${score >= 60 ? 'тёплая и поддерживающая' : 'переменная и требующая гибкости'}.`,
    intimacy: 'Интимная динамика раскрывается через доверие и бережное отношение к уязвимостям друг друга.',
    communication: 'Ваши разговоры становятся глубже, когда вы говорите не только о фактах, но и о чувствах.',
    values: 'Ценности пары сильнее, когда вы заранее договариваетесь о целях и роли каждого.',
    advice: [
      'Планируйте совместные “точки радости” минимум раз в неделю.',
      'Слушайте друг друга без советов, когда нужен просто контакт.',
      'Оставляйте место для личного пространства — это усиливает доверие.'
    ],
    notes: [timeNoteA, timeNoteB].filter(Boolean),
    elementA: chartA.elementPercent,
    elementB: chartB.elementPercent,
    elementSummary: [
      elementBlend('Энергетический стиль', chartA.elementPercent, chartB.elementPercent),
      'Стихийный баланс показывает, в каких состояниях вам легче всего находить общий ритм.'
    ],
    aspectStory
  };
}

export const PLANET_LABELS = {
  Sun: 'Солнце',
  Moon: 'Луна',
  Mercury: 'Меркурий',
  Venus: 'Венера',
  Mars: 'Марс',
  Jupiter: 'Юпитер',
  Saturn: 'Сатурн',
  Uranus: 'Уран',
  Neptune: 'Нептун',
  Pluto: 'Плутон'
};
