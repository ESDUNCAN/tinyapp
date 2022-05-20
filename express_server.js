const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
const cookieSession = require('cookie-session')
const bcrypt = require('bcryptjs');


app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ["bootcamp"],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.set("view engine", "ejs");

function generateRandomString(length) {
  let result = ""
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

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
}

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

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

const existingEmails = function (email) {
  for (let key in users) {
    if (users[key].email === email) {
      return true
    }
  } return false
}

const existingUser = function (email) {
  for (let key in users) {
    if (users[key].email === email) {
      return users[key]
    }
  } return false
}

const urlsForUser = function (user_id, urlDatabase) {
  let urls = {}
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === user_id) {
      urls[key] = urlDatabase[key]
    }
  }
  return urls
}


app.post("/urls", (req, res) => {
  console.log("We are finally in the Post request on the server", req.body);  // Log the POST request body to the console
  // get the longURL from the form request
  const newLongURL = req.body["longURL"]

  // create short URL so it can be stored in database
  const newshortURL = generateRandomString(6)
  // store short + long in database
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
    res.status(400).send("email and password cant be empty")
    return
  }

  if (existingEmails(email)) {
    res.status(400).send("email already exists")
    return
  }

  const id = generateRandomString(6)
  users[id] = { id, email, password: bcrypt.hashSync(password, 10) }
  req.session.user_id = id
  console.log(users)
  res.redirect("/urls")
})


app.post("/urls/:shortURL/delete", (req, res) => {
  const urlforUsers = urlsForUser(user_id, urlDatabase)
  delete urlDatabase[req.params.shortURL]
  if (!Object.keys(urlforUsers).length) {
    return res.status(403).send("YOU CANT DELETE THESE URLS")
  }
  res.redirect("/urls")
})

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL
  const longURL = req.body.longURL
  urlDatabase[shortURL] = longURL
  console.log("IM RIGHT HERE", shortURL, longURL)
  res.redirect("/urls")
})

app.post("/login", (req, res) => {
  /**
   * get existing user 
   * check if password is the same 
   * store the userId into the cookie
   * redirect to urls
   */
  const email = req.body.email
  const password = req.body.password
  const user = existingUser(email)
  if (!user) {
    return res.status(403).send("Unauthorized")
  }
  const hashedPassword = user.password
  if (bcrypt.compareSync(password, hashedPassword)) {
    return res.status(403).send("Unauthorized")
  }
  req.session.user_id = user.id
  res.redirect("/urls")
})

app.post("/logout", (req, res) => {
  req.session.user_id = null
  res.redirect("/urls")
})

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    res.redirect(urlDatabase[req.params.shortURL].longURL)
  }
  else {
    return res.status(403).send("ID DOES NOT EXIST")
  }
})

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
    // const newTemplateVars = { ...templateVars, error: "Error please login to access this page!!" }
    res.redirect("/login?e=" + encodeURIComponent('Error please login to access this page!!'));
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const test = req.session
  console.log('Cookies: ', test)
  const user_id = req.session["user_id"]
  const user = users[user_id] || null
  const templateVars = { urls: urlsForUser(user_id, urlDatabase), user, error: "Please login/register to access this page" };
  // ... any other vars
  console.log("RIGHT HERE", urlsForUser(user_id, urlDatabase))
  res.render("urls_index", templateVars)
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL
  const longURL = urlDatabase[shortURL].longURL
  const user_id = req.session["user_id"]
  const user = users[user_id]
  const urlforUsers = urlsForUser(user_id, urlDatabase)
  if (!Object.keys(urlforUsers).length) {
    return res.status(403).send("YOU CANT EDIT THESE URLS")
  }
  const templateVars = { shortURL: shortURL, longURL: longURL, user: user };
  res.render("urls_show", templateVars);
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get('/register', (req, res) => {
  const user_id = req.session["user_id"]
  const user = users[user_id]
  const templateVars = { urls: urlDatabase, user };
  res.render("register", templateVars)
})

app.get('/login', (req, res) => {
  const user_id = req.session["user_id"]
  const user = users[user_id]
  const error = req.query.e
  const templateVars = { urls: urlDatabase, user, error };
  res.render("login", templateVars)
})



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
