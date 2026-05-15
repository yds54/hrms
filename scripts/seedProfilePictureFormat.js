const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});
const { connectDB } = require("../src/config/dbconnection");
const { USER } = require("../src/model/modelIndex");

const migrateProfilePicture = async () => {
  try {
    await connectDB();
    const users = await USER.find({
      $or: [
        {
          profilePicture: {
            $exists: false,
          },
        },
        {
          profilePicture: null,
        },
        {
          profilePicture: {
            $type: "string",
          },
        },
      ],
    }).select("_id profilePicture");

    console.log(`Found ${users.length} users to migrate`);

    let updatedCount = 0;

    for (const user of users) {
      await USER.updateOne(
        { _id: user._id },
        {
          $set: {
            profilePicture: {
              fileName: null,
              fileType: null,
              size: null,
            },
          },
        },
      );

      updatedCount++;

      console.log(`Updated User: ${user._id}`);
    }

    console.log(`Migration completed`);
    console.log(`Total updated users: ${updatedCount}`);

    process.exit();
  } catch (error) {
    console.error("Migration Error:", error);

    process.exit(1);
  }
};

migrateProfilePicture();
