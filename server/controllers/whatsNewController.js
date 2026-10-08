const OpenAI = require('openai');

const dailyCache = {};

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

exports.getWhatsNew = async (req, res) => {
  try {
    const today = getTodayKey();

    if (dailyCache[today]) return res.json(dailyCache[today]);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Today is ${today}. Generate a fresh daily "What's New" content package. 
Return ONLY a valid JSON object with exactly this structure (no markdown, no extra text):
{
  "date": "${today}",
  "thought": {
    "text": "A meaningful, motivating thought for the day (1-2 sentences, original, not cliché)",
    "author": "Author name or 'Unknown'"
  },
  "vocab": {
    "word": "A useful English word people can use in daily conversations",
    "meaning": "Clear, simple definition in one sentence",
    "partOfSpeech": "noun/verb/adjective/adverb",
    "example": "A natural example sentence using the word in daily life",
    "whenToUse": "Describe the exact situation or context when this word fits perfectly (2 sentences)"
  },
  "idiom": {
    "phrase": "A common English idiom",
    "meaning": "What it actually means in plain English",
    "example": "A realistic example sentence using this idiom naturally",
    "origin": "Brief one-sentence origin or fun fact about this idiom"
  },
  "genZ": {
    "word": "A popular Gen Z slang word or phrase",
    "meaning": "What it means in plain English",
    "example": "Example sentence showing how Gen Z actually uses it",
    "vibe": "One word describing the vibe: positive/negative/neutral/hype/sarcastic"
  }
}`;

    let content = {};
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 700,
        temperature: 0.85
      });
      const raw = completion.choices[0].message.content.trim();
      content = JSON.parse(raw);
    } catch (aiErr) {
      content = {
        date: today,
        thought: {
          text: "The secret of getting ahead is getting started. Break your big goal into small steps and take one today.",
          author: "Mark Twain"
        },
        vocab: {
          word: "Candid",
          meaning: "Truthful and straightforward; not hiding what one thinks.",
          partOfSpeech: "adjective",
          example: "She gave a candid answer about why the project was delayed.",
          whenToUse: "Use 'candid' when you want to express that someone is being honest and direct. It's perfect in professional settings like 'I want to be candid with you about the challenges we're facing.'"
        },
        idiom: {
          phrase: "Hit the nail on the head",
          meaning: "To describe exactly what is causing a situation or problem.",
          example: "When she said the team lacked clear communication, she really hit the nail on the head.",
          origin: "This idiom comes from carpentry — hitting a nail precisely drives it in perfectly, just like making an exact point."
        },
        genZ: {
          word: "No cap",
          meaning: "Means 'I'm not lying' or 'for real' — used to emphasize that something is true.",
          example: "That movie was the best I've seen this year, no cap.",
          vibe: "positive"
        }
      };
    }
    dailyCache[today] = content;
    Object.keys(dailyCache).forEach(k => { if (k !== today) delete dailyCache[k]; });

    res.json(content);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};