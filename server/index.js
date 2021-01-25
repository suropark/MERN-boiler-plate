const express = require("express"); // express 모듈 가져오기
const app = express(); // function
const port = 5000;
const bodyParser = require("body-parser"); // 이제 express.js에 빌트인 되어있어 require 필요없나..?
const cookieParser = require("cookie-parser");
const { auth } = require("./middleware/auth");
const { User } = require("./models/User");
const config = require("./config/key");

// application/x-www-form-urlencoded 형태
app.use(bodyParser.urlencoded({ extended: true }));
//application/json 형태
app.use(bodyParser.json());

app.use(cookieParser());

const mongoose = require("mongoose");
mongoose
  .connect(config.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log("MongoDB Connected..."))
  .catch((err) => console.log(err));

app.post("/api/users/register", (req, res) => {
  // register route
  // 회원 가입 할 때 필요한 정보들을 client에서 가져오면
  // 그것들을 데이터 베이스에 넣어준다
  const user = new User(req.body);
  user.save((err, userInfo) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).json({
      success: true,
    });
  });
});

app.post("/api/users/login", (req, res) => {
  // login route
  // 1. 요청된 이메일이 DB에 있는지 확인
  User.findOne({ email: req.body.email }, (err, user) => {
    if (!user) {
      return res.json({
        loginSuccess: false,
        message: "해당된 이메일이 존재하지 않습니다",
      });
    }
    // 2. 이메일이 있다면 비밀번호가 맞는지 확인
    user.comparePassword(req.body.password, (err, isMatch) => {
      if (!isMatch)
        return res.json({
          loginSuccess: false,
          message: "비밀번호가 틀렸습니다",
        });
      // 3. 비밀번호가 같다면 token 생성
      user.generateToken((err, user) => {
        if (err) return res.status(400).send(err);

        // 토큰을 저장해야함. 쿠키 , 로컬스토리지 등 많음.
        res
          .cookie("x_auth", user.token)
          .status(200)
          .json({ loginSuccess: true, userId: user._id });
      });
    });
  });
});

// auth route -> 페이지 이동 때마다 권한 확인.
app.get("/api/users/auth", auth, (req, res) => {
  // auth에서 미들웨어가 통과했다는 것은 인증이 됐다는 뜻.
  res.status(200).json({
    _id: req.user._id,
    isAdmin: req.user.role === 0 ? false : true,
    isAuth: true,
    email: req.user.name,
  });
});

// logout route -> 토큰을 지워주면 됨
app.get("/api/users/logout", auth, (req, res) => {
  User.findOneAndUpdate({ _id: req.user._id }, { token: "" }, (err, user) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).send({ success: true });
  });
});

app.get("/", (req, res) => {
  res.send("Hello");
});

app.get("/api/hello", (req, res) => {
  res.send("hello react!")
});


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

// 클라이언트에서 보내주는 데이터를 Body-parser를 이용해 받을 수 있음
// postman을 이용해 api테스트 -> 지금 클라이언트가 없으니까.
