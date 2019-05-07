const dbo = require('../lib/mongo');

exports.post = function(req,res){
  const key = req.body;
  const err = "err";
  let obj;

  /****受信オブジェクトが正当な形式かチェック****/
  let check = querycheck(key.query) && answersCheck(key.answers) && typeCheck(key.type);

  // ユーザー認証
  if(!req.cookies){
    res.json(err);
    return;
  }
  dbo.userCheck(req.cookies)
  .then(
  function(user) {
    //全ての認証に通ればDBに投稿内容を挿入する
    console.log(key);
    if(check && user){
      //ＤＢに挿入するオブジェクトを生成
      obj = createObj(key.query,key.answers,key.type,user);
      dbo.insert("question",obj)
      .then(
      function(result){
        //DBに挿入できたらクライアント側にsuccessを返す
        res.json("success");
      },
      function(err) {
        //DBに挿入できなかったらサーバーにlogを残し、クライアント側にerrを返す
        console.log("ＤＢに挿入失敗：データベースエラー　",err);
        res.json(err)
      });
    }else{
      /**
       *受信オブジェクトが不正な形式、もしくはユーザー認証に失敗したならサーバーにlogを残し、
       *errを返す
      **/
      console.log("不正なオブジェクトを受信、もしくはユーザー認証に失敗　",err);
      res.json(err);
    }
  })
}

/**
 *queryの形式をチェック
 *引数param
 *@ <String> req.body.query
 *return <boolean> check
**/
function querycheck(query){
  let check = false;
  if(query){
    query = query.toString();
    //質問の文字数が適当であるかチェック
    check = ( (query.length > 0) && (query.length < 256) );
  }
  return check;
}

/**
 *answersの形式をチェック
 *引数param
 *@ <array> req.body.answers
 *return <boolean> check
**/
function answersCheck(answers){
  let check = true;
  if(Array.isArray(answers)){
    //回答選択肢の数が適当であるかチェック
    if( (answers.length < 2) || (answers.length > 48) ){
      check = false;
    }
    for(let i in answers){
      answers[i] = answers[i].toString();
      //回答選択肢の文字数がそれぞれ適当であるかチェック
      if( (answers[i].length < 1) || (answers[i].length > 127) ){
        check = false;
      }
    }
    return check;
  }else {
    return false;
  }
}

/**
 *typeの形式をチェック
 *引数param
 *@ <String> req.body.type
 *return <boolean> check
**/
function typeCheck(type){
  //回答形式が適当であるかチェック
  let check = ( (type == "radio") || (type == "checkbox") );
  return check;
}

/**
 *投稿objを生成して返す
 *引数param
 **@ <String> req.body.query
 **@ <array> req.body.answers
 *@ <String> req.body.type
 *@ <object> req.body.user
 *return <object> obj
**/
function createObj(query,answers,type,user){
  let obj;
  const ans = [];

  for(let i in answers){
    ans[i] = {answer:answers[i],voter:[]};
  }
  obj = {
    query:query,
    answers:ans,
    type:type,
    voters:[],
    favorite:[],
    comment:[],
    img:[],
    date:new Date(),
    senderId:user._id
  }
  return obj;
}
