const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const { connectDB } = require("../src/config/dbconnection");
const { QUOTE } = require("../src/model/modelIndex");

const quotes = [
  "Success is the sum of small efforts repeated daily.",
  "Stay focused and never give up.",
  "Discipline beats motivation.",
  "Every day is a fresh start.",
  "Dream big. Work hard. Stay humble.",
  "Small progress is still progress.",
  "Consistency creates results.",
  "Your future is built today.",
  "Work silently and let success speak.",
  "Hard work always pays off.",
  "Make today count.",
  "Push yourself beyond limits.",
  "Stay patient and trust the process.",
  "Do it now, not later.",
  "Progress over perfection.",
  "Great things take time.",
  "Be stronger than your excuses.",
  "Start where you are.",
  "Keep moving forward.",
  "Success begins with self-discipline.",
  "Every effort matters.",
  "Focus on the goal.",
  "Challenges make you stronger.",
  "One step at a time.",
  "Be consistent, not perfect.",
  "Winners never quit.",
  "Believe in your journey.",
  "Keep learning every day.",
  "Do something today your future self will thank you for.",
  "Success starts with showing up.",
  "Stay hungry for growth.",
  "The best view comes after the hardest climb.",
  "Effort never goes unnoticed.",
  "Turn obstacles into opportunities.",
  "Discipline is choosing what you want most.",
  "Your only limit is your mindset.",
  "Action beats intention.",
  "Make progress, not excuses.",
  "Stay positive, work hard, make it happen.",
  "Every day is another chance to improve.",
];

const seedQuotes = async () => {
  try {
    await connectDB();

    const insertedQuotes = [];
    let insertedCount = 0;

    for (const text of quotes) {
      const isQuotesExists = await QUOTE.findOne({ text });
      if (!isQuotesExists) {
        const newQuote = await QUOTE.create({ text });
        insertedQuotes.push(newQuote.text);
        insertedCount++;
      }
    }

    console.log(`Inserted ${insertedCount} new quotes`);
    console.log("Inserted quotes:", insertedQuotes);

    process.exit();
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seedQuotes();
