const express = require("express");

const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const jwt = require("jsonwebtoken");
const dbPath = path.join(__dirname, "twitterClone.db");
app = express();
app.use(express.json());
const bcrypt = require("bcrypt");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server start running on http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error :${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

app.post("/register/", async (request, response) => {
  const { username, password, name, gender } = request.body;
  const userArray = `select * from user where username ="${username}"`;
  const dbArray = await db.get(userArray);
  const hashedPassword = await bcrypt.hash(password, 10);

  if (dbArray !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    if (password.length < 6) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createArray = `insert into user(username,password,name,gender)
        values("${username}","${hashedPassword}","${name}","${gender}")`;
      await db.run(createArray);
      response.status(200);
      response.send("User created successfully");
    }
  }
});
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const userLoginArray = `select * from user where username ="${username}"`;
  const dbLoginArray = await db.get(userLoginArray);
  if (dbLoginArray === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    isPasswordVerified = await bcrypt.compare(password, dbLoginArray.password);
    if (isPasswordVerified === true) {
      const payload = { username: username };

      const jwtToken = jwt.sign(payload, "suresh");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

const authenticateToken = (request, response, next) => {
  let jetToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (authHeader === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "suresh", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        next();
      }
    });
  }
};

app.get("/user/tweets/feed/", authenticateToken, async (request, response) => {
  const { limit, offset } = request.query;
  //console.log(limit);
  const userTweets = `select username,tweet,date_time as dateTime from (tweet INNER JOIN follower
     ON following_user_id = user_id ) NATURAL JOIN user limit ${limit} offset ${offset}
     ORDER BY date_time DESC ;`;
  const dbServer = await db.all(userTweets);
  response.send(dbServer);
});

app.get("/user/following/", authenticateToken, async (request, response) => {
  const userFollowing = `select username as name from user INNER JOIN follower ON user_id
    = following_user_id ;`;
  const dbFollower = await db.all(userFollowing);
  response.send(dbFollower);
});

app.get("/user/followers/", authenticateToken, async (request, response) => {
  const userFollowing = `select username as name from user INNER JOIN follower ON user_id
    = follower_user_id;`;
  const dbFollower = await db.all(userFollowing);
  response.send(dbFollower);
});

app.get("/tweets/:tweetId/", authenticateToken, async (request, response) => {
  const { tweetId } = request.params;
  const tweetIdArray = `select `;
});
app.get("/user/tweets/", authenticateToken, async (request, response) => {
  const tweetArray = `select tweet,sum(like_id) as likes,sum(reply) as 
  replies,date_time as dateTime 
  from (tweet JOIN like) JOIN reply ;`;
  const dbTweet = await db.all(tweetArray);
  response.send(dbTweet);
});

app.get(
  "/tweets/:tweetId/likes/",
  authenticateToken,
  async (request, response) => {
    const { tweetId } = request.params;
    const tweetLikeArray = `select like from tweet join like where
    tweet_id = ${tweetId}; `;
    const dbLikeArray = await db.get(tweetLikeArray);
    response.send(dbLikeArray);
  }
);
app.get(
  "/tweets/:tweetId/replies/",
  authenticateToken,
  async (request, response) => {
    const { tweetId } = request.params;
    const tweetReplyArray = `select reply from tweet join reply where
      tweet_id = ${tweetId};`;
    const dbReply = await db.get(tweetReplyArray);
  }
);

app.post("/user/tweets/", authenticateToken, async (request, response) => {
  const { tweet } = request.body;
  const createTweetArray = `insert into tweet (tweet)
      values ("${tweet}");`;
  await db.run(createTweetArray);
  response.send("Created a Tweet");
});

app.delete(
  "/tweets/:tweetId/",
  authenticateToken,
  async (request, response) => {
    const { tweetId } = request.params;
    const deleteArray = `delete form tweet where tweet_id = ${tweetId};`;
    await db.run(deleteArray);
    if (tweetId !== undefined) {
      response.send("Tweet Removed");
    } else {
      response.status(401);
      response.send("Invalid Request");
    }
  }
);

module.exports = app;
