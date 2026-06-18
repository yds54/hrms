const moment = require("moment");
const { successResponse } = require("../utils/sucess");
const { USER, USERPAYROLL, INCREMENT } = require("../model/modelIndex");
const { dateSearchQuery } = require("../utils/dateFormat");
const { paginate, paginateArray } = require("../utils/pagination");
const { searchConditions } = require("../utils/searchHelper");
const { TIMEZONES } = require("../utils/enum");
const { getFileUrl } = require("../utils/fileUrl");

exports.getCelebrationAndIncrementData = async (req, res, next) => {
  try {
    const { month, year, page, limit, search } = req.query;

    const selectedMonth = month ? +month : moment().month() + 1;
    const selectedYear = year ? +year : moment().year();

    const birthDayUsersData = await paginate({
      model: USER,
      page,
      limit,
      pipeline: [
        {
          $addFields: {
            birthMonth: { $month: "$birthDate" },
            birthDay: { $dayOfMonth: "$birthDate" },
          },
        },
        {
          $match: {
            birthMonth: selectedMonth,
            ...(search
              ? {
                  $or: [
                    searchConditions(search, "fullName"),
                    searchConditions(search, "email"),
                    searchConditions(search, "contactNumber"),
                    searchConditions(search, "employeeCode"),
                    dateSearchQuery("birthDate", search),
                  ].filter(Boolean),
                }
              : {}),
          },
        },
        {
          $sort: {
            birthDay: 1, // ascending
          },
        },
        {
          $project: {
            _id: 0,
            fullName: 1,
            email: 1,
            birthDate: 1,
            contactNumber: 1,
            employeeCode: 1,
          },
        },
      ],
      query: {
        isDeleted: false,
        birthDate: { $ne: null },
      },
    });

    const marriageAnniUsersData = await paginate({
      model: USER,
      page,
      limit,
      pipeline: [
        {
          $addFields: {
            marriageMonth: { $month: "$marriageDate" },
            marriageDay: { $dayOfMonth: "$marriageDate" },
          },
        },
        {
          $match: {
            marriageMonth: selectedMonth,
            ...(search
              ? {
                  $or: [
                    searchConditions(search, "fullName"),
                    searchConditions(search, "email"),
                    searchConditions(search, "contactNumber"),
                    searchConditions(search, "employeeCode"),
                    dateSearchQuery("marriageDate", search),
                  ].filter(Boolean),
                }
              : {}),
          },
        },
        {
          $sort: {
            marriageDay: 1,
          },
        },
        {
          $project: {
            _id: 0,
            marriageDate: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$marriageDate",
              },
            },
            fullName: 1,
            email: 1,
            contactNumber: 1,
            employeeCode: 1,
            date: "$marriageDate",
          },
        },
      ],
      query: {
        isDeleted: false,
        marriageDate: { $ne: null },
      },
    });

    const payrollUsers = await USERPAYROLL.find({
      isDeleted: false,
    })
      .populate({
        path: "userId",
        select: "fullName employeeCode email contactNumber",
        match: {
          isDeleted: false,

          ...(search
            ? {
                $or: [
                  searchConditions(search, "fullName"),
                  searchConditions(search, "employeeCode"),
                  searchConditions(search, "email"),
                  searchConditions(search, "contactNumber"),
                ],
              }
            : {}),
        },
      })
      .select(
        "_id salaryAmount trainingStartDate trainingEndDate joiningDate bondCompletedDate",
      )
      .lean();

    const incrementUsers = await Promise.all(
      payrollUsers.map(async (payroll) => {
        const increments = await INCREMENT.find({
          userId: payroll.userId,
          isDeleted: false,
        })
          .sort({ effectiveFrom: 1 })
          .select("previousSalary totalSalary effectiveFrom createdAt")
          .lean();

        const filteredIncrements = increments.filter((item) => {
          const date = item.effectiveFrom || item.createdAt;

          const itemMonth = moment(date).month() + 1;
          const itemYear = moment(date).year();

          const matchesMonthYear =
            itemMonth === selectedMonth && itemYear === selectedYear;

          if (!search) {
            return matchesMonthYear;
          }

          const incrementDateSearch = dateSearchQuery("date", search);

          if (incrementDateSearch) {
            const query = incrementDateSearch.date;

            return matchesMonthYear && date >= query.$gte && date <= query.$lte;
          }

          return matchesMonthYear;
        });

        if (!filteredIncrements.length) {
          return null;
        }

        const incrementHistory = filteredIncrements.map((item, index) => {
          const fromDate = moment(item.effectiveFrom || item.createdAt).format(
            "MMM YYYY",
          );

          const toDate =
            index === filteredIncrements.length - 1
              ? "Present"
              : moment(
                  filteredIncrements[index + 1].effectiveFrom ||
                    filteredIncrements[index + 1].createdAt,
                )
                  .subtract(1, "month")
                  .format("MMM YYYY");

          return {
            from: fromDate,
            to: toDate,
            salary: String(item.totalSalary),
          };
        });

        return {
          ...payroll,
          user: payroll.userId,
          increment: incrementHistory,
        };
      }),
    );

    const incrementUsersData = paginateArray(
      incrementUsers.filter(Boolean),
      page,
      limit,
    );

    return successResponse(
      res,
      200,
      "Celebration and increment data fetched successfully",
      {
        birthDayUsers: birthDayUsersData.data,
        birthDayUsersPagination: birthDayUsersData.pagination,

        marriageAnniUsers: marriageAnniUsersData.data,
        marriageAnniUsersPagination: marriageAnniUsersData.pagination,

        incrementUsers: incrementUsersData.data,
        incrementUsersPagination: incrementUsersData.pagination,
      },
    );
  } catch (error) {
    next(error);
  }
};

exports.getTodayCelebrations = async (req, res, next) => {
  try {
    const today = moment().tz(TIMEZONES.INDIA).format("MM-DD");

    const users = await USER.aggregate([
      {
        $match: {
          isDeleted: false,
          isLeft: false,
        },
      },
      {
        $addFields: {
          birthDateMMDD: {
            $cond: [
              { $ifNull: ["$birthDate", false] },
              {
                $dateToString: {
                  format: "%m-%d",
                  date: "$birthDate",
                  timezone: TIMEZONES.INDIA,
                },
              },
              null,
            ],
          },
          marriageDateMMDD: {
            $cond: [
              { $ifNull: ["$marriageDate", false] },
              {
                $dateToString: {
                  format: "%m-%d",
                  date: "$marriageDate",
                  timezone: TIMEZONES.INDIA,
                },
              },
              null,
            ],
          },
        },
      },
      {
        $match: {
          $or: [{ birthDateMMDD: today }, { marriageDateMMDD: today }],
        },
      },
      {
        $lookup: {
          from: "designations",
          localField: "designationId",
          foreignField: "_id",
          as: "designation",
        },
      },
      {
        $unwind: {
          path: "$designation",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "departmentId",
          foreignField: "_id",
          as: "department",
        },
      },
      {
        $unwind: {
          path: "$department",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          fullName: 1,
          profilePicture: 1,
          designation: "$designation.designationName",
          department: "$department.departmentName",
          isBirthday: {
            $eq: ["$birthDateMMDD", today],
          },
          isAnniversary: {
            $eq: ["$marriageDateMMDD", today],
          },
        },
      },
    ]);

    const formattedData = users.map((user) => ({
      userName: user.fullName,
      designation: user.designation,
      department: user.department,
      isBirthday: user.isBirthday,
      isAnniversary: user.isAnniversary,
      profilePictureUrl: user.profilePicture?.fileName
        ? getFileUrl(`profile/${user.profilePicture.fileName}`)
        : null,
    }));

    return successResponse(
      res,
      200,
      "Today's celebrations fetched successfully",
      { data: formattedData },
    );
  } catch (error) {
    next(error);
  }
};
