var express = require('express');
var router = express.Router();

const dbo = require('../lib/mongo');
const post = require('./post');
const search = require('./search');
const vote = require('./vote');
const favorite = require('./favorite');
const home = require('./home');
const login = require('./login');
const follow = require('./follow');
const insertuser = require('./insertuser');

router.get('/',function(req,res,next){
  console.log("get",req.cookies._id && req.cookies.sessionkey);
  if(req.cookies._id && req.cookies.sessionkey){
    next();
  }else{
    if(req.url == '/login' || req.url == '/search'){
      next();
    }else {
      res.redirect('/login');
    }
  }
});
router.post('/',function(req,res,next){
  console.log("post",req.cookies._id && req.cookies.sessionkey);
  if(req.cookies._id && req.cookies.sessionkey){
    next();
  }else{
    if(req.url == '/login' || req.url == '/search' || req.url == '/home'){
      next();
    }else {
      res.json('err');
    }
  }
})

router.get('/',home.get);
router.post('/home',home.post);

router.get('/search',search.get);
router.post('/search',search.post);

router.post('/post',post.post);

router.post('/vote',vote.post);

router.post('/favorite',favorite.post);

router.get('/follow',follow.get);

router.post('/insertuser',insertuser.post);

router.get('/usercreate',function(req,res){
  res.render('usercreate');
});

router.get('/login',function(req,res){
  if(req.cookies._id && req.cookies.sessionkey){
    res.redirect('/');
  }else {
    res.render('login');
  }
});
router.post('/login',login.post);

module.exports = router;
