const crypto = require("crypto");
const moment = require("moment-timezone");
const { TIMEZONES } = require("../utils/enum");
const { getMonthRange, formatDate } = require("../utils/dateFormat");
const { QUOTE, ATTENDANCE, HOLIDAY } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { successResponse } = require("../utils/sucess");

// Greeting user based on time
const getGreeting = (name = "User") => {
  const hour = new Date().getHours();

  const greeting =
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

    // current month continues absent count
    // if 3 ore more than 3 day continues absent apply note
    const now = moment.tz(TIMEZONES.INDIA).subtract(1, "day");
    const { startOfMonth, endOfMonth } = getMonthRange(
      now.year(),
      now.month() + 1,
    );
    const loopEnd = endOfMonth > now.toDate() ? now.toDate() : endOfMonth;

    const [attendanceData, holidays] = await Promise.all([
      ATTENDANCE.find({
        userId,
        isDeleted: false,
        date: { $gte: startOfMonth, $lte: loopEnd },
      })
        .select("date")
        .lean(),

      HOLIDAY.find({
        isDeleted: false,
        holidayDate: { $gte: startOfMonth, $lte: loopEnd },
      })
        .select("holidayDate")
        .lean(),
    ]);

    const attendanceSet = new Set(
      attendanceData.map((item) => formatDate(item.date)),
    );
    const holidaySet = new Set(
      holidays.map((item) => formatDate(item.holidayDate)),
    );

    let absentStreak = 0;
    let longestAbsentStreak = 0;
    let current = moment(startOfMonth);

    while (current.toDate() <= loopEnd) {
      const key = formatDate(current.toDate());
      const isSunday = current.day() === 0;
      const isHoliday = holidaySet.has(key);
      const hasAttendance = attendanceSet.has(key);

      // skip sunday and holiday
      if (isSunday || isHoliday) {
        current.add(1, "day");
        continue;
      }

      if (!hasAttendance) {
        absentStreak++;
        if (absentStreak > longestAbsentStreak) {
          longestAbsentStreak = absentStreak;
        }
      } else {
        absentStreak = 0;
      }
      current.add(1, "day");
    }

    return successResponse(res, 200, "Quote fetched", {
      greeting: getGreeting(firstName),
      quote: quotes[index].text,
      note: longestAbsentStreak >= 3 ? "You are irregular nowadays" : "",
    });
  } catch (err) {
    next(err);
  }
};
