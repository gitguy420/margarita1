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
    <section className="card ticket-card">
      <div className="ticket-head">
        <div className="ticket-route">
          <span className="ticket-chip">{ticketCode}</span>
          <div className="ticket-title">{label}</div>
        </div>
        <div className="ticket-meta">
          <span>Синастрия</span>
          <span>Лунный поток</span>
        </div>
      </div>

      <div className="ticket-divider" aria-hidden="true" />

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

export default function App() {
  const { regions, error } = useRegions();
  const [partnerA, setPartnerA] = useState(emptyPerson);
  const [partnerB, setPartnerB] = useState(emptyPerson);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
    if (!isReady) return;

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

    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiBase}/api/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerA: payload(partnerA),
          partnerB: payload(partnerB)
        })
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
        <div className="sparkle">✨</div>
        <h1>Маргарита</h1>
        <p>Синастрия, которая раскрывает сильные стороны пары и даёт нежные подсказки ❤️</p>
        {error && <div className="error">{error}</div>}
      </header>

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

        <div className="submit">
          <button className={loading ? 'is-busy' : ''} type="submit" disabled={!isReady || loading}>
            <span className="btn-core">{loading ? 'Рейс формируется' : 'Получить PDF отчёт'}</span>
            <span className="btn-plane" aria-hidden="true">
              ✈
            </span>
          </button>
          {message && <div className="message">{message}</div>}
        </div>
      </form>
    </div>
  );
}
