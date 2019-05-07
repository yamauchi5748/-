const dbo = require('../lib/mongo');

// 検索処理　１単語のみの検索に対応
exports.get = function(req,res){
  let obj = {
    sort:sortCheck(req.query.sort),
    order:orderCheck(req.query.order),
    text:textCheck(req.query.text),
    page:"search",
    index:0
  }
  res.render("search",obj);
}

exports.post = function(req,res){
  // 検索キーを生成
  let keyObj = createKeyObj(
    sortCheck(req.body.sort),
    orderCheck(req.body.order),
    textCheck(req.body.text),
    indexCheck(req.body.index,req.body.type),
    pageCheck(req.body.page),
    req.cookies
  );
  console.log(req.cookies);
  //  未ログインなら検索結果だけを返す
  if(!(req.cookies._id && req.cookies.sessionkey)){
    dbo.aggregate("question",keyObj)
    .then(function(result){
      /**** 検索結果を整形する ****/
      let conFlg = (result.length == 15); //次の該当項目が存在するかどうか
      let size = result.length;
      for(let i = 0; i < size; i++){
        // どのリクエストからか判別
        if(req.body.type == "new"){
          if(result[i]._id == req.body.topId){
            result.splice(i, size-i);
            break;
          }
        }else{
          if(result[i]._id == req.body.bottomId){
            result.splice(0, i+1);
            i = 0;
            size = result.length;
          }
        }
      }
      //　レスポンスオブジェクトの生成
      const response = {
        result:result,
        conFlg:conFlg
      }
      res.json(response);
    });
  }
  // ログイン状態かチェック
  if(req.cookies._id && req.cookies.sessionkey){
    dbo.userCheck(req.cookies)
    .then(function(usercheck){
      if(usercheck){
        return true;
      }else{
        return false;
      }
    })
    .then(function(usercheck) {
      if(usercheck){
        // ユーザー認証成功
        //検索して結果を返す
        dbo.aggregate("question",keyObj)
        .then(function(result){
          /**** 検索結果を整形する ****/
          let conFlg = (result.length == 15); //次の該当項目が存在するかどうか
          let size = result.length;
          for(let i = 0; i < size; i++){
            // どのリクエストからか判別
            if(req.body.type == "new"){
              if(result[i]._id == req.body.topId){
                result.splice(i, size-i);
                break;
              }
            }else{
              if(result[i]._id == req.body.bottomId){
                result.splice(0, i+1);
                i = 0;
                size = result.length;
              }
            }
          }
          //　レスポンスオブジェクトの生成
          const response = {
            result:result,
            conFlg:conFlg
          }
          res.json(response);
        })
        .catch(function(error) {
          console.log("question aggregateエラー",error);
        });
      }else{
        // ユーザー認証失敗ならnullを返す
        console.log("user認証失敗",user);
        res.json(null);
      }
    })
    .catch(function(error) {
      console.log("userCheckエラー",error);
    });
  }
};

/**
 *textの形式をチェック
 *引数param
 *@ <String> req.body.text
 *return <String> text
**/
function textCheck(text){
  if(text == undefined){
    text = "";
  }
  return text.toString();
}

/**
 *sortの形式をチェック
 *引数param
 *@ <String> req.body.sort
 *return <String> total or sort
**/
function sortCheck(sort) {
  let check = (sort == "total") || (sort == "good") || (sort == "date");
  if(!check){
    return "date";
  }else{
    return sort;
  }
}

/**
 *orderの形式をチェック
 *引数param
 *@ <int> req.body.order
 *return <int> -1 or order
**/
function orderCheck(order) {
  let check = (order == 1) || (order == -1);
  if(!check){
    return -1;
  }else{
    return parseInt(order);
  }
}

/**
 *indexの形式をチェック
 *引数param
 *@ <int> req.body.index
 *@ <String> req.body.type
 *return <int> 0 or index
**/
function indexCheck(num,type){
  let index;
  if(Number.isNaN(index = parseInt(num)) || type == "new"){
    return 0;
  }
  return index;
}

/**
 *pageの形式をチェック
 *引数param
 *@ <String> req.body.page
 *return <String> "search" or page
**/
function pageCheck(page){
  if(page == "user" || page == "home"){
    return page.toString();
  }else{
    return "search";
  }
}

/**
 *検索キーを生成して返す
 *引数param
 *@ <String> req.body.sort
 *@ <int> req.body.order
 *@ <String> req.body.text
 *@ <int> req.body.index
 *@ <object> req.cookies.user
 *return <object> keyObj
**/
function createKeyObj(sort,order,text,index,page,user) {
  if(!user){
    user = {_id:""};
  }
  const key = {$regex:".*"+text+".*"};
  let keyObj = [];

  keyObj[0] = {$lookup:{
      from:"user",
      let:{senderId:"$senderId"},
      pipeline:[{$match:{$expr:{$eq:["$$senderId","$_id"]}}}],
      as:"inventory"
  }};

  if(page == "user"){
    keyObj[1] = {$match:{"senderId":user._id}};
  }else{
    keyObj[1] = {$match:{$or:[{query:key},{"answers.answer":key},{"senderId":key}]}};
  }

  keyObj[2] = {$unwind:"$answers"};

  keyObj[3] = {$unwind:"$inventory"};

  keyObj[4] = {$group:{
    _id:"$_id",
    senderId:{$first:"$senderId"},
    query:{$first:"$query"},
    type:{$first:"$type"},
    answers:{$push:{
      answer:"$answers.answer",
      total:{$size:"$answers.voter"}
    }},
    answer:{$push:{
      answer:"$answers.answer"
    }},
    voters:{$first:"$voters"},
    comment:{$first:{$size:"$comment"}},
    favorite:{$first:"$favorite"},
    date:{$first:"$date"},
    inventory:{$first:"$inventory"}
  }};

  keyObj[5] = {$project:{
    _id:1,
    senderId:1,
    query:1,
    type:1,
    total:{$size:"$voters"},
    comment:1,
    favorite:{$size:"$favorite"},
    date:1,
    "inventory.nickname":1,
    "inventory.img":1,
    answers:{
      $cond:{
        if:{$in:[user._id,"$voters"]},
        then:"$answers",
        else:"$answer"
      }
    },
    result:{
      $cond:{
        if:{$in:[user._id,"$voters"]},
        then:true,
        else:false
      }
    },
    myfavorite:{
      $cond:{
        if:{$in:[user._id,"$favorite"]},
        then:true,
        else:false
      }
    }
  }};

  if(sort == "date"){
    keyObj[6] = {$sort:{date:order}};
  }else if(sort == "favorite"){
    keyObj[6] = {$sort:{favorite:order}};
  }else if(sort == "total"){
    keyObj[6] = {$sort:{total:order}};
  }

  keyObj[7] = {$skip:index};
  keyObj[8] = {$limit:15};

  return keyObj;
}
