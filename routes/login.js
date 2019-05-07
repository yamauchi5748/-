const dbo = require('../lib/mongo');
//ログイン処理
exports.post = function(req,res){
  const newSessionkey = createSessionKey();
  let logid;
  let logpass;
  let key;
  let session;

  if(req.body.type == "session"){
    session = req.body.session;
    key = [{$match:{sessionkey:session}}];
  }else{
    logid = req.body.loginId;
    logpass= req.body.loginPass;
    key = [
      {$lookup:{
          from:"question",
          let:{userId:"$_id"},
          pipeline:[{$match:{$expr:{$eq:["$$userId","$senderId"]}}}],
          as:"inventory"
      }},
      {$match:{_id:logid,pass:logpass}},
      {$project:{
        followcount:{$size:"$follow"},
        followercount:{$size:"$follower"},
        favoritecount:{$size:"$favorite"},
        nickname:1,
        img:1,
        postcount:{$size:"$inventory"}
      }}
    ];
  }
  dbo.aggregate("user",key)
  .then(function(result){
    const user = result[0];
    if(user){
      dbo.session(user._id,newSessionkey);
      res.cookie('sessionkey', newSessionkey, {maxAge:259200, httpOnly:false});
      res.cookie('_id', user._id, {maxAge:259200, httpOnly:false});
      res.redirect("/");
    }else{
      res.redirect("login");
    }

  })
}

function createSessionKey(){
  const length = 10;

  // 生成する文字列に含める文字セット
  const c = "abcdefghijklmnopqrstuvwxyz0123456789";

  const cl = c.length;
  let sessionkey = "";
  for(var i=0; i<length; i++){
    sessionkey += c[Math.floor(Math.random()*cl)];
  }
  return sessionkey;
}
