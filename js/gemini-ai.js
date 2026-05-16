
const GEMINI_API_KEY = "AIzaSyDXg5jfDTtdczbF6_sL-yneLQLLUNuqJjk";

async function generateAIQuestions() {
  const text = (document.getElementById("aiText")?.value || "").trim();
  const output = document.getElementById("aiOutput");

  if (!text) {
    output.innerHTML = '<div class="aiError">اكتبي نصًا أولًا حتى تولّد سلامة أسئلة ذكية 🌷</div>';
    return;
  }

  output.innerHTML = '<div class="loadingAI">🤖 سلامة تبحث عن الموديل المناسب لهذا المفتاح...</div>';

  try {
    const model = await getBestAvailableGeminiModel();
    output.innerHTML = `<div class="loadingAI">🤖 تم اختيار ${model}<br>جارٍ تحليل النص وتوليد الأسئلة...</div>`;
    const prompt = buildArabicQuestionsPrompt(text);
    const result = await callGemini(model, prompt);
    renderGeminiResult(result);
    if (typeof addAch === "function") addAch("مستكشفة الذكاء الاصطناعي");
    if (typeof play === "function") play("sparkleSound");
  } catch (error) {
    output.innerHTML = `
      <div class="aiError">
        تعذر تشغيل الذكاء الاصطناعي.<br>
        <strong>السبب:</strong> ${escapeHTML(error.message || String(error))}<br><br>
        الحل: أنشئي مفتاحًا جديدًا من Google AI Studio وتأكدي أن Gemini API مفعّل وغير مقيّد بدومين مختلف.
      </div>
    `;
  }
}

async function getBestAvailableGeminiModel() {
  const endpoints = [
    "https://generativelanguage.googleapis.com/v1beta/models",
    "https://generativelanguage.googleapis.com/v1/models"
  ];

  let lastError = "";

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(`${endpoint}?key=${GEMINI_API_KEY}`);
      const data = await res.json();

      if (!res.ok) {
        lastError = data?.error?.message || `HTTP ${res.status}`;
        continue;
      }

      const usable = (data.models || []).filter(m =>
        Array.isArray(m.supportedGenerationMethods) &&
        m.supportedGenerationMethods.includes("generateContent")
      );

      if (!usable.length) {
        lastError = "لا توجد موديلات تدعم generateContent لهذا المفتاح.";
        continue;
      }

      const preferred =
        usable.find(m => /gemini-2\.0-flash/i.test(m.name)) ||
        usable.find(m => /gemini-1\.5-flash/i.test(m.name)) ||
        usable.find(m => /flash/i.test(m.name)) ||
        usable[0];

      return preferred.name.replace(/^models\//, "");
    } catch (e) {
      lastError = e.message || String(e);
    }
  }

  throw new Error(lastError || "فشل جلب قائمة الموديلات.");
}

function buildArabicQuestionsPrompt(text) {
  return `
أنت محرّك ذكاء اصطناعي متخصص في تحليل النصوص العربية وتوليد أسئلة تعليمية تفاعلية لمنصة "بطلة اللغة العربية".

حلّل النص التالي لطالبات الصف الخامس الابتدائي، ثم أخرج JSON فقط دون أي شرح خارجي.

يجب أن يتضمن JSON:
{
  "title": "",
  "text_type": "",
  "grade_level": "الصف الخامس الابتدائي",
  "difficulty": "",
  "skills_detected": [],
  "main_idea": "",
  "key_values": [],
  "questions": [
    {
      "id": "",
      "type": "",
      "question": "",
      "options": [],
      "answer": "",
      "explanation": "",
      "skill": "",
      "difficulty": "",
      "category": "",
      "points": 10
    }
  ],
  "games": [],
  "quick_challenges": [],
  "hots_question": {},
  "achievement_badge": ""
}

غطِّ ما يناسب النص من: الفهم والاستيعاب، المفردات، القواعد، البلاغة، الإملاء، التعبير، HOTS.
استخدم لغة عربية سليمة، واجعل الأسئلة متدرجة وغير مكررة.

النص:
${text}
`;
}

async function callGemini(model, prompt) {
  const endpoints = [
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GEMINI_API_KEY}`
  ];

  let lastError = "";

  for (const url of endpoints) {
    const res = await fetch(url, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        contents: [{role: "user", parts: [{text: prompt}]}],
        generationConfig: {temperature: 0.65, topP: 0.9, maxOutputTokens: 4096}
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      lastError = data?.error?.message || `HTTP ${res.status}`;
      continue;
    }

    let txt = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!txt) {
      lastError = "لم يرجع Gemini نصًا واضحًا.";
      continue;
    }

    return cleanGeminiJson(txt);
  }

  throw new Error(lastError || "فشل استدعاء generateContent.");
}

function cleanGeminiJson(text) {
  return String(text)
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function renderGeminiResult(text) {
  const output = document.getElementById("aiOutput");
  let data = null;

  try {
    data = JSON.parse(text);
  } catch {
    output.innerHTML = `<div class="aiResult"><h2>✨ نتيجة الذكاء الاصطناعي</h2><pre>${escapeHTML(text)}</pre></div>`;
    return;
  }

  const questions = Array.isArray(data.questions) ? data.questions : [];

  output.innerHTML = `
    <div class="aiResult">
      <h2>✨ ${escapeHTML(data.title || "أسئلة ذكية")}</h2>
      <p><strong>نوع النص:</strong> ${escapeHTML(data.text_type || "")}</p>
      <p><strong>الصعوبة:</strong> ${escapeHTML(data.difficulty || "")}</p>
      <p><strong>الفكرة العامة:</strong> ${escapeHTML(data.main_idea || "")}</p>

      <h3>🎯 المهارات</h3>
      <div class="badgeWrap">
        ${(data.skills_detected || []).map(x => `<span class="badge">${escapeHTML(x)}</span>`).join("")}
      </div>

      <h3>🧠 الأسئلة الذكية</h3>
      <div class="generatedQuestions">
        ${questions.map((q, i) => renderGeminiQuestion(q, i)).join("")}
      </div>

      <h3>🎮 الألعاب والتحديات</h3>
      <pre>${escapeHTML(JSON.stringify({
        games: data.games || [],
        quick_challenges: data.quick_challenges || [],
        hots_question: data.hots_question || {},
        achievement_badge: data.achievement_badge || ""
      }, null, 2))}</pre>
    </div>
  `;
}

function renderGeminiQuestion(q, i) {
  const options = Array.isArray(q.options) ? q.options : [];
  return `
    <div class="aiQuestionCard">
      <div class="aiQuestionHeader">
        <span>سؤال ${i + 1}</span>
        <span>${escapeHTML(q.category || q.skill || "لغة عربية")}</span>
        <span>${escapeHTML(q.difficulty || "متوسط")}</span>
      </div>
      <div class="aiQuestionText">${escapeHTML(q.question || "")}</div>
      ${options.length ? `<ol>${options.map(o => `<li>${escapeHTML(o)}</li>`).join("")}</ol>` : ""}
      <div class="aiAnswer"><strong>الإجابة:</strong> ${escapeHTML(q.answer || "")}</div>
      <div class="aiExplain"><strong>التفسير:</strong> ${escapeHTML(q.explanation || "")}</div>
    </div>
  `;
}

function escapeHTML(v) {
  return String(v)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
