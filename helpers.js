// Helper Functions

const getUserByEmail = function(email, database) {
  for (let userID in database) {
    if(database[userID].email === email) {
      return database[userID]
    }
  }
};

function uniqueUserId() {
  let randStr = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < 10; i++) {
    randStr += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return randStr;
}

module.exports = { 
  getUserByEmail,
  uniqueUserId
}