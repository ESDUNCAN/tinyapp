const existingEmails = function (email, users) {
  for (const user of Object.values(users)) {
    if (user.email === email) {
      return true;
    }
  }
  return false;
}

module.exports = existingEmails 