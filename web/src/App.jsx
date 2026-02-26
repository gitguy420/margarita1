import React, { useEffect, useMemo, useState } from 'react';

const emptyPerson = {
  firstName: '',
  lastName: '',
  birthDate: '',
  birthTime: '',
  isTimeUnknown: false,
  region: '',
  city: ''
};
const HOUSE_SYSTEMS = [
  {
    value: 'whole_sign',
    label: 'Целый знак',
    description: 'Дом = знак. Самая стабильная и прозрачная система.'
  },
  {
    value: 'equal',
    label: 'Равнодомная',
    description: '12 равных домов по 30°. Удобна для сравнений.'
  },
  {
    value: 'solar',
    label: 'Солнечные дома',
    description: 'Точка отсчёта от знака Солнца, мягкий общий профиль.'
  }
];

function useRegions() {
  const [regions, setRegions] = useState([]);
  const [error, setError] = useState('');
  const apiBase = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetch(`${apiBase}/api/regions`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const text = await r.text();
        if (!text) throw new Error('Пустой ответ от сервера');
        return JSON.parse(text);
      })
      .then((data) => {
        if (data.error) return setError(data.error);
        setRegions(data);
      })
      .catch((e) => setError(`Ошибка загрузки регионов: ${e.message || e}`));
  }, []);

  return { regions, error };
}

function useCities(region) {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const apiBase = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    if (!region) {
      setCities([]);
      return;
    }
    setLoading(true);
    fetch(`${apiBase}/api/cities?region=${encodeURIComponent(region)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const text = await r.text();
        if (!text) return [];
        return JSON.parse(text);
      })
      .then((data) => {
        setCities(Array.isArray(data) ? data : []);
      })
      .catch(() => setCities([]))
      .finally(() => setLoading(false));
  }, [region]);

  return { cities, loading };
}

function PersonCard({ label, person, onChange, regions }) {
  const { cities, loading } = useCities(person.region);
  const ticketCode = label.includes('A') ? 'КАРТОЧКА 1' : 'КАРТОЧКА 2';

  return (
    <section className="card astro-card">
      <div className="astro-head">
        <div className="astro-route">
          <span className="astro-chip">{ticketCode}</span>
          <div className="astro-title">{label}</div>
        </div>
        <div className="astro-meta">
          <span>Синастрия</span>
          <span>Лунный поток</span>
        </div>
      </div>

      <div className="astro-divider" aria-hidden="true" />

      <div className="grid">
        <label>
          Имя
          <input
            value={person.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            placeholder="Анна"
            required
          />
        </label>
        <label>
          Фамилия
          <input
            value={person.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            placeholder="Соколова"
            required
          />
        </label>
        <label>
          Дата рождения
          <input
            type="date"
            value={person.birthDate}
            onChange={(e) => onChange({ birthDate: e.target.value })}
            required
          />
        </label>
        <label>
          Время рождения
          <input
            type="time"
            value={person.birthTime}
            onChange={(e) => onChange({ birthTime: e.target.value })}
            disabled={person.isTimeUnknown}
            required={!person.isTimeUnknown}
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={person.isTimeUnknown}
            onChange={(e) => onChange({ isTimeUnknown: e.target.checked })}
          />
          Время неизвестно (расчёт будет неполным)
        </label>
        <div className="hint">
          При неизвестном времени мы ставим 12:00 и убираем дома/асцендент.
        </div>
      </div>

      <div className="grid">
        <label>
          Область / Республика
          <select
            value={person.region}
            onChange={(e) => onChange({ region: e.target.value, city: '' })}
            required
          >
            <option value="">Выберите регион</option>
            {regions.map((r) => (
              <option key={r.name} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Город
          <select
            className={loading ? 'is-loading' : ''}
            value={person.city}
            onChange={(e) => onChange({ city: e.target.value })}
            required
          >
            <option value="">{loading ? 'Загрузка...' : 'Выберите город'}</option>
            {cities.map((c) => (
              <option key={`${c.name}-${c.lat}`} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}

function HowItWorksPage() {
  return (
    <section className="card info-page">
      <h2>Как это работает</h2>
      <ol>
        <li>Вы вводите данные рождения двух людей: дату, время и место.</li>
        <li>Приложение автоматически определяет координаты выбранного города.</li>
        <li>Сервер строит натальные карты и межкартные аспекты (синастрию).</li>
        <li>По найденным аспектам формируется текстовое описание совместимости.</li>
        <li>Итог собирается в PDF и сразу отдается вам в скачивание.</li>
      </ol>
    </section>
  );
}

function EvidencePage() {
  return (
    <section className="card info-page">
      <h2>Почему расчёт можно проверить</h2>
      <ul>
        <li>Используется библиотека `astronomy-engine` (MIT), а не случайная генерация.</li>
        <li>Координаты городов берутся из локальной таблицы, чтобы расчёт опирался на реальные точки.</li>
        <li>Одинаковые входные данные дают одинаковый результат на сервере.</li>
        <li>
          Есть служебный endpoint `GET /api/status`, который показывает, что API и база городов загружены.
        </li>
        <li>PDF формируется сервером через `puppeteer`, поэтому результат воспроизводим и не зависит от телефона.</li>
      </ul>
    </section>
  );
}

function InfoPage() {
  return (
    <section className="card info-page">
      <h2>Информация</h2>
      <p>
        Этот Mini App помогает получить структурированный синастрический отчёт по двум людям. Он не заменяет
        консультацию специалиста и предназначен как аналитический инструмент для личного использования.
      </p>
      <p>
        Если время рождения неизвестно, расчёт выполняется по дневному времени и интерпретация становится менее
        точной для домов и осей карты.
      </p>
    </section>
  );
}

export default function App() {
  const { regions, error } = useRegions();
  const [partnerA, setPartnerA] = useState(emptyPerson);
  const [partnerB, setPartnerB] = useState(emptyPerson);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [page, setPage] = useState('calculator');
  const [houseSystem, setHouseSystem] = useState('whole_sign');

  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  const isReady = useMemo(() => {
    const isValid = (p) =>
      p.firstName &&
      p.lastName &&
      p.birthDate &&
      (p.isTimeUnknown || p.birthTime) &&
      p.region &&
      p.city;
    return isValid(partnerA) && isValid(partnerB);
  }, [partnerA, partnerB]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isReady) {
      setMessage('Заполните все поля для обоих партнёров, включая дату, время/флаг "время неизвестно", регион и город.');
      return;
    }

    setLoading(true);
    setMessage('Создаём отчёт… это может занять до 20 секунд.');

    const payload = (p) => ({
      firstName: p.firstName,
      lastName: p.lastName,
      birthDate: p.birthDate,
      birthTime: p.birthTime,
      isTimeUnknown: p.isTimeUnknown,
      location: {
        region: p.region,
        city: p.city
      }
    });
    const body = JSON.stringify({
      partnerA: payload(partnerA),
      partnerB: payload(partnerB),
      houseSystem
    });

    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const tg = window.Telegram?.WebApp;
      const isMiniApp = Boolean(tg);

      if (isMiniApp) {
        const linkRes = await fetch(`${apiBase}/api/report-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body
        });

        if (!linkRes.ok) {
          const data = await linkRes.json().catch(() => ({}));
          setMessage(data.error || 'Ошибка генерации отчёта');
          return;
        }

        const data = await linkRes.json();
        if (!data.url) {
          setMessage('Не удалось получить ссылку на PDF');
          return;
        }
        tg.openLink(data.url);
        setMessage('PDF открыт. В браузере можно сохранить файл.');
        return;
      }

      const res = await fetch(`${apiBase}/api/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error || 'Ошибка генерации отчёта');
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'synastry-report.pdf';
      a.click();
      URL.revokeObjectURL(url);
      setMessage('Готово! Отчёт скачан.');
    } catch (_err) {
      setMessage('Ошибка сети. Проверьте соединение и попробуйте снова.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-stars" aria-hidden="true" />
        <div className="hero-layout">
          <div className="hero-copy">
            <div className="sparkle">✦</div>
            <h1>Лунный Поток</h1>
            <p>Синастрия, которая раскрывает сильные стороны пары и даёт нежные подсказки ❤️</p>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="tarot-fan">
              <span className="tarot tarot-1" />
              <span className="tarot tarot-2" />
              <span className="tarot tarot-3" />
            </div>
          </div>
        </div>
        {error && <div className="error">{error}</div>}
      </header>

      <nav className="top-nav">
        <button
          type="button"
          className={`nav-pill ${page === 'calculator' ? 'active' : ''}`}
          onClick={() => setPage('calculator')}
        >
          Расчёт
        </button>
        <button type="button" className={`nav-pill ${page === 'how' ? 'active' : ''}`} onClick={() => setPage('how')}>
          Как это работает
        </button>
        <button
          type="button"
          className={`nav-pill ${page === 'facts' ? 'active' : ''}`}
          onClick={() => setPage('facts')}
        >
          Факты
        </button>
        <button
          type="button"
          className={`nav-pill ${page === 'info' ? 'active' : ''}`}
          onClick={() => setPage('info')}
        >
          Информация
        </button>
      </nav>

      {page === 'calculator' && (
        <form className="form" onSubmit={handleSubmit}>
          <PersonCard
            label="Партнёр A"
            person={partnerA}
            onChange={(patch) => setPartnerA((p) => ({ ...p, ...patch }))}
            regions={regions}
          />
          <PersonCard
            label="Партнёр B"
            person={partnerB}
            onChange={(patch) => setPartnerB((p) => ({ ...p, ...patch }))}
            regions={regions}
          />

          <section className="card house-systems-card">
            <h3>Система расчёта домов</h3>
            <div className="house-grid">
              {HOUSE_SYSTEMS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={`house-option ${houseSystem === item.value ? 'active' : ''}`}
                  onClick={() => setHouseSystem(item.value)}
                >
                  <span className="house-option-title">{item.label}</span>
                  <span className="house-option-desc">{item.description}</span>
                </button>
              ))}
            </div>
            <div className="hint">При неизвестном времени дома не рассчитываются независимо от выбранной системы.</div>
          </section>

          <div className="submit">
            <button className={loading ? 'is-busy' : ''} type="submit" disabled={loading}>
              <span className="btn-core">{loading ? 'Рейс формируется' : 'Получить PDF отчёт'}</span>
              <span className="btn-doc" aria-hidden="true">
                📄
              </span>
            </button>
            {message && <div className="message">{message}</div>}
          </div>
        </form>
      )}

      {page === 'how' && <HowItWorksPage />}
      {page === 'facts' && <EvidencePage />}
      {page === 'info' && <InfoPage />}
    </div>
  );
}
