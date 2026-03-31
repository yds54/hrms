const paginate = async ({
  model,
  query = {},
  page = 1,
  limit = 10,
  populate = [],
  sort = { date: -1 },
  select = "",
} = {}) => {
  const totalrecords = await model.countDocuments(query);
  const totalpages = Math.ceil(totalrecords / limit);

  if (page > totalpages) {
    page = totalpages || 1;
  }

  const skip = (page - 1) * limit;

  let dbQuery = model.find(query).sort(sort).select(select);

  if (populate.length) {
    populate.forEach((p) => {
      dbQuery = dbQuery.populate(p);
    });
  }
  dbQuery = dbQuery.skip(skip).limit(limit).lean();

  const data = await dbQuery;

  return {
    data,
    pagination: {
      page,
      totalpages,
      totalrecords,
    },
  };
};

module.exports = { paginate };
