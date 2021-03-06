const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const { existingEmails } = require('./helpers');

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ["bootcamp"],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.set("view engine", "ejs");


const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "1234"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "12345"
  }
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

function generateRandomString(length) {
  let result = ""
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const existingUser = function (email) {
  for (let key in users) {
    if (users[key].email === email) {
      return users[key];
    }
  } return false;
}

const urlsForUser = function (user_id) {
  let urls = {}
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === user_id) {
      urls[key] = urlDatabase[key];
    }
  }
  return urls;
}

app.post("/urls", (req, res) => {
  const newLongURL = req.body["longURL"]
  const newshortURL = generateRandomString(6)
  urlDatabase[newshortURL] = {
    longURL: newLongURL,
    userID: req.session["user_id"]
  }
  res.redirect(`/urls/${newshortURL}`);
});

app.post("/register", (req, res) => {
  const email = req.body.email
  const password = req.body.password
  if (email === "" || password === "") {
    res.status(400).send("email and password cant be empty");
    return
  }
  if (existingEmails(email, users)) {
    res.status(400).send("email already exists");
    return
  }
  const id = generateRandomString(6)
  users[id] = { id, email, password: bcrypt.hashSync(password, 10) };
  req.session.user_id = id
  res.redirect("/urls")
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const urlForUsers = urlsForUser(req.session.user_id, urlDatabase)
  delete urlDatabase[req.params.shortURL]
  if (!Object.keys(urlForUsers).length) {
    return res.status(403).send("YOU CANT DELETE THESE URLS");
  }
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL
  const longURL = req.body.longURL
  const userID = req.session.user_id
  urlDatabase[shortURL] = { longURL, userID };
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const email = req.body.email
  const password = req.body.password
  const user = existingUser(email)
  if (!user) {
    return res.status(403).send("UNAUTHORIZED");
  }
  const hashedPassword = user.password
  if (bcrypt.compareSync(password, hashedPassword)) {
    return res.status(403).send("Unauthorized");
  }
  req.session.user_id = user.id
  res.redirect("/urls")
});

app.post("/logout", (req, res) => {
  req.session = null
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  }
  else {
    return res.status(403).send("ID DOES NOT EXIST");
  }
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/new", (req, res) => {
  const user_id = req.session["user_id"]
  const user = users[user_id]
  const templateVars = { user: user }
  if (user) {
    res.render("urls_new", templateVars);
  }
  else {
    res.redirect("/login?e=" + encodeURIComponent('Error please login to access this page!!'));
  };
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const user_id = req.session["user_id"]
  const user = users[user_id] || null
  const templateVars = { urls: urlsForUser(user_id, urlDatabase), user, error: "Please login/register to access this page" };
  res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL
  if (!urlDatabase[shortURL]) {
    return res.status(403).send("This shortURL does not exist");
  }
  const longURL = urlDatabase[shortURL].longURL
  const user_id = req.session["user_id"]
  const user = users[user_id]
  const urlforUsers = urlsForUser(user_id, urlDatabase)
  if (!Object.keys(urlforUsers).length) {
    return res.status(403).send("YOU CANT EDIT THESE URLS");
  }
  const templateVars = { shortURL: shortURL, longURL: longURL, user: user };
  res.render("urls_show", templateVars);
});

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get('/register', (req, res) => {
  const user_id = req.session["user_id"]
  const user = users[user_id]
  const templateVars = { urls: urlDatabase, user };
  res.render("register", templateVars);
})

app.get('/login', (req, res) => {
  const user_id = req.session["user_id"]
  const user = users[user_id]
  const error = req.query.e
  const templateVars = { urls: urlDatabase, user, error };
  res.render("login", templateVars);
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
