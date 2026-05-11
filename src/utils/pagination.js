const paginate = async ({
  model,
  query = {},
  page = 1,
  limit = 10,
  populate = [],
  sort = { createdAt: -1 },
  select = "",
  pipeline = null,
} = {}) => {
  page = Number(page);
  limit = Number(limit);

  if (pipeline) {
    const aggPipeline = [
      ...(Object.keys(query).length ? [{ $match: query }] : []),

      ...pipeline,

      {
        $facet: {
          data: [
            { $sort: sort },
            { $skip: (page - 1) * limit },
            { $limit: limit },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];
    const result = await model.aggregate(aggPipeline);

    const data = result[0]?.data || [];
    const totalrecords = result[0]?.totalCount[0]?.count || 0;
    const totalpages = Math.ceil(totalrecords / limit);

    return {
      data,
      pagination: {
        totalpages,
        totalrecords,
      },
    };
  }

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

  dbQuery = dbQuery.skip(skip).limit(limit);

  const data = await dbQuery;

  return {
    data,
    pagination: {
      totalpages,
      totalrecords,
    },
  };
};

const paginateArray = (data = [], page = 1, limit = 10) => {
  const totalrecords = data.length;
  const totalpages = Math.max(1, Math.ceil(totalrecords / limit));
  page = Math.min(page, totalpages);
  return {
    data: data.slice((page - 1) * limit, page * limit),
    pagination: { totalpages, totalrecords },
  };
};

module.exports = { paginate, paginateArray };
