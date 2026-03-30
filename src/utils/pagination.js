const paginate = async ({
  model,
  query = {},
  page = 1,
  limit = 10,
  populate = [],
} = {}) => {
  page = Number(page);
  limit = Number(limit);

  const totalrecords = await model.countDocuments(query);
  const totalpages = Math.ceil(totalrecords / limit) || 1;

  if (page > totalpages) {
    page = totalpages;
  }

  const skip = (page - 1) * limit;

  let dbQuery = model.find(query);

  if (populate.length) {
    populate.forEach((p) => {
      dbQuery = dbQuery.populate(p);
    });
  }

  const data = await dbQuery.skip(skip).limit(limit).lean();

  return {
    data,
    pagination: {
      totalpages,
      totalrecords,
      currentPage: page,  
    },
  };
};

module.exports = { paginate };