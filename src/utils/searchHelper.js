exports.searchConditions = (search, field) => {
  if (!search) return {};
  const words = search.trim().toLowerCase().split(/\s+/);
  return {
    $and: words.map((word) => ({
      [field]: { $regex: word, $options: "i" },
    })),
  };
};
