const Mongo = require('mongodb')
const MongoClient = Mongo.MongoClient;
const ip = require("../ip.js");
const url = 'mongodb://'+ ip.ip +':27017';

//callback関数に検索結果を適用する。
exports.aggregate = function(collectionName,key){
  return new Promise(function(resolve,reject){
    MongoClient.connect(url,{ useNewUrlParser:true },function(error, database) {
      if (error) reject(error);
      const dbo = database.db("Data");
      dbo.collection(collectionName).aggregate(key).toArray(function(err, result) {
        if (err) reject(err);
        database.close();
        resolve(result)
      });
    });
  })
  .catch(function(err){
    console.log(err);
  })
};

//ObjectをDBに挿入する
exports.insert = function(collection,key){
  return new Promise(function(resolve,reject){
    MongoClient.connect(url,{ useNewUrlParser:true },function(error, database) {
      if (error) reject(error);
      const dbo = database.db("Data");
      dbo.collection(collection).insertOne(key, function(err, result) {
        if (err) reject(err);
        database.close();
        resolve(result);
      });
    });
  })
  .catch(function(err){
    console.log(err);
  })
}

// userの認証
exports.userCheck = function(checkuser){
  if(!(checkuser._id && checkuser.sessionkey)){
    checkuser._id = "";
    checkuser.sessionkey = "";
  }
  return new Promise(function(resolve,reject){
    MongoClient.connect(url,{ useNewUrlParser:true },function(error, database) {
      if(error) reject(error);
      const dbo = database.db("Data");
      const key = [{$match:{_id:checkuser._id,sessionkey:checkuser.sessionkey}}];
      dbo.collection("user").aggregate(key).toArray(function(err, result) {
        if (err) reject(err);
        database.close();
        if(result[0]){
          resolve(result[0])
        }else {
          resolve(null);
        }
      });
    });
  })
  .catch(function(err){
    console.log(err);
  })
}

exports.ObjectID = Mongo.ObjectID;

exports.favorite = function (userId,targetId,favorite){
  let database = null;
  let Data = null;
  let targetObjId = Mongo.ObjectID(targetId);
  return new Promise((resolve,reject)=>{
    open().then((db)=>{
        database = db;
        return db.db("Data");
    })
    .then((data)=>{
        Data = data;
        if(favorite === 1){
          return Promise.all([
            Data.collection("question").updateOne({_id:targetObjId},{$addToSet:{"favorite":userId}}),
            Data.collection("user").updateOne({_id:userId},{$addToSet:{"favorite":targetId}})
          ])
        }else if(favorite === 0){
          return Promise.all([
            Data.collection("question").updateOne({_id:targetObjId},{$pull:{"favorite":userId}}),
            Data.collection("user").updateOne({_id:userId},{$pull:{"favorite":targetId}})
          ])
        }
    })
    .then(()=>{
      const matchKey = [
        {$match:{_id:targetObjId}},
        {$project:{favorite:{$size:"$favorite"}}}
      ];
      Data.collection("question").aggregate(matchKey).toArray((err,result)=>{
        if(err) reject(err);
        database.close()
        resolve({status:"success",favorite:result[0].favorite})
      })
    })
    .catch((err)=>{
      if(database) database.close();
      reject(err);
    })
  });
}
//投票
exports.vote = function (user,id,index){
  let database = null;
  let userCollection = null;
  const key = {_id:Mongo.ObjectID(id)};
  return new Promise((resolve,reject) => {
    open().then((db)=>{
        database = db;
        return db.db("Data").collection('question')
    })
    .then((users)=>{
        userCollection = users;
        let prom = Promise.resolve();
        for(let i = 0; i<index.length; i++){
          if(index[i] == "1"){
            let update = {$addToSet:{[`answers.${i}.voter`]: user._id}};
            prom = prom.then(()=>{
              return userCollection.updateOne(key,update);
            })
          }
        }
        return prom
    })
    .then(()=>{
        return userCollection.update(key,{$addToSet:{voters:user._id}})
    })
    .then(()=>{
        const matchKey = [
          {$match:key},
          {$unwind:"$answers"},
          {$group:{
            _id:"$_id",
            answers:{$push:{
              answer:"$answers.answer",
              "total":{$size:"$answers.voter"}
            }},
            total:{$first:{$size:"$voters"}},
            comment:{$first:{$size:"$comment"}},
            favorite:{$first:{$size:"$favorite"}},
          }}
        ]
        userCollection.aggregate(matchKey).toArray((err,result)=>{
          if(err) reject(err);
          database.close()
          resolve(result[0]);
        });
    })
    .catch((err)=>{
      if(database) database.close();
      reject(err);
    })
  })
}
function open(){
  return new Promise((resolve, reject)=>{
    MongoClient.connect(url,{ useNewUrlParser: true },(err, db) => {
      if (err) {
        reject(err);
      } else {
        resolve(db);
      }
    });
  });
}
// sessionkey挿入
exports.session = function(id,sessionkey){
  return new Promise(function(resolve,reject){
    MongoClient.connect(url,{ useNewUrlParser:true },function(error, database) {
      if (error) throw error;
      const dbo = database.db("Data");
      dbo.collection("user").update({_id:id},{$set:{'sessionkey':sessionkey}},
      function(err, res) {
        if (err) throw err;
        resolve();
      });
    });
  })
  .catch(function(err){
    console.log(err);
  })
}
