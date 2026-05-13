const Notification = require("../models/Notification");

async function notifyUser(userId, { title, message, type = "info", link }) {
  if (!userId || !title || !message) return null;
  return Notification.create({ userId, title, message, type, link });
}

async function notifyUsers(userIds, payload) {
  const uniqueIds = [...new Set(userIds.filter(Boolean).map(String))];
  if (!uniqueIds.length) return [];
  return Notification.insertMany(uniqueIds.map((userId) => ({ userId, ...payload })));
}

module.exports = { notifyUser, notifyUsers };
