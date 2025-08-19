import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, Brain, Award, X, Sparkles } from "lucide-react";

/**
 * ⚖️ Право на виїзд — Neo 2050 (повна гра)
 * Відновлено повний робочий компонент з анімаціями, вагами Феміди, звуками та салютом.
 * Рівні: Студент, Юрист, Суддя — по 3 запитання; у кожного 1 право на помилку.
 * Варіанти відповідей автоматично міняються місцями на кожному запитанні.
 */

// ====== Питання по рівнях ======
const LEVELS = [
  {
    name: "🧑‍🎓 Рівень: Студент",
    mistakesAllowed: 1,
    hintPerLevel: false,
    questions: [
      {
        q: "Чи має громадянин України право виїхати за кордон?",
        aTrue: "Так, це гарантовано Конституцією України.",
        aFalse: "Ні, ніколи.",
        correctIsTrue: true,
        hint: "Свобода пересування включає право залишати країну (обмеження можливі лише законом).",
      },
      {
        q: "Який документ необхідний для перетину державного кордону?",
        aTrue: "Паспорт громадянина України для виїзду за кордон.",
        aFalse: "Водійське посвідчення.",
        correctIsTrue: true,
        hint: "Основний документ — закордонний паспорт.",
      },
      {
        q: "Чи можна виїхати за кордон під час воєнного стану всім громадянам?",
        aTrue: "Ні, є обмеження для певних категорій громадян.",
        aFalse: "Так, усі можуть виїхати без обмежень.",
        correctIsTrue: true,
        hint: "У воєнний час діють спеціальні виключення та заборони.",
      },
    ],
  },
  {
    name: "⚖️ Рівень: Юрист",
    mistakesAllowed: 1,
    hintPerLevel: true,
    questions: [
      {
        q: "Чи може державний службовець виїхати за кордон під час воєнного стану?",
        aTrue: "Так, але лише за умови наявності відстрочки та необхідних документів.",
        aFalse: "Так, без будь-яких обмежень.",
        correctIsTrue: true,
        hint: "Навіть з відстрочкою потрібні підтвердні документи.",
      },
      {
        q: "Які документи вимагають на кордоні від держслужбовця, що має відстрочку?",
        aTrue: "Наказ про відрядження (або офіційний лист від організації), паспорт громадянина України для виїзду за кордон, військовий обліковий документ, підстава для відстрочки та документ, що підтверджує її наявність.",
        aFalse: "Паспорт громадянина України для виїзду за кордон",
        correctIsTrue: true,
        hint: "Пакет документів має бути повним і актуальним.",
      },
      {
        q: "Хто приймає остаточне рішення щодо пропуску держслужбовця за кордон?",
        aTrue: "Прикордонна служба України.",
        aFalse: "Роботодавець.",
        correctIsTrue: true,
        hint: "Остаточний контроль — за ДПСУ.",
      },
    ],
  },
  {
    name: "👩‍⚖️ Рівень: Суддя",
    mistakesAllowed: 1,
    hintPerLevel: true,
    questions: [
      {
        q: "Чи є можливість оскаржити відмову у виїзді?",
        aTrue: "Так, у судовому порядку або через скаргу до Держприкордонслужби",
        aFalse: "Ні, рішення прикордонника остаточне й не підлягає оскарженню.",
        correctIsTrue: true,
        hint: "Так",
      },
      {
        q: "Хто може оскаржити рішення прикордонної служби у суді?",
        aTrue: "Будь-який громадянин, якому відмовили у виїзді",
        aFalse: "Лише керівник державного органу.",
        correctIsTrue: true,
        hint: "Будь-який громадянин",
      },
      {
        q: "Чи може суд скасувати відмову у виїзді та зобов’язати прикордонну службу пропустити громадянина?",
        aTrue: "Так, якщо відмова була неправомірною.",
        aFalse: "Ні, суд лише дає рекомендацію.",
        correctIsTrue: true,
        hint: "Так",
      },
    ],
  },
];

// ====== Простий модуль звуків (WebAudio) ======
function useSfx() {
  const ctxRef = useRef(null);
  const ensure = () => {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) ctxRef.current = new Ctx();
    }
    return ctxRef.current;
  };
  const beep = (f = 440, d = 0.12, type = "sine", gain = 0.03) => {
    const ctx = ensure();
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = f;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.value = gain;
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + d);
    o.stop(ctx.currentTime + d);
  };
  return {
    click: () => beep(520, 0.04, "square", 0.02),
    correct: () => { beep(660, 0.07, "triangle", 0.03); setTimeout(() => beep(880, 0.08, "triangle", 0.03), 90); },
    wrong: () => { beep(220, 0.14, "sawtooth", 0.04); setTimeout(() => beep(180, 0.16, "sawtooth", 0.03), 120); },
    levelup: () => { beep(740, 0.09); setTimeout(() => beep(880, 0.1), 110); },
    gameover: () => { beep(200, 0.22, "sawtooth", 0.04); setTimeout(() => beep(160, 0.25, "sawtooth", 0.035), 160); },
    win: () => { beep(660, 0.1); setTimeout(() => beep(880, 0.11), 120); setTimeout(() => beep(990, 0.12), 260); },
  };
}

// ====== Конфеті при перемозі ======
function Confetti({ count = 140 }) {
  const pieces = useMemo(() => Array.from({ length: count }).map(() => ({
    left: Math.random() * 100,
    size: 5 + Math.random() * 8,
    rot: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 180),
    delay: Math.random() * 0.4,
    dur: 2.2 + Math.random() * 1.6,
    hue: Math.floor(Math.random() * 360),
  })), [count]);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <motion.div key={i}
          initial={{ y: -40, opacity: 0, rotate: 0 }}
          animate={{ y: 700, opacity: 1, rotate: p.rot }}
          transition={{ duration: p.dur, delay: p.delay, ease: "easeOut" }}
          style={{ left: `${p.left}%`, top: 0, width: p.size, height: p.size, borderRadius: 2, background: `hsl(${p.hue} 90% 60%)` }}
          className="absolute"
        />
      ))}
    </div>
  );
}

export default function FullGame() {
  const sfx = useSfx();

  const [level, setLevel] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [gameOver, setGameOver] = useState(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [tilt, setTilt] = useState(0);
  const [drop, setDrop] = useState(null); // { side, ok, key }
  const [shake, setShake] = useState(false);
  const [leftIsTrue, setLeftIsTrue] = useState(Math.random() < 0.5); // випадкова позиція правильного варіанта

  const L = LEVELS[level];
  const item = L.questions[qIndex];

  const triggerShake = (ms = 1200) => { setShake(true); setTimeout(() => setShake(false), ms); };

  // Перемішувати сторони на кожному новому питанні/рівні
  useEffect(() => { setLeftIsTrue(Math.random() < 0.5); }, [level, qIndex]);

  function nextQ() {
    if (qIndex + 1 < L.questions.length) {
      setQIndex(qIndex + 1);
    } else if (level + 1 < LEVELS.length) {
      sfx.levelup();
      triggerShake();
      setShowLevelUp(true);
      setTimeout(() => {
        setLevel(level + 1);
        setQIndex(0);
        setMistakes(0);
        setHintUsed(false);
        setShowLevelUp(false);
      }, 1300);
    } else {
      setFinished(true);
    }
  }

  function pickSide(side) {
    if (finished || showLevelUp || gameOver) return;
    sfx.click();

    const choiceIsTrue = side === 'left' ? leftIsTrue : !leftIsTrue;
    const isCorrect = choiceIsTrue === item.correctIsTrue;
    const dir = side === 'right' ? 1 : -1;

    setTilt(dir * (isCorrect ? 10 : 18));
    setDrop({ side, ok: isCorrect, key: `${level}-${qIndex}-${Date.now()}` });

    setTimeout(() => {
      if (isCorrect) {
        sfx.correct();
        setScore(s => s + 1);
      } else {
        sfx.wrong();
        const m = mistakes + 1;
        setMistakes(m);
        if (m >= L.mistakesAllowed) {
          triggerShake();
          setGameOver(`Перевищено ліміт помилок (${L.mistakesAllowed}) на рівні`);
          setFinished(true);
          return;
        }
      }
      setTilt(0); setDrop(null);
      nextQ();
    }, 780);
  }

  function openHint() {
    if (!L.hintPerLevel || hintUsed || finished || gameOver || showLevelUp) return;
    setHintUsed(true); setHintOpen(true);
  }

  function resetGame() {
    setLevel(0); setQIndex(0); setMistakes(0); setScore(0); setFinished(false); setGameOver(null);
    setShowLevelUp(false); setHintUsed(false); setHintOpen(false); setTilt(0); setDrop(null); setShake(false);
    setLeftIsTrue(Math.random() < 0.5);
  }

  // Звук на фінал
  useEffect(() => {
    if (finished) {
      if (gameOver) sfx.gameover(); else sfx.win();
    }
  }, [finished]);

  // Тексти для карток з урахуванням перемішування
  const leftText = leftIsTrue ? item.aTrue : item.aFalse;
  const rightText = leftIsTrue ? item.aFalse : item.aTrue;

  return (
    <div className="min-h-screen relative overflow-hidden bg-black text-white flex items-center justify-center p-4">
      {/* Фон 2050 */}
      <motion.div className="absolute inset-0 opacity-40" animate={{ background: [
        "radial-gradient(1200px 600px at 20% 10%, rgba(0,255,200,.25), transparent 60%), radial-gradient(800px 400px at 80% 90%, rgba(120,0,255,.25), transparent 60%)",
        "radial-gradient(1200px 600px at 30% 20%, rgba(0,255,200,.25), transparent 60%), radial-gradient(800px 400px at 70% 80%, rgba(120,0,255,.25), transparent 60%)",
      ]}} transition={{ duration: 6, repeat: Infinity, repeatType: 'reverse' }} />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] bg-[size:24px_24px]" />

      <motion.div className="relative w-full max-w-4xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,255,200,.15)] p-6 md:p-8"
        animate={shake ? { x: [0,-12,12,-10,10,-6,6,0] } : { x: 0 }} transition={{ duration: 1.1 }}>
        {/* HUD */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-cyan-300" /><div className="text-cyan-200/90 font-semibold tracking-wide">Право на виїзд</div></div>
          <div className="text-sm text-slate-200/80">Очки: <span className="text-white font-bold">{score}</span> • Помилки: <span className="text-red-300 font-bold">{mistakes}/{L.mistakesAllowed}</span> • Підказка: {L.hintPerLevel ? (hintUsed ? "0/1" : "1/1") : "—"}</div>
        </div>

        {/* Питання */}
        <AnimatePresence mode="wait">
          {!showLevelUp && !finished && (
            <motion.div key={`q-${level}-${qIndex}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5">
              <div className="text-xs uppercase tracking-wide text-cyan-300/90 mb-1">{LEVELS[level].name.toUpperCase()}</div>
              <p className="text-lg md:text-xl font-medium text-white/90 text-center">{item.q}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ваги Феміди */}
        <div className="relative h-64 md:h-72 mb-6">
          <motion.div className="absolute left-1/2 -translate-x-1/2 top-4 w-[22rem] md:w-[28rem]" animate={{ rotate: tilt }} transition={{ type: "spring", stiffness: 80, damping: 12 }}>
            <div className="h-[6px] rounded-full bg-gradient-to-r from-cyan-300 via-white to-fuchsia-400 shadow-[0_0_20px_rgba(0,255,255,.5)]" />
            <div className="flex justify-between">
              {["left","right"].map(side => (
                <div key={side} className="relative w-32 md:w-36 h-40">
                  <div className="absolute left-1/2 -translate-x-1/2 h-24 w-[3px] bg-gradient-to-b from-cyan-300 to-fuchsia-400 shadow-[0_0_10px_rgba(255,0,255,.4)]" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 md:w-36 h-8 rounded-b-[20px] bg-white/15 border border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,.3),0_0_20px_rgba(0,255,200,.25)]" />
                </div>
              ))}
            </div>
          </motion.div>
          <div className="absolute left-1/2 -translate-x-1/2 top-0 text-cyan-200 drop-shadow-[0_0_10px_rgba(0,255,255,.6)]"><Scale className="w-10 h-10 opacity-90" /></div>

          {/* Жетон Вірно/Невірно */}
          <AnimatePresence>
            {drop && (
              <motion.div key={drop.key} initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 96, x: drop.side === 'left' ? -112 : 112 }} exit={{ opacity: 0 }} transition={{ duration: 0.85, ease: "easeInOut" }} className={`absolute left-1/2 top-8 -translate-x-1/2 px-3 py-1 rounded-full text-sm font-bold border ${drop.ok ? 'bg-emerald-400/90 text-black border-emerald-200' : 'bg-rose-400/90 text-black border-rose-200'}`}>{drop.ok ? 'Вірно' : 'Невірно'}</motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ДВА ТЕКСТОВІ ВАРІАНТИ ВІДПОВІДІ */}
        {!showLevelUp && !finished && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-sm text-slate-300/80">Обери правильний варіант</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {/* Ліва картка */}
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => pickSide('left')} className="w-full text-left p-4 rounded-2xl bg-white/6 border border-white/12 hover:bg-white/10 transition">
                <div className="text-white/90 text-base leading-relaxed">{leftText}</div>
              </motion.button>
              {/* Права картка */}
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => pickSide('right')} className="w-full text-left p-4 rounded-2xl bg-white/6 border border-white/12 hover:bg-white/10 transition">
                <div className="text-white/90 text-base leading-relaxed">{rightText}</div>
              </motion.button>
            </div>

            {/* Кнопка підказки — лише на рівнях з підказками */}
            {L.hintPerLevel && (
              <button onClick={openHint} disabled={hintUsed} className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 border ${hintUsed ? 'opacity-40 border-white/20' : 'border-cyan-300 text-cyan-200 hover:bg-cyan-300/10'}`}>
                <Brain className="w-4 h-4" /> AI‑підказка
              </button>
            )}
          </div>
        )}

        {/* Модальне вікно підказки */}
        <AnimatePresence>
          {hintOpen && (
            <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center">
              <motion.div initial={{ scale: .9 }} animate={{ scale: 1 }} className="max-w-lg w-[90%] bg-white/10 border border-white/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2 text-cyan-200"><Brain className="w-5 h-5" /><span className="font-semibold">AI‑аналіз</span></div>
                <div className="text-white/90 text-base leading-relaxed">{item.hint}</div>
                <button onClick={() => setHintOpen(false)} className="mt-4 px-4 py-2 rounded-xl bg-cyan-300 text-black font-semibold">Зрозуміло</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Екран переходу рівня */}
        <AnimatePresence>
          {showLevelUp && (
            <motion.div key="lvl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
              <motion.div initial={{ scale: .9 }} animate={{ scale: 1 }} className="text-4xl font-extrabold text-emerald-300 mb-2">Вітаємо!</motion.div>
              <div className="text-lg text-white/90">Ви перейшли на наступний рівень</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Фінальні екрани */}
        <AnimatePresence>
          {finished && gameOver && (
            <motion.div key="over" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-rose-900/85 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
              <X className="w-14 h-14 text-rose-200 mb-3" />
              <div className="text-3xl font-extrabold text-white mb-1">Гра програна</div>
              <div className="text-slate-100 mb-6">{gameOver}</div>
              <button onClick={resetGame} className="px-6 py-3 bg-white text-black rounded-2xl font-semibold">Почати знову</button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {finished && !gameOver && (
            <motion.div key="win" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-emerald-900/70 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
              <Award className="w-14 h-14 text-emerald-200 mb-3" />
              <div className="text-3xl font-extrabold text-white mb-1">Вітаємо!</div>
              <div className="text-slate-100 mb-2">Ви успішно завершили всі рівні.</div>
              <div className="text-slate-200 mb-6">Підсумок: {score} правильних відповідей</div>
              {/* Конфеті */}
              <Confetti count={150} />
              <button onClick={resetGame} className="relative z-10 px-6 py-3 bg-white text-black rounded-2xl font-semibold">Зіграти ще</button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
