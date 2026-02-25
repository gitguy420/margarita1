import { PLANET_LABELS } from '../astro/astro.js';

function formatPerson(person, chart) {
  return {
    fullName: `${person.firstName} ${person.lastName}`.trim(),
    birthDate: person.birthDate,
    birthTime: chart.usedTime + (person.isTimeUnknown ? ' (примерно)' : ''),
    location: `${person.location.city}, ${person.location.region}`,
    tz: chart.tz
  };
}

function aspectRow(a) {
  return `
    <tr>
      <td>${PLANET_LABELS[a.a]}</td>
      <td>${a.aspect}</td>
      <td>${PLANET_LABELS[a.b]}</td>
      <td>${a.orb.toFixed(1)}°</td>
    </tr>
  `;
}

function percentBar(label, value, color) {
  return `
    <div style="margin: 8px 0;">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#5a4a7a;">
        <span>${label}</span>
        <span>${value}%</span>
      </div>
      <div style="height:8px;border-radius:999px;background:#efe7f7;overflow:hidden;">
        <div style="height:8px;width:${value}%;background:${color};"></div>
      </div>
    </div>
  `;
}

function ringChart(value) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return `
  <svg width="140" height="140" viewBox="0 0 140 140">
    <circle cx="70" cy="70" r="${r}" fill="none" stroke="#efe7f7" stroke-width="12"/>
    <circle cx="70" cy="70" r="${r}" fill="none" stroke="#ff7aa2" stroke-width="12"
      stroke-dasharray="${dash} ${c - dash}" stroke-linecap="round" transform="rotate(-90 70 70)"/>
    <text x="70" y="76" text-anchor="middle" font-size="22" fill="#3b226b" font-family="Georgia">${value}%</text>
  </svg>
  `;
}

function aspectPage(item) {
  return `
  <section class="page">
    <div class="section">
      <h3>Ключевой аспект пары</h3>
      <div class="pill">${item.title}</div>
      <p>${item.text}</p>
      <div class="box">
        <h4>Как усиливать этот аспект</h4>
        <ul class="list">
          <li>• Говорите о чувствах, а не только о фактах.</li>
          <li>• Выбирайте “мы‑ритуалы” вместо критики.</li>
          <li>• Напоминайте друг другу о ценности связи.</li>
        </ul>
      </div>
    </div>
  </section>
  `;
}

function aspectPairPage(a, b) {
  const block = (item) => `
    <div class="box keep">
      <div class="pill">${item.title}</div>
      <p>${item.text}</p>
      <ul class="list keep">
        ${item.bullets.map((x) => `<li>• ${x}</li>`).join('')}
      </ul>
    </div>
  `;
  return `
  <section class="page">
    <div class="section">
      <h3>Ключевые аспекты пары</h3>
      <div class="grid">
        ${block(a)}
        ${b ? block(b) : '<div></div>'}
      </div>
    </div>
  </section>
  `;
}

function thematicPage(title, text, bullets) {
  return `
  <section class="page">
    <div class="section">
      <h3>${title}</h3>
      <div class="box keep">
        <p>${text}</p>
        <ul class="list keep">
          ${bullets.map((b) => `<li>• ${b}</li>`).join('')}
        </ul>
      </div>
    </div>
  </section>
  `;
}

function twoUpPage(a, b) {
  return `
  <section class="page">
    <div class="split-page">
      <div class="box keep">
        <h3>${a.title}</h3>
        <p>${a.text}</p>
        <ul class="list keep">
          ${a.bullets.map((x) => `<li>• ${x}</li>`).join('')}
        </ul>
      </div>
      <div class="box keep">
        <h3>${b.title}</h3>
        <p>${b.text}</p>
        <ul class="list keep">
          ${b.bullets.map((x) => `<li>• ${x}</li>`).join('')}
        </ul>
      </div>
    </div>
  </section>
  `;
}

function positionsPage(title, chart) {
  return `
  <section class="page">
    <div class="section">
      <div class="keep-block">
        <h3>${title}</h3>
        <table>
          <thead>
            <tr>
              <th>Планета</th>
              <th>Знак</th>
              <th>Положение</th>
              <th>Стихия</th>
            </tr>
          </thead>
          <tbody>
            ${chart.positions
              .map(
                (p) => `
              <tr>
                <td>${PLANET_LABELS[p.body]}</td>
                <td>${p.sign}</td>
                <td>${p.formatted}</td>
                <td>${p.element}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>
  </section>
  `;
}

export function renderReport({ chartA, chartB, synastry, narrative, brandName }) {
  const p1 = formatPerson(chartA.person, chartA);
  const p2 = formatPerson(chartB.person, chartB);

  return `
<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>Synastry Report</title>
  <style>
    @page { size: A4; margin: 28mm 18mm 22mm 18mm; }
    body { font-family: 'Georgia', 'Times New Roman', serif; color: #1b1333; }
    .page { page-break-after: auto; margin-bottom: 18px; }
    .page-break { page-break-before: always; }
    .cover { page-break-after: always; }
    .cover {
      height: 100%;
      background: radial-gradient(circle at top, #2b1f4b 0%, #24173f 45%, #140a2a 100%);
      color: #f6f1ff;
      padding: 36mm 22mm;
      position: relative;
    }
    .cover .stars { position: absolute; inset: 0; background-image: radial-gradient(#ffffff55 1px, transparent 1px); background-size: 40px 40px; opacity: 0.35; }
    .cover h1 { font-size: 42px; margin: 0 0 8px; }
    .cover h2 { font-size: 20px; font-weight: 400; margin: 0 0 28px; opacity: 0.8; }
    .couple { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 22px; }
    .card { background: #ffffff10; border: 1px solid #ffffff33; padding: 14px 16px; border-radius: 12px; }
    .label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6; }
    .name { font-size: 20px; margin: 6px 0; }
    .with { text-align: center; font-size: 28px; margin: 22px 0; }
    .brand { position: absolute; bottom: 18mm; left: 22mm; font-size: 14px; opacity: 0.7; }

    .section { margin: 16px 0 8px; }
    .section h3 { font-size: 22px; margin-bottom: 8px; color: #3b226b; }
    .pill { display: inline-block; background: #f4e9ff; color: #4f2b7f; padding: 6px 10px; border-radius: 999px; font-size: 12px; margin-right: 6px; }
    .subtitle { font-size: 14px; color: #5a4a7a; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    .box { background: #fdf9ff; border: 1px solid #f1e5ff; padding: 14px; border-radius: 12px; }
    .list { margin: 8px 0 0; padding: 0; list-style: none; }
    .list li { margin: 6px 0; }
    h4 { margin: 10px 0 6px; color: #3b226b; }
    .split-page { display: grid; grid-template-rows: 1fr 1fr; gap: 16px; }
    .keep { break-inside: avoid; page-break-inside: avoid; }
    .keep-block { break-inside: avoid; page-break-inside: avoid; }
    h3 { break-after: avoid; page-break-after: avoid; }

    table { width: 100%; border-collapse: collapse; font-size: 12px; page-break-inside: avoid; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #eee; }
    th { background: #f7efff; color: #4b2c7a; }

    .footer { margin-top: 24px; font-size: 11px; color: #6a5a85; }
    .emoji { font-size: 18px; }
  </style>
</head>
<body>
  <section class="page cover page-break">
    <div class="stars"></div>
    <h1>Синастрический отчёт</h1>
    <h2>Ваш астрологический портрет союза</h2>
    <div class="couple">
      <div class="card">
        <div class="label">Партнёр A</div>
        <div class="name">${p1.fullName}</div>
        <div>${p1.birthDate} • ${p1.birthTime}</div>
        <div>${p1.location}</div>
      </div>
      <div class="card">
        <div class="label">Партнёр B</div>
        <div class="name">${p2.fullName}</div>
        <div>${p2.birthDate} • ${p2.birthTime}</div>
        <div>${p2.location}</div>
      </div>
    </div>
    <div class="with">💫 Вместе</div>
    <div class="card">
      <div class="label">Индекс гармонии</div>
      <div class="name">${synastry.harmony}/100</div>
      <div>Резонанс энергии, эмоций и ценностей</div>
    </div>
    <div class="brand">generated by ${brandName}</div>
  </section>

  <section class="page">
    <div class="section">
      <h3>Общее резюме ✨</h3>
      <p>${narrative.summary}</p>
      ${narrative.notes.length ? `<p>${narrative.notes.join('<br/>')}</p>` : ''}
    </div>

    <div class="grid">
      <div class="box">
        <h3>Сильные стороны 💖</h3>
        <ul class="list">
          ${narrative.strengths.map((s) => `<li>• ${s}</li>`).join('')}
        </ul>
      </div>
      <div class="box">
        <h3>Зоны роста 🌙</h3>
        <ul class="list">
          ${narrative.growth.map((s) => `<li>• ${s}</li>`).join('')}
        </ul>
      </div>
    </div>

    <div class="section">
      <h3>Эмоции и близость</h3>
      <p>${narrative.emotional}</p>
      <p>${narrative.intimacy}</p>
    </div>

    <div class="section">
      <h3>Коммуникации и ценности</h3>
      <p>${narrative.communication}</p>
      <p>${narrative.values}</p>
    </div>

    <div class="section">
      <h3>Практические рекомендации</h3>
      <ul class="list">
        ${narrative.advice.map((s) => `<li>• ${s}</li>`).join('')}
      </ul>
    </div>

    <div class="footer">Этот отчёт создан на основе астрономических расчётов. Он не является научной рекомендацией и предназначен для саморефлексии.</div>
  </section>

  <section class="page">
    <div class="section">
      <div class="keep-block">
        <h3>Индекс гармонии 💞</h3>
        <div class="grid">
        <div>${ringChart(synastry.harmony)}</div>
        <div>
          <p>Индекс показывает, насколько легко вам находить общий ритм. Это не приговор и не “оценка любви”, а динамика взаимодействия.</p>
          <ul class="list">
            <li>• 70–100: естественная поддержка и вдохновение.</li>
            <li>• 50–69: живой диалог, есть место росту.</li>
            <li>• ниже 50: отношения требуют зрелости и бережности.</li>
          </ul>
        </div>
        </div>
      </div>
    </div>
  </section>

  <section class="page">
    <div class="section">
      <div class="keep-block">
        <h3>Баланс стихий 🌿</h3>
        <p>${narrative.elementSummary.join(' ')}</p>
        <div class="grid">
        <div class="box">
          <h4>Партнёр A</h4>
          ${percentBar('Огонь', narrative.elementA['Огонь'], '#ff8fab')}
          ${percentBar('Земля', narrative.elementA['Земля'], '#b8c27b')}
          ${percentBar('Воздух', narrative.elementA['Воздух'], '#7db5ff')}
          ${percentBar('Вода', narrative.elementA['Вода'], '#7f9cf5')}
        </div>
        <div class="box">
          <h4>Партнёр B</h4>
          ${percentBar('Огонь', narrative.elementB['Огонь'], '#ff8fab')}
          ${percentBar('Земля', narrative.elementB['Земля'], '#b8c27b')}
          ${percentBar('Воздух', narrative.elementB['Воздух'], '#7db5ff')}
          ${percentBar('Вода', narrative.elementB['Вода'], '#7f9cf5')}
        </div>
        </div>
      </div>
    </div>
  </section>

  ${twoUpPage(
    {
      title: 'Язык любви 💌',
      text:
        'Вам легче всего раскрывать чувства через внимание к деталям и тёплые слова. Даже маленькие комплименты создают ощущение безопасности.',
      bullets: [
        'Называйте то, что цените друг в друге, каждый день.',
        'Создайте “кодовые слова поддержки”.',
        'Фиксируйте маленькие победы пары.'
      ]
    },
    {
      title: 'Быт и деньги 🏡',
      text: 'Быт — это место, где забота становится видимой. Договорённости о мелочах дают ощущение опоры.',
      bullets: [
        'Разделите ответственность: “кто и что держит”.',
        'Планируйте расходы на радость, а не только на обязательства.',
        'Дайте друг другу возможность отдыхать.'
      ]
    }
  )}

  ${twoUpPage(
    {
      title: 'Доверие и безопасность 🤍',
      text: 'Доверие создаётся через повторяющиеся действия: слово = действие.',
      bullets: [
        'Говорите о триггерах без обвинений.',
        'Ритуал “проверки состояния” раз в неделю.',
        'Не копите молчание — мягко проговаривайте.'
      ]
    },
    {
      title: 'Поддержка в стрессе 🌧️',
      text: 'Когда напряжение растёт, важно не “чинить” друг друга, а быть рядом.',
      bullets: [
        'Спросите: “тебе нужно решение или просто быть рядом?”',
        'Снижайте требования в период усталости.',
        'Старайтесь не спорить на пике эмоций.'
      ]
    }
  )}

  ${twoUpPage(
    {
      title: 'Рост и развитие ✨',
      text: 'Этот союз расширяет горизонты: вместе вы замечаете новые смыслы.',
      bullets: [
        'Планируйте маленькие совместные цели на 3 месяца.',
        'Учитесь вместе — общий опыт сближает.',
        'Разрешайте друг другу меняться.'
      ]
    },
    {
      title: 'Ритуалы пары 🌸',
      text: 'Тёплые ритуалы делают отношения устойчивыми.',
      bullets: [
        'Свидание без телефонов раз в неделю.',
        'Сообщение “спасибо за сегодня”.',
        'Объятия минимум 20 секунд.'
      ]
    }
  )}

  ${twoUpPage(
    {
      title: 'Нежный прогноз на 12 месяцев 📆',
      text: 'Это не предсказание, а направление внимания на ближайший год.',
      bullets: [
        'Весна: укрепление доверия через совместные планы.',
        'Лето: больше спонтанности и радости.',
        'Осень: спокойствие, быт и устойчивость.',
        'Зима: глубина, близость и укрепление связи.'
      ]
    },
    {
      title: 'Чек‑лист заботы ✅',
      text: 'Сохраняйте эту страницу как напоминание.',
      bullets: [
        'Сказала/сказал тёплые слова сегодня.',
        'Мы обсудили планы на ближайшую неделю.',
        'Был момент тишины и близости.'
      ]
    }
  )}

  ${positionsPage('Планеты партнёра A', chartA)}
  ${positionsPage('Планеты партнёра B', chartB)}

  ${twoUpPage(
    {
      title: 'Манифест пары 💫',
      text: 'Это ваша мягкая клятва друг другу — короткая и тёплая.',
      bullets: [
        'Мы выбираем бережность вместо критики.',
        'Мы учимся слышать друг друга без давления.',
        'Мы создаём отношения, где безопасно быть собой.'
      ]
    },
    {
      title: 'Интеграция энергий 🌈',
      text: 'Союз становится сильнее, когда вы уважаете различия и находите общий ритм.',
      bullets: [
        'Ищите баланс между инициативой и поддержкой.',
        'Давайте друг другу пространство и время.',
        'Фиксируйте прогресс, даже если он маленький.'
      ]
    }
  )}

  ${(() => {
    const pages = [];
    for (let i = 0; i < narrative.aspectStory.length; i += 2) {
      pages.push(aspectPairPage(narrative.aspectStory[i], narrative.aspectStory[i + 1]));
    }
    return pages.join('');
  })()}

  <section class="page page-break">
    <div class="section">
      <div class="keep-block">
        <h3>Топ аспекты пары ⭐️</h3>
        <p class="subtitle">Самые точные взаимосвязи между планетами партнёров.</p>
        <table>
          <thead>
            <tr>
              <th>Планета A</th>
              <th>Аспект</th>
              <th>Планета B</th>
              <th>Орб</th>
            </tr>
          </thead>
          <tbody>
            ${synastry.topAspects.map(aspectRow).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="section">
      <div class="keep-block">
        <h3>Полная таблица аспектов</h3>
        <table>
          <thead>
            <tr>
              <th>Планета A</th>
              <th>Аспект</th>
              <th>Планета B</th>
              <th>Орб</th>
            </tr>
          </thead>
          <tbody>
            ${synastry.aspects.map(aspectRow).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </section>
</body>
</html>
  `;
}
