const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const { connectDB } = require("../src/config/dbconnection");
const { USER } = require("../src/model/modelIndex");

const addFullNameToUsers = async () => {
  try {
    await connectDB();

    const users = await USER.find({});
    let updatedCount = 0;

    for (const user of users) {
      const firstName = user?.name?.firstName?.trim() || "";
      const middleName = user?.name?.middleName?.trim() || "";
      const lastName = user?.name?.lastName?.trim() || "";

      const fullName = [firstName, middleName, lastName]
        .filter(Boolean)
        .join(" ");

      // skip if already exists and same
      if (user.fullName === fullName) continue;

      await USER.updateOne({ _id: user._id }, { $set: { fullName } });
      updatedCount++;
    }

    console.log(`Updated ${updatedCount} users with fullName`);
    process.exit();
  } catch (error) {
    console.error("Script error:", error);
    process.exit(1);
  }
};

addFullNameToUsers();
