const { existingEmails } = require('../helpers.js');
const assert = require('chai').assert

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "1234"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('existingEmails', function () {
  it('should return a user with valid email', function () {
    const user = existingEmails("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    assert.equal(user.id, expectedUserID)
  });
});

describe('existingEmails', function () {
  it('should test that a non-existent email returns undefined', function () {
    const user = existingEmails("user888@example.com", testUsers)
    // const expectedUserID = "userRandomID";
    assert.equal(user.id, undefined)
  });
});