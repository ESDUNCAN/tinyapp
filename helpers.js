const existingEmails = function (email, users) {
  for (const user of Object.values(users)) {
    if (user.email === email) {
      return user;
    }
  }
  return false
}

module.exports = { existingEmails }