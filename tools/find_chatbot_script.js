const fs = require('fs');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');

const m1 = html.match(/var buttons=\[.*?\];/s);
if (m1) console.log('Buttons script:', m1[0]);

const m2 = html.match(/var ACACChatbotConfig=\{.*?\};/s);
if (m2) console.log('ACACChatbotConfig:', m2[0]);

// Find all occurrences of "chatbot" or "acac-chat" in scripts
const m3 = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
m3.forEach((s, i) => {
  if (s.includes('chat') || s.includes('button')) {
    console.log(`\nScript ${i}:`, s);
  }
});
