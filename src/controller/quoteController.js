const crypto = require("crypto");
const { QUOTE } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { successResponse } = require("../utils/sucess");

// Greeting user based on time
const getGreeting = (name = "User") => {
  const hour = new Date().getHours();

  let greeting =
    hour >= 5 && hour < 12
      ? "Good Morning"
      : hour >= 12 && hour < 17
        ? "Good Afternoon"
        : hour >= 17 && hour < 21
          ? "Good Evening"
          : "Good Night";

  return `${greeting} ${name}!`;
};

//============= DISPLAY QUOTES ==================
exports.getDailyQuote = async (req, res, next) => {
  try {
    const { _id: userId, name } = req.user;
    const firstName = name?.firstName || "User";

    const quotes = await QUOTE.find({ isDeleted: false })
      .sort({ createdAt: 1 })
      .select("text -_id")
      .lean();

    if (!quotes.length) {
      throw new AppError("No quotes found", 404);
    }

    // Get day of year
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((today - start) / 86400000);

    // unique hash per user
    const userHash = parseInt(
      crypto
        .createHash("md5")
        .update(String(userId))
        .digest("hex")
        .substring(0, 8),
      16,
    );

    // different quotes per user Pick quote index
    const index = (dayOfYear + userHash) % quotes.length;

    return successResponse(res, 200, "Quote fetched", {
      greeting: getGreeting(firstName),
      quote: quotes[index].text,
    });
  } catch (err) {
    next(err);
  }
};
