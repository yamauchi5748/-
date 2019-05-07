const db = require('../lib/mongo');
exports.post = function(req,res){
  if(!(req.cookies._id && req.cookies.sessionkey)){
    res.json({status:"error"});
    return;
  }
  db.userCheck(req.cookies)
  .then(()=>{
    let id;
    try{
      id = db.ObjectID(req.body.id);
    }catch(e){
      return Promise.reject("ObjectIDに変換できませんでした");
    }
    const key = [
      {$match:{_id:id}},
      {$addFields:{
        voted:{
          $in:[req.cookies._id,"$voters"]
        }
      }}
    ]
    return db.aggregate("question",key);
  })
  .then((result)=>{
    if(result[0] && !result[0].voted){
      return result[0];
    }else{
      return Promise.reject("該当する投稿がないかすでに投票しています");
    }
  })
  .then((question)=>{
    if(indexCheck(req.body.index,question)){
      return question;
    }
    return  Promise.reject("indexが正しい値でない  index:"+req.body.index);
  })
  //投票を行う
  .then((question)=>{
    return db.vote(req.cookies,question._id,req.body.index);
  })
  .then((result)=>{
    res.json(result);
  })
  //エラーは全てここで取得する
  .catch((err)=>{
    console.error(err);
    res.json(false);
  })
}

//indexがフォーマット通りになっているかチェック
function indexCheck(index,question){
  //質問の選択肢の配列の長さととindexの配列の長さが同じかどうかのチェック
  if(!(Array.isArray(index) && index.length == question.answers.length)){
    return false;
  }
  //フォーマット通りになっているかのチェック
  let count = 0;
  for(let val of index){
    if(!(val === 0 || val === 1)){
      return false;
    }
    count += parseInt(val);
  }
  if(question.type == "radio" && count == 1){
    return true;
  }else if(question.type == "checkbox" && count >= 1){
    return true;
  }else{
    return false;
  }
}
function questionIdCheck(id){
  if(!id){
    return "";
  }
  return id.toString();
}
