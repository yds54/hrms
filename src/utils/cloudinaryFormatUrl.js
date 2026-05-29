const { getFileUrl } = require("./fileUrl");

// Display Single User profile picture Url
const formatProfilePicture = (user) => {
  if (!user) return user;
  if (user?.profilePicture?.fileName) {
    return {
      ...user,
      profilePicture: {
        ...user.profilePicture,
        url: getFileUrl(`profile/${user.profilePicture.fileName}`),
      },
    };
  }
  return {
    ...user,
    profilePicture: user.profilePicture || null,
  };
};

// Display Single User profile picture Url in Leave User
const formatLeaveUser = (item) => ({
  ...item,
  user: formatProfilePicture(item.user),
});

// Display Multiple User profile picture Url
const formatUsersArray = (users = []) => {
  return users.map(formatProfilePicture);
};

// Display Ticket Attachments Url
const formatAttachments = (files = [], folderPath) => {
  return files.map((file) => ({
    ...file,
    url: file?.fileName ? getFileUrl(`${folderPath}/${file.fileName}`) : null,
  }));
};

// Display ticket with profile picture and attachment url
const formatTicket = (ticket) => {
  if (!ticket) return ticket;
  // Display Ticket attachment url
  if (ticket.attachFile?.length && ticket.createdBy?._id) {
    ticket.attachFile = formatAttachments(
      ticket.attachFile,
      `tickets/${ticket.createdBy._id}`,
    );
  }
  // Display creator profile picture url
  if (ticket.createdBy) {
    ticket.createdBy = formatProfilePicture(ticket.createdBy);
  }
  // Display assignedTo profile picture url
  if (ticket.assignedTo?.length) {
    ticket.assignedTo = formatUsersArray(ticket.assignedTo);
  }
  return ticket;
};

// Display Comments with profile picture and attachment url
const formatComment = (comment) => {
  if (!comment) return comment;
  const userId = comment.createdBy?._id || comment.createdBy;
  // Display Comment attachment url
  if (comment.attachFile?.length && userId) {
    comment.attachFile = formatAttachments(
      comment.attachFile,
      `comments/${comment.ticketId}/${userId}`,
    );
  }
  // Display creator profile picture url
  if (comment.createdBy) {
    comment.createdBy = formatProfilePicture(comment.createdBy);
  }
  return comment;
};

// Display Ticket activity with profile picture url
const formatActivity = (activity) => {
  if (activity?.changedBy) {
    activity.changedBy = formatProfilePicture(activity.changedBy);
  }
  return activity;
};

module.exports = {
  formatTicket,
  formatComment,
  formatActivity,
  formatProfilePicture,
  formatUsersArray,
  formatLeaveUser,
};
