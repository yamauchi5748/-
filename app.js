const express = require('express');
const cookieParser = require('cookie-parser')
const app = express();
const bodyParser = require('body-parser');
const indexRouter = require('./routes/index');

// 外部から参照できるファイルを指定
app.use(express.static('views'));
// clientから送られてくるデータを扱いやすい形式に変換
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ type: 'application/json' }));
// cookieの設定
app.use(cookieParser());

// アクセスしてきたときに最初に実行される処理
app.use(function(req,res,next){
  console.log("url\n"+req.url);
  console.log("セッション\n"+JSON.stringify(req.session));
  console.log("cookie\n"+JSON.stringify(req.cookies));
  console.log("受信データ\n");
  console.log("POST\n",JSON.stringify(req.body));
  console.log("GET\n",JSON.stringify(req.query));
  next();
});
app.set('view engine', 'ejs');
app.use(indexRouter);

app.listen(80);