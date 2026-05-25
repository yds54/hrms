const moment = require("moment-timezone");
const { TIMEZONES } = require("../utils/enum");

const TZ = TIMEZONES.INDIA;
const DATE_FORMAT = "YYYY-MM-DD";

const getWeeksOfMonth = (year, month) => {
  const start = moment
    .tz({ year, month: month - 1, day: 1 }, TZ)
    .startOf("day");
  const end = start.clone().endOf("month");
  const weeks = [];
  let currentStart = start.clone();

  while (currentStart.isSameOrBefore(end)) {
    let currentEnd;

    if (weeks.length === 0) {
      currentEnd = currentStart.clone().day(6);
    } else {
      currentStart = currentStart.clone().day(1);
      currentEnd = currentStart.clone().day(6);
    }

    if (currentEnd.isAfter(end)) {
      currentEnd = end.clone();
    }

    const fromDate = currentStart.clone().startOf("day");
    const toDate = currentEnd.clone().endOf("day");

    weeks.push({
      fromDate: fromDate.toDate(),
      toDate: toDate.toDate(),
      key: `${fromDate.format(DATE_FORMAT)}-${toDate.format(DATE_FORMAT)}`,
      formattedFromDate: fromDate.format(DATE_FORMAT),
      formattedToDate: toDate.format(DATE_FORMAT),
    });
    currentStart = currentEnd.clone().add(1, "day");
  }
  return weeks;
};

module.exports = { getWeeksOfMonth };
