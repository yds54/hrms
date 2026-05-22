const moment = require("moment-timezone");
const { TIMEZONES } = require("../utils/enum");
const TZ = TIMEZONES.INDIA;
const DATE_FORMAT = "YYYY-MM-DD";

const parseISTDate = (date) => moment.tz(date, DATE_FORMAT, true, TZ);

const isValidDate = (date) => parseISTDate(date).isValid();

const getDayRange = (date) => {
  const m = parseISTDate(date);
  if (!m.isValid()) {
    throw new Error("Invalid date format");
  }
  return {
    startOfDay: m.clone().startOf("day").toDate(),
    endOfDay: m.clone().endOf("day").toDate(),
  };
};

const getMonthRange = (year, month) => {
  const m = moment.tz({ year, month: month - 1 }, TZ);
  return {
    startOfMonth: m.clone().startOf("month").toDate(),
    endOfMonth: m.clone().endOf("month").toDate(),
  };
};

const formatDate = (date) => moment(date).tz(TZ).format(DATE_FORMAT);

const dateSearchQuery = (field, search) => {
  if (!search) return null;

  // full date → YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(search)) {
    const { startOfDay, endOfDay } = getDayRange(search);
    return { [field]: { $gte: startOfDay, $lte: endOfDay } };
  }

  // month → YYYY-MM
  if (/^\d{4}-\d{2}$/.test(search)) {
    const [year, month] = search.split("-").map(Number);
    const { startOfMonth, endOfMonth } = getMonthRange(year, month);
    return { [field]: { $gte: startOfMonth, $lte: endOfMonth } };
  }

  // year → YYYY
  if (/^\d{4}$/.test(search)) {
    return {
      [field]: {
        $gte: new Date(search, 0, 1),
        $lte: new Date(search, 11, 31, 23, 59, 59),
      },
    };
  }
  return null;
};

const getYearRange = (year) => {
  const start = moment
    .tz({ year, month: 0, day: 1 }, TZ)
    .startOf("day")
    .toDate();

  const end = moment.tz({ year, month: 11, day: 31 }, TZ).endOf("day").toDate();

  return { startOfYear: start, endOfYear: end };
};

const getPreviousWeekRange = () => {
  const today = moment.tz(TZ);
  return {
    fromDate: today
      .clone()
      .subtract(1, "week")
      .startOf("week")
      .startOf("day")
      .toDate(),
    toDate: today
      .clone()
      .subtract(1, "week")
      .endOf("week")
      .endOf("day")
      .toDate(),
  };
};

module.exports = {
  parseISTDate,
  isValidDate,
  getDayRange,
  getMonthRange,
  formatDate,
  dateSearchQuery,
  getYearRange,
  getPreviousWeekRange,
};
