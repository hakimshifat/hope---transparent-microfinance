const prisma = require("../config/prisma");

async function notifyUser(userId, { title, message, type = "info", link }) {
  if (!userId || !title || !message) return null;
  return prisma.notification.create({
    data: { userId, title, message, type, link: link || null }
  });
}

async function notifyUsers(userIds, payload) {
  const uniqueIds = [...new Set(userIds.filter(Boolean).map(String))];
  if (!uniqueIds.length) return [];
  const data = uniqueIds.map((userId) => ({ userId, ...payload, link: payload.link || null }));
  return prisma.notification.createMany({ data });
}

module.exports = { notifyUser, notifyUsers };
