const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

let templateVars = {};

function generateRandomString() {
  let randStr = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for ( let i = 0; i < 6; i++ ) {
     randStr += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return randStr;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  // console.log(generateRandomString());
  // res.send("Ok");         // Respond with 'Ok' (we will replace this)
  urlDatabase[generateRandomString()] = req.body.longURL;
  res.redirect("/urls/");
  
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  console.log(longURL);
  console.log(urlDatabase);
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  console.log(req.body);
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];
  urlDatabase[shortURL] = req.body.longURL;
  // console.log(req.body);
  res.redirect("/urls");
})

app.post("/login", (req, res) => {
  console.log(req.body);
  res.cookie("username", req.body.username);
  res.redirect("/urls")
})

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
})