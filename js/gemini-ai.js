
/*
  Gemini AI مباشر داخل منصة بطلة اللغة العربية.
  ملاحظة مهمة: ظهور المفتاح داخل GitHub Pages مناسب للتجربة فقط.
  للحماية النهائية استخدمي Backend أو Vercel Function.
*/

const GEMINI_API_KEY = "AIzaSyDXg5jfDTtdczbF6_sL-yneLQLLUNuqJjk";

const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest"
];

async function generateAIQuestions() {
  const text = (document.getElementById("aiText")?.value || "").trim();
  const output = document.getElementById("aiOutput");

  if (!text) {
    output.innerHTML = '<div class="aiError">اكتبي نصًا أولًا حتى تولّد سلامة أسئلة ذكية 🌷</div>';
    return;
  }

  output.innerHTML = '<div class="loadingAI">🤖 سلامة تحلّل النص الآن... الرجاء الانتظار</div>';

  const prompt = buildArabicQuestionsPrompt(text);
  let lastError = null;

  for (const model of GEMINI_MODELS) {
    try {
      const result = await callGemini(model, prompt);
      if (result.ok) {
        renderGeminiResult(result.text);
        if (typeof addAch === "function") addAch("مستكشفة الذكاء الاصطناعي");
        if (typeof play === "function") play("sparkleSound");
        return;
      }
      lastError = result.error;
    } catch (error) {
      lastError = error?.message || String(error);
    }
  }

  output.innerHTML = `
    <div class="aiError">
      تعذر الاتصال بالذكاء الاصطناعي.<br>
      السبب المحتمل: مفتاح API غير مفعّل، أو عليه قيود، أو لم يتم تفعيل Gemini API في Google AI Studio.<br>
      <small>تفصيل تقني: ${escapeHTML(lastError || "Unknown error")}</small>
    </div>
  `;
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

غطِّ ما يناسب النص من:
الفهم والاستيعاب، المفردات، القواعد، البلاغة، الإملاء، التعبير، HOTS.
استخدم لغة عربية سليمة، واجعل الأسئلة متدرجة وغير مكررة.

النص:
${text}
`;
}

async function callGemini(model, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.65,
        topP: 0.9,
        maxOutputTokens: 4096
      }
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.error?.message || `HTTP ${response.status}`;
    return { ok: false, error: `${model}: ${message}` };
  }

  let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!aiText) {
    return { ok: false, error: `${model}: لم يرجع نصًا واضحًا.` };
  }

  aiText = cleanGeminiJson(aiText);
  return { ok: true, text: aiText };
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
    output.innerHTML = `
      <div class="aiResult">
        <h2>✨ نتيجة الذكاء الاصطناعي</h2>
        <pre>${escapeHTML(text)}</pre>
      </div>
    `;
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
