exports.parseTime = (time) => {
  if (!time) return 0;

  const [t, mod] = time.split(" ");
  let [h, m] = t.split(":").map(Number);

  if (mod === "PM" && h !== 12) h += 12;
  if (mod === "AM" && h === 12) h = 0;

  return h * 60 + m;
};
