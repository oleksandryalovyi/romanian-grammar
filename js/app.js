(function () {
  const sections = window.SECTIONS || [];
  const nav = document.getElementById('nav');
  const content = document.getElementById('content');

  // ---------- helpers ----------
  const norm = s => s.toLowerCase().trim().replace(/\s+/g, ' ').replace(/ş/g, 'ș').replace(/ţ/g, 'ț');
  const strip = s => norm(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
  const shuffle = arr => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  };
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };

  // ---------- sidebar ----------
  function renderNav(activeId) {
    nav.innerHTML = '';
    sections.forEach(s => {
      const b = el('button', 'nav-btn' + (s.id === activeId ? ' active' : ''));
      b.innerHTML = `<span class="t">${s.title}</span>` +
        (s.subtitle ? `<span class="s">${s.subtitle}</span>` : '');
      const best = store.get('best:' + s.id);
      if (best) b.innerHTML += `<span class="best">Найкращий результат: ${best}</span>`;
      b.onclick = () => { location.hash = `#${s.id}/theory`; };
      nav.appendChild(b);
    });
  }

  // ---------- section page ----------
  function renderSection(id, tab) {
    const s = sections.find(x => x.id === id) || sections[0];
    if (!s) { content.innerHTML = '<p>Розділів поки немає.</p>'; return; }
    tab = tab === 'tests' ? 'tests' : 'theory';
    renderNav(s.id);
    content.innerHTML = '';
    content.appendChild(el('h1', '', s.title));
    if (s.subtitle) content.appendChild(el('p', 'sub', s.subtitle));

    const tabs = el('div', 'tabs');
    [['theory', 'Теорія'], ['tests', 'Тести']].forEach(([key, label]) => {
      const t = el('button', 'tab' + (key === tab ? ' active' : ''), label);
      t.onclick = () => { location.hash = `#${s.id}/${key}`; };
      tabs.appendChild(t);
    });
    content.appendChild(tabs);

    const body = el('div');
    content.appendChild(body);
    if (tab === 'theory') body.innerHTML = s.theory;
    else renderTests(s, body);
    window.scrollTo(0, 0);
  }

  // ---------- tests ----------
  function renderTests(section, root) {
    const total = section.tests.length;
    let answered = 0, correct = 0;

    const bar = el('div', 'scorebar');
    const status = el('span');
    const reset = el('button', 'btn ghost', 'Почати знову');
    bar.append(status, reset);
    const list = el('div');
    const result = el('div', 'result');
    root.append(bar, list, result);

    function updateStatus() {
      status.innerHTML = `Відповіли: <b>${answered}/${total}</b> · Правильно: <b>${correct}</b>`;
      if (answered === total) {
        const pct = Math.round((correct / total) * 100);
        result.innerHTML = `Результат: <b>${correct} / ${total}</b> (${pct}%)`;
        const prev = store.get('best:' + section.id);
        const prevN = prev ? parseInt(prev, 10) : -1;
        if (correct > prevN) {
          store.set('best:' + section.id, `${correct}/${total}`);
          renderNav(section.id);
        }
      } else {
        result.innerHTML = '';
      }
    }

    function finish(card, ok, fbHtml) {
      answered++;
      if (ok) correct++;
      card.classList.add(ok ? 'correct' : 'wrong');
      const fb = el('div', 'fb', `<span class="verdict">${ok ? '✓ Правильно' : '✗ Неправильно'}</span> ${fbHtml || ''}`);
      card.appendChild(fb);
      updateStatus();
    }

    function build() {
      list.innerHTML = '';
      answered = 0; correct = 0;
      shuffle(section.tests).forEach((q, i) => {
        const card = el('div', 'q');
        card.appendChild(el('div', 'qn', `Питання ${i + 1}`));
        card.appendChild(el('div', 'qt', q.q));
        const explain = q.explain ? `<br>${q.explain}` : '';

        if (q.type === 'choice') {
          const box = el('div', 'opts');
          shuffle(q.options).forEach(opt => {
            const b = el('button', 'opt', opt);
            b.onclick = () => {
              box.querySelectorAll('button').forEach(x => {
                x.disabled = true;
                if (x.textContent === q.answer) x.classList.add('is-right');
              });
              const ok = opt === q.answer;
              if (!ok) b.classList.add('is-wrong');
              finish(card, ok, (ok ? '' : `Правильна відповідь: <span class="ro">${q.answer}</span>.`) + explain);
            };
            box.appendChild(b);
          });
          card.appendChild(box);
        } else {
          const row = el('div', 'inputrow');
          const input = el('input');
          input.type = 'text';
          input.placeholder = 'Твоя відповідь…';
          input.autocomplete = 'off';
          input.autocapitalize = 'off';
          input.spellcheck = false;
          const btn = el('button', 'btn', 'Перевірити');
          const check = () => {
            const val = input.value;
            if (!val.trim()) return;
            input.disabled = true; btn.disabled = true;
            const exact = q.answers.some(a => norm(a) === norm(val));
            const loose = q.answers.some(a => strip(a) === strip(val));
            const ok = exact || loose;
            let msg = '';
            if (ok && !exact) msg = `Майже ідеально — з діакритикою: <span class="ro">${q.answers[0]}</span>.`;
            if (!ok) msg = `Правильна відповідь: <span class="ro">${q.answers.join(' / ')}</span>.`;
            finish(card, ok, msg + explain);
          };
          btn.onclick = check;
          input.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
          row.append(input, btn);
          card.appendChild(row);
        }
        list.appendChild(card);
      });
      updateStatus();
    }

    reset.onclick = () => { build(); window.scrollTo(0, 0); };
    build();
  }

  // ---------- routing ----------
  function route() {
    const [id, tab] = location.hash.replace(/^#/, '').split('/');
    renderSection(id, tab);
  }
  window.addEventListener('hashchange', route);
  route();
})();
