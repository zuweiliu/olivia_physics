/* ══════════════════════════════════════════════════════════
   Olivia's Physics Lessons — Shared Lesson Engine
   ══════════════════════════════════════════════════════════
   
   EXPECTS these globals to be defined BEFORE this script loads:
   
   Required:
     window.ccQuestions  — Array of concept-check questions
     window.quizData     — Array of quiz questions (mc + calc)
     window.hwSteps      — Object mapping hw IDs to step arrays
   
   Optional:
     window.practiceInputs — Array of [inputId, functionName] for Enter key wiring
     window.practiceHints  — Array of element IDs to inject expression hints into
   ══════════════════════════════════════════════════════════ */

// ── Stars background ──────────────────────────────────────
(function() {
  var sc = document.getElementById('stars');
  if (!sc) return;
  var sctx = sc.getContext('2d');
  var stars = [];
  function initStars() {
    sc.width = window.innerWidth; sc.height = window.innerHeight;
    stars = Array.from({length:200}, function() {
      return {
        x: Math.random()*sc.width, y: Math.random()*sc.height,
        r: Math.random()*1.4+0.3, a: Math.random(), da: (Math.random()-0.5)*0.005
      };
    });
  }
  function drawStars() {
    sctx.clearRect(0,0,sc.width,sc.height);
    stars.forEach(function(s) {
      s.a = Math.max(0.1, Math.min(1, s.a+s.da));
      if (s.a<=0.1||s.a>=1) s.da*=-1;
      sctx.beginPath(); sctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      sctx.fillStyle = 'rgba(255,255,255,'+s.a+')'; sctx.fill();
    });
    requestAnimationFrame(drawStars);
  }
  initStars(); drawStars();
  window.addEventListener('resize', initStars);
})();

// ── Section navigation & scoring ──────────────────────────
var currentSection = 0;
var sections = document.querySelectorAll('.section');
var dots = document.querySelectorAll('.step-dot');
var totalScore = 0;
var sectionDone = [];
for (var _i = 0; _i < sections.length; _i++) sectionDone.push(false);

window.goTo = function(n) {
  if (n < 0 || n >= sections.length) return;
  sections[currentSection].classList.remove('active');
  dots[currentSection].classList.remove('active');
  if (!dots[currentSection].classList.contains('done') && sectionDone[currentSection])
    dots[currentSection].classList.add('done');
  currentSection = n;
  sections[n].classList.add('active');
  dots[n].classList.add('active');
  dots[n].classList.remove('done');
  window.scrollTo({top:0, behavior:'smooth'});
  // Update final score display if on last section
  var fsd = document.getElementById('final-score-display');
  if (fsd && n === sections.length - 1) fsd.textContent = totalScore + ' pts';
  // Re-render MathJax
  setTimeout(function() { if (window.MathJax) MathJax.typesetPromise(); }, 100);
};

window.addScore = function(pts) {
  totalScore += pts;
  var badge = document.getElementById('score-badge');
  if (badge) badge.textContent = '⭐ ' + totalScore + ' pts';
};

// ── Expression evaluator ──────────────────────────────────
window.parseAnswer = function(raw) {
  if (raw == null) return NaN;
  var s0 = String(raw).trim();
  if (s0 === '') return NaN;
  if (/[;=\[\]{}\\`$@]/.test(s0)) return NaN;
  if (/\b(window|document|eval|fetch|import|require|process|global|alert|this)\b/i.test(s0)) return NaN;
  var s = s0;
  s = s.replace(/\bME\b/g,  '(5.98e24)');
  s = s.replace(/\bRE\b/g,  '(6.37e6)');
  s = s.replace(/\bMm\b/g,  '(7.4e22)');
  s = s.replace(/\bRm\b/g,  '(1.74e6)');
  s = s.replace(/\bG\b/g,   '(6.674e-11)');
  s = s.replace(/\bg\b/g,   '9.80');
  s = s.replace(/\bsqrt\b/g,'Math.sqrt');
  s = s.replace(/\bpi\b/gi, 'Math.PI');
  s = s.replace(/\^/g,      '**');
  try {
    var result = Function('"use strict"; return (' + s + ')')();
    return (typeof result === 'number' && isFinite(result)) ? result : NaN;
  } catch(e) { return NaN; }
};

var EXPR_HINT = '<span style="font-size:0.78rem;color:var(--muted);margin-top:4px;display:block;">\u270f\ufe0f You can type expressions: <code style="color:var(--accent2);">G, ME, RE, Mm, Rm, g, sqrt(), ^</code></span>';
window.EXPR_HINT = EXPR_HINT;

// ── Step reveal ───────────────────────────────────────────
window.revealStep = function(id) {
  var el = document.getElementById(id);
  if (el) el.classList.add('visible');
  if (window.MathJax) MathJax.typesetPromise();
};

// ── Concept Check builder ─────────────────────────────────
(function() {
  var ccQuestions = window.ccQuestions || [];
  if (!ccQuestions.length) return;
  var ccAnswered = [];
  var ccCorrect = 0;
  for (var i = 0; i < ccQuestions.length; i++) ccAnswered.push(false);

  function buildCC() {
    var cont = document.getElementById('cc-container');
    if (!cont) return;
    cont.innerHTML = '';
    ccQuestions.forEach(function(q, i) {
      var div = document.createElement('div');
      div.className = 'cc-q'; div.id = 'cc-q' + i;
      div.innerHTML = '<p>Q' + (i+1) + '. ' + q.q + '</p>' +
        '<div class="options">' +
        q.opts.map(function(o, j) {
          return '<button class="option-btn" onclick="answerCC(' + i + ',' + j + ',this)">' +
            String.fromCharCode(65+j) + '. ' + o + '</button>';
        }).join('') +
        '</div>' +
        '<div id="cc-exp-' + i + '" class="feedback" style="margin-top:8px;"></div>';
      cont.appendChild(div);
    });
  }

  window.answerCC = function(qi, chosen, btn) {
    if (ccAnswered[qi]) return;
    ccAnswered[qi] = true;
    var q = ccQuestions[qi];
    var btns = document.querySelectorAll('#cc-q' + qi + ' .option-btn');
    btns.forEach(function(b, j) {
      b.disabled = true;
      if (j === q.ans) b.classList.add('correct');
      else if (j === chosen) b.classList.add('wrong');
    });
    var expEl = document.getElementById('cc-exp-' + qi);
    if (chosen === q.ans) {
      ccCorrect++; window.addScore(5);
      expEl.className = 'feedback ok show'; expEl.textContent = q.explain;
    } else {
      expEl.className = 'feedback bad show'; expEl.textContent = '\u274c Not quite. ' + q.explain;
    }
    if (window.MathJax) MathJax.typesetPromise();
    checkCCDone();
  };

  function checkCCDone() {
    if (!ccAnswered.every(Boolean)) return;
    sectionDone[1] = true;
    var resDiv = document.getElementById('cc-result');
    if (!resDiv) return;
    resDiv.style.display = 'block';
    var titleEl = document.getElementById('cc-result-title');
    if (titleEl) titleEl.textContent = 'You got ' + ccCorrect + '/' + ccQuestions.length + ' correct!';
    var msgs = [
      'Keep reviewing the concepts and try again!',
      'Good start! Review the ones you missed.',
      'Nice work! You have a solid understanding.',
      'Perfect score! You\'re a gravity expert! \ud83d\ude80'
    ];
    var msgEl = document.getElementById('cc-result-msg');
    if (msgEl) msgEl.textContent = msgs[Math.min(ccCorrect, msgs.length - 1)] || msgs[msgs.length - 1];
    resDiv.className = ccCorrect >= (ccQuestions.length - 1) ? 'card green' : 'card amber';
    var nextBtn = document.getElementById('cc-next-btn');
    if (nextBtn) nextBtn.disabled = false;
  }

  buildCC();
})();

// ── Quiz builder ──────────────────────────────────────────
(function() {
  var quizData = window.quizData || [];
  if (!quizData.length) return;
  var quizAnswers = new Array(quizData.length).fill(null);
  var quizScore = 0;

  function buildQuiz() {
    var cont = document.getElementById('quiz-container');
    if (!cont) return;
    cont.innerHTML = '';
    quizData.forEach(function(q, i) {
      var div = document.createElement('div');
      div.className = 'card'; div.id = 'quiz-q' + i;
      var inner = '<div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:12px;">' +
        '<div style="background:var(--accent);color:#fff;border-radius:8px;padding:3px 10px;font-weight:700;font-size:0.85rem;flex-shrink:0;">Q' + (i+1) + '</div>' +
        '<p style="color:var(--text);font-weight:500;margin:0;">' + q.q + '</p></div>';
      if (q.type === 'mc') {
        inner += '<div class="options">' + q.opts.map(function(o, j) {
          return '<button class="option-btn" onclick="answerQuiz(' + i + ',' + j + ',this)">' +
            String.fromCharCode(65+j) + '. ' + o + '</button>';
        }).join('') + '</div>';
      } else {
        inner += '<div class="input-row">' +
          '<label>Answer (' + q.unit + '):</label>' +
          '<input type="text" id="qi-' + i + '" placeholder="number or expression" onkeydown="if(event.key===\'Enter\')answerCalcQuiz(' + i + ')">' +
          '<button class="btn btn-primary" style="padding:9px 16px;font-size:0.85rem;" onclick="answerCalcQuiz(' + i + ')">Check \u2713</button>' +
          '<button class="btn btn-secondary" style="padding:9px 14px;font-size:0.82rem;" onclick="showQuizHint(' + i + ')">Hint \ud83d\udca1</button>' +
          '</div>' + EXPR_HINT +
          '<div id="qi-hint-' + i + '" class="step-block"></div>';
      }
      inner += '<div id="qfb-' + i + '" class="feedback" style="margin-top:10px;"></div>';
      div.innerHTML = inner;
      cont.appendChild(div);
    });
    if (window.MathJax) MathJax.typesetPromise();
  }

  window.answerQuiz = function(qi, chosen, btn) {
    if (quizAnswers[qi] !== null) return;
    quizAnswers[qi] = chosen;
    var q = quizData[qi];
    var btns = document.querySelectorAll('#quiz-q' + qi + ' .option-btn');
    btns.forEach(function(b, j) {
      b.disabled = true;
      if (j === q.ans) b.classList.add('correct');
      else if (j === chosen) b.classList.add('wrong');
    });
    var fb = document.getElementById('qfb-' + qi);
    if (chosen === q.ans) {
      quizScore++; window.addScore(10);
      fb.className = 'feedback ok show'; fb.textContent = '\u2705 ' + q.explain;
    } else {
      fb.className = 'feedback bad show'; fb.textContent = '\u274c ' + q.explain;
    }
    checkQuizDone();
  };

  window.answerCalcQuiz = function(qi) {
    if (quizAnswers[qi] !== null) return;
    var inp = document.getElementById('qi-' + qi);
    var ans = window.parseAnswer(inp.value);
    var q = quizData[qi];
    var fb = document.getElementById('qfb-' + qi);
    if (isNaN(ans)) { fb.className = 'feedback bad show'; fb.textContent = 'Invalid expression. Try a number or formula.'; return; }
    quizAnswers[qi] = ans;
    inp.disabled = true;
    if (Math.abs(ans - q.answer) / Math.abs(q.answer) < q.tolerance) {
      inp.className = 'correct-ans'; quizScore++; window.addScore(10);
      fb.className = 'feedback ok show'; fb.textContent = '\u2705 ' + q.explain;
    } else {
      inp.className = 'wrong-ans';
      fb.className = 'feedback bad show'; fb.textContent = '\u274c ' + q.explain;
    }
    checkQuizDone();
  };

  window.showQuizHint = function(qi) {
    var h = document.getElementById('qi-hint-' + qi);
    if (h) { h.classList.add('visible'); h.innerHTML = '<p style="font-size:0.85rem;color:var(--muted);">\ud83d\udca1 ' + quizData[qi].hint + '</p>'; }
  };

  function checkQuizDone() {
    if (!quizAnswers.every(function(a) { return a !== null; })) return;
    sectionDone[sections.length - 2] = true; // quiz is second-to-last section
    var res = document.getElementById('quiz-result');
    if (!res) return;
    res.style.display = 'block';
    var numEl = document.getElementById('quiz-score-num');
    var denEl = document.getElementById('quiz-score-den');
    if (numEl) numEl.textContent = quizScore;
    if (denEl) denEl.textContent = '/ ' + quizData.length;
    var titles = ['Keep studying!','Not bad!','Good job!','Great work!','Almost perfect!','Excellent!','\ud83c\udfc6 Perfect Score!'];
    var titleEl = document.getElementById('quiz-result-title');
    if (titleEl) titleEl.textContent = titles[Math.min(quizScore, titles.length - 1)];
    var pct = Math.round(quizScore / quizData.length * 100);
    var msgEl = document.getElementById('quiz-result-msg');
    if (msgEl) msgEl.textContent = 'You answered ' + quizScore + ' out of ' + quizData.length +
      ' correctly (' + pct + '%). ' + (pct >= 80 ? 'You\'re ready for the homework!' : 'Review the worked example and try again!');
    var nextBtn = document.getElementById('quiz-next-btn');
    if (nextBtn) nextBtn.disabled = false;
    res.scrollIntoView({behavior:'smooth', block:'center'});
  }

  buildQuiz();
})();

// ── Homework step-by-step engine ──────────────────────────
var hwSteps = window.hwSteps || {};
var hwProgress = {};

window.startHW = function(id) {
  var stepsEl = document.getElementById('hw-steps-' + id);
  var ansEl   = document.getElementById('hw-ans-' + id);
  if (!stepsEl || !hwSteps[id]) return;
  hwProgress[id] = 0;
  if (ansEl) ansEl.style.display = 'none';
  stepsEl.style.display = 'block';
  window.renderHWStep(id);
};

window.renderHWStep = function(id) {
  var steps = hwSteps[id];
  var i = hwProgress[id];
  var isLast = (i === steps.length - 1);
  var stepsEl = document.getElementById('hw-steps-' + id);
  var html = '';
  for (var j = 0; j <= i; j++) {
    var s = steps[j];
    var isNew = (j === i);
    var accent = isNew ? 'var(--accent)' : 'var(--border)';
    var textCol = isNew ? 'var(--accent)' : 'var(--muted)';
    html += '<div style="display:flex;gap:12px;margin-bottom:12px">';
    html += '<div style="background:' + accent + ';color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.82rem;flex-shrink:0;">' + (j+1) + '</div>';
    html += '<div style="background:var(--deep);border:1px solid ' + accent + ';border-radius:10px;padding:12px 16px;flex:1;">';
    html += '<div style="font-weight:700;color:' + textCol + ';margin-bottom:6px;font-size:0.88rem;">' + s.title + '</div>';
    html += '<div style="font-size:0.9rem;color:var(--text);line-height:1.7;">' + s.body + '</div>';
    html += '</div></div>';
  }
  html += '<div style="display:flex;align-items:center;gap:10px;margin-top:4px;">';
  if (!isLast) {
    html += '<button class="btn btn-primary" style="padding:7px 18px;font-size:0.85rem;" onclick="nextHW(\'' + id + '\')">Next Step \u2192</button>';
  } else {
    html += '<div style="color:var(--green);font-weight:700;font-size:0.9rem;">\u2705 All steps complete!</div>';
  }
  html += '<span style="color:var(--muted);font-size:0.82rem;">Step ' + (i+1) + ' of ' + steps.length + '</span>';
  html += '<button class="btn btn-secondary" style="padding:7px 14px;font-size:0.82rem;margin-left:auto;" onclick="skipHW(\'' + id + '\')">Show Full Answer</button>';
  html += '</div>';
  stepsEl.innerHTML = html;
  if (window.MathJax) MathJax.typesetPromise([stepsEl]);
};

window.nextHW = function(id) {
  if (hwProgress[id] < hwSteps[id].length - 1) {
    hwProgress[id]++;
    window.renderHWStep(id);
  }
};

window.skipHW = function(id) {
  var stepsEl = document.getElementById('hw-steps-' + id);
  var ansEl   = document.getElementById('hw-ans-' + id);
  if (stepsEl) stepsEl.style.display = 'none';
  if (ansEl) { ansEl.style.display = 'block'; if (window.MathJax) MathJax.typesetPromise([ansEl]); }
};

// ── Wire Enter key on practice inputs & show expression hints ──
(function() {
  var inputs = window.practiceInputs || [];
  inputs.forEach(function(pair) {
    var el = document.getElementById(pair[0]);
    if (el) el.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && window[pair[1]]) window[pair[1]]();
    });
  });
  var hints = window.practiceHints || [];
  hints.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = EXPR_HINT;
  });
})();

// ── Secret teacher shortcut: Cmd+Arrow to navigate sections ──
document.addEventListener('keydown', function(e) {
  if (!e.metaKey) return;
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    if (currentSection < sections.length - 1) window.goTo(currentSection + 1);
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    if (currentSection > 0) window.goTo(currentSection - 1);
  }
});
