const mongoose = require("mongoose");
const bycrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");

// model and schema
const userSchema = mongoose.Schema({
  name: {
    type: String,
    maxlength: 50,
  },
  email: {
    type: String,
    trim: true, // remove space
    unique: 1,
  },
  password: {
    type: String,
    minlength: 5,
  },
  lastname: {
    type: String,
    maxlength: 50,
  },
  role: {
    type: Number,
    default: 0,
  },
  image: String,
  token: {
    type: String,
  },
  tokenExp: {
    type: Number,
  },
});

// 등록하는 비밀번호 암호화
userSchema.pre("save", function (next) {   //  pre() 는 'save()'전에 실행
  let user = this;
  if (user.isModified("password")) {
    //password가 수정되었을 때만? 변경 사항
    bycrypt.genSalt(saltRounds, function (err, salt) {
      if (err) return next(err);
      bycrypt.hash(user.password, salt, function (err, hash) {
        if (err) return next(err);
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
}); 


// 비밀번호 검증 function
userSchema.methods.comparePassword = function (plainPassword, cb) {
  // plainPassword를 암호화 해서
  bycrypt.compare(plainPassword, this.password, function (err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);                                                         
  });
};

// 토큰 생성
userSchema.methods.generateToken = function (cb) {
  let user = this;

  // jsonwebtoken으로 생성

  let token = jwt.sign(user._id.toHexString(), "secretToken");
  // user._id + 'secretToken' --> 토큰. secretToken을 넣으면 user id 파악가능
  user.token = token;
  user.save(function (err, user) {
    if (err) return cb(err);
    cb(null, user);
  });
};

// 토큰 찾기
userSchema.statics.findByToken = function(token, cb){
  let user = this;

  // 토큰을 decode한다
  jwt.verify(token, 'secretToken', function(err, decoded){

    // 유저 아이디를 이용해서 유저를 찾고
    // 클라이언트 토큰과 db토큰이 일치하는지 확인

    user.findOne({"_id": decoded, "token": token}, function(err, user){
      if(err) return cb (err);
      cb(null, user);
    })
  })
}





const User = mongoose.model("User", userSchema);
// model은 schema를 감싸준다
module.exports = { User };
