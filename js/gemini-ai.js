// إعدادات Gemini AI لمنصة بطلة اللغة العربية

ضعي_مفتاحك_هنا

const GEMINI_MODELS = [
  "gemini-1.5-flash"
];

async function generateAIQuestions() {
  const text = (document.getElementById("aiText")?.value || "").trim();
  const output = document.getElementById("aiOutput");

  if (!text) {
    output.innerHTML = '<div class="aiError">اكتبي نصًا أولًا 🌷</div>';
    return;
  }

  output.innerHTML = '<div class="loadingAI">🤖 جارٍ توليد الأسئلة الذكية...</div>';

  const prompt = `
أنت مولد أسئلة ذكي لمنصة بطلة اللغة العربية.

حلّل النص التالي وأنشئ أسئلة:
- فهم واستيعاب
- مفردات
- قواعد
- إملاء
- بلاغة
- HOTS

أخرج JSON فقط.

النص:
${text}
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODELS[0]}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      output.innerHTML = `
        <div class="aiError">
          تعذر تشغيل الذكاء الاصطناعي:
          ${data?.error?.message || "Unknown Error"}
        </div>
      `;
      return;
    }

    const aiText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    output.innerHTML = `
      <div class="aiResult">
        <h2>✨ نتائج الذكاء الاصطناعي</h2>
        <pre>${aiText}</pre>
      </div>
    `;
  } catch (error) {
    output.innerHTML = `
      <div class="aiError">
        حدث خطأ أثناء الاتصال بـ Gemini AI
      </div>
    `;
  }
}
