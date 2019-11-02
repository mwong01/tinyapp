const express = require("express");
const app = express();
const PORT = 8080;

const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const createError = require('http-errors');
const bcrypt = require('bcrypt');

const {getUserByEmail} = require('./helpers.js');
const {uniqueUserId} = require('./helpers.js');
const {generateRandomString} = require('./helpers.js');

app.set("view engine", "ejs");
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ["key1", "key2"],
  maxAge: 24 * 60 * 60 * 1000
}));

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  b6UTxQ: { longURL: "http://www.tsn.ca", userID: "aJ48lW" },
  aAa123: { longURL: "http://www.amazon.com", userID: "aJ48lW" },
  i3BoGr: { longURL: "http://www.google.ca", userID: "userRandomID" }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
  },
  "aJ48lW": {
    id: "aJ48lW",
    email: "a@a.com",
    password: bcrypt.hashSync("a", 10)
  }
};

//lookup if email is already registered
function checkPassword(user, password) {
  return bcrypt.compareSync(password, user.password);
}

// check if url is for the registered user
function urlsForUser(id) {
  let userURLs = {};
  for (url in urlDatabase) {
    if (id === urlDatabase[url].userID) {
      userURLs[url] = urlDatabase[url];
    }
  }
  if (userURLs === []) {
    return false;
  }
  return userURLs;
}

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/urls/new", (req, res) => {
  let userId = req.session.user_id;
  let username;
  if (users[userId]) {
    username = users[userId].email;
    let templateVars = { username };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.post("/urls", (req, res) => {
  urlDatabase[generateRandomString()] = {longURL: req.body.longURL, userID: req.session.user_id };
  res.redirect("/urls/");
});

app.get("/urls", (req, res) => {
  let userId = req.session.user_id;
  let username;
  if (users[userId]) {
    username = users[userId].email;
    let templateVars = { urls: urlsForUser(userId), username};
    res.render("urls_index", templateVars);
    return;
  } else {
    // res.redirect("/login");
    res.status(400);
    res.send("User is not logged in.");
  }
});

app.get("/register", (req, res) => {
  let userId = req.session.user_id;
  let username;
  if (users[userId]) {
    username = users[userId].email;
    res.redirect("/urls");
    return;
  }
  let templateVars = { username };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  let userId = req.session.user_id;
  let username;
  if (users[userId]) {
    username = users[userId].email;
    res.redirect("/urls");
    return;
  }
  let templateVars = { username };
  res.render("urls_login", templateVars);
});

app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.send(createError(400, "Email or password not found"));
  } else if (getUserByEmail(req.body.email, users)) {
    res.send(createError(400, "Email already exists."));
  } else {
    let id = uniqueUserId();
    users[id] = { id: id, email: req.body.email, password: bcrypt.hashSync(req.body.password, 10) };
    req.session.user_id = id;
    res.redirect("/urls");
  }
});

app.post("/login", (req, res) => {
  const user = getUserByEmail(req.body.email, users);
  if (user && checkPassword(user, req.body.password)) {
    req.session.user_id = user.id;
    res.redirect("/urls");
  } else {
    res.status(400);
    res.send("Email or password incorrect.");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
});

app.get("/urls/:shortURL", (req, res) => {
  let userId = req.session.user_id;
  let username;
  if (users[userId]) {
    username = users[userId].email;
  } else {
    res.send("Please login or register to continue.");
    return;
  }
  if (!urlDatabase[req.params.shortURL]) {
    res.status(400);
    res.send("URL is not valid.");
    return;
  }
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, username };
  res.render("urls_show", templateVars);
});

// check to see if server is connected
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    let longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
    return;
  }
  if (!urlDatabase[req.params.shortURL]) {
    res.status(400);
    res.send("URL is not valid.");
    return;
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (urlDatabase[req.params.shortURL].userID === req.session.user_id) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(400);
    res.send("User does not have permissions to change URL");
  }
});

app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];
  // console.log(req.body);
  // console.log(shortURL)
  // if(!urlsForUser(req.session.user_id).shortURL) {
  //   res.status(400).send("Not exist");
  // }
  if (longURL && longURL.userID === req.session.user_id) {
    urlDatabase[shortURL].longURL = req.body.longURL;
    res.redirect("/urls");
    return;
  } else {
    res.redirect("/login");
  }
});
