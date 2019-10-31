const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const cookieParser = require('cookie-parser');
const createError = require('http-errors');
const bcrypt = require('bcrypt');

app.set("view engine", "ejs");
app.use(cookieParser());

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

const urlDatabase = {
  b6UTxQ: { longURL: "http://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "http://www.google.ca", userID: "userRandomID" }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "aJ48lW": {
    id: "aJ48lW",
    email: "a@a.com",
    password: "a"
  }
};

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));


function generateRandomString() {
  let randStr = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    randStr += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return randStr;
}

//lookup if email is already registered
function emailExists(email, password) {
  for (let id in users) {
    if (users[id].email === email && users[id].password === password) {
      return id;
    }
  }
  return null;
}

// check if url is for the registered user
function urlsForUser(id) {
  let userURLs = {};
  for (url in urlDatabase) {
  // console.log(urlDatabase[url].userID);
    if (id === urlDatabase[url].userID) {
      userURLs[url] = urlDatabase[url];
    }
  }
  if (userURLs === []) {
    return false;
  }
  return userURLs;
}

//generate unique user id
function uniqueUserId() {
  let randStr = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < 10; i++) {
    randStr += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return randStr;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls/new", (req, res) => {
  let userId = req.cookies.user_id;
  let username;
  if (users[userId]) {
    username = users[userId].email;
    let templateVars = { username };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/urls/login");
  }
});

app.post("/urls", (req, res) => {
  // console.log(req.body,);  // Log the POST request body to the console
  // console.log(generateRandomString());
  urlDatabase[generateRandomString()] = {longURL: req.body.longURL, userID: req.cookies.user_id };
  res.redirect("/urls/");
});

app.get("/urls", (req, res) => {
  // console.log('users', users);
  let userId = req.cookies.user_id;
  let username;
  if (users[userId]) {
    username = users[userId].email;
  }
  // console.log('username----->>>>>>>', username);
  let templateVars = { urls: urlsForUser(userId), username};
  res.render("urls_index", templateVars);
});

app.get("/urls/register", (req, res) => {
  let userId = req.cookies.user_id;
  let username;
  if (users[userId]) {
    username = users[userId].email;
  }
  let templateVars = { username };
  res.render("urls_register", templateVars);
});

app.get("/urls/login", (req, res) => {
  let userId = req.cookies.user_id;
  let username;
  if (users[userId]) {
    username = users[userId].email;
  }
  let templateVars = { username };
  res.render("urls_login", templateVars);
});

app.post("/urls/register", (req, res) => {
  // let users = { id: users.id, email: email, password: password };
  console.log('post users', users);
  if (req.body.email === "" || req.body.password === "") {
    res.send(createError(400, "Email or password not found"));
  } else if (emailExists(req.body.email)) {
    res.send(createError(400, "Email already exists."));
  } else {
    let id = uniqueUserId();
    users[id] = { id: id, email: req.body.email, password: req.body.password };
    res.cookie("user_id", id);
    res.redirect("/urls");
  }
});

app.post("/urls/login", (req, res) => {
  console.log('aaaaaaaaa', req.body);
  if (emailExists(req.body.email, req.body.password)) {
    res.cookie("user_id", emailExists(req.body.email, req.body.password));
    res.redirect("/urls");
  } else {
    res.status(400);
    res.send("Email or password incorrect.");
  }

});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});


app.get("/urls/:shortURL", (req, res) => {
  let userId = req.cookies.user_id;
  let username;
  if (users[userId]) {
    username = users[userId].email;
  }
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, username };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  // console.log(longURL);
  console.log(urlDatabase);
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if(users === req.cookies.user_id) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.redirect("/urls/login");
  }
  
});

app.post("/urls/:id", (req, res) => {
  console.log(req.body);
  if(users === req.cookies.user_id) {
    urlDatabase = {shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL}
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];
  urlDatabase[shortURL] = req.body.longURL;
  // console.log(req.body);
});

