const dbo = require('../lib/mongo');
//アカウント登録処理
exports.post = function(req,res){
  const param = req.body;
  console.log(param);
  let check = (idCheck(param.inputId) && passCheck(param.inputPass) &&
      nameCheck(param.inputName) && genderCheck(param.inputGender)  &&
      areaCheck(param.inputArea) && birthdayCheck(param.inputBirthYear,param.inputBirthMonth,param.inputBirthDay));
  if(check){
    const userObj = {
      _id:param.inputId.toString(),
      pass:param.inputPass.toString(),
      gender:param.inputGender.toString(),
      birthday:getBirthday(param.inputBirthYear, param.inputBirthMonth, param.inputBirthDay),
      age:getAge(parseInt(param.inputBirthYear), parseInt(param.inputBirthMonth), parseInt(param.inputBirthDay)),
      area:param.inputArea.toString(),
      nickname:param.inputName.toString(),
      img:"default.jpg",
      favorite:[],
      follow:[],
      follower:[]
    }
    console.log(userObj);
    dbo.aggregate("user",[{$match:{_id:userObj._id}}])
    .then(function(result){
      if(!result[0]){
        dbo.insert("user",userObj)
        .then(function(result){
          res.render('signup');
        },
        function(err){
          console.log("挿入エラー");
          res.redirect("usercreate");
        });
      }else{
        console.log("既にそのIDは使われています");
        res.redirect("usercreate");
      }
    },
    function(err){
      console.log("検索エラー");
      res.redirect("usercreate");
    });
  }else {
    console.log("不正な値を受信");
    res.redirect("usercreate");
  }
}

function idCheck(id){
  if(id){
    return true;
  }
  console.log("idエラー")
  return false;
}

function passCheck(pass){
  if(pass && (pass.length > 7) ){
    return true;
  }
  console.log("passエラー")
  return false;
}

function nameCheck(name){
  if(name){
    return true;
  }
  console.log("nameエラー")
  return false;
}

function genderCheck(gender){
  if( (gender == 0) || (gender == 1) ){
    return true;
  }
  console.log("genderエラー")
  return false;
}

function areaCheck(area){
  const prefectures = ['北海道', '青森', '岩手',
    '宮城', '秋田', '山形', '福島', '茨城',
    '栃木', '群馬', '埼玉', '千葉', '東京',
    '神奈川', '新潟', '富山', '石川', '福井',
    '山梨', '長野', '岐阜', '静岡', '愛知',
    '三重', '滋賀', '京都', '大阪', '兵庫',
    '奈良', '和歌山', '鳥取', '島根', '岡山',
    '広島', '山口', '徳島', '香川', '愛媛',
    '高知', '福岡', '佐賀', '長崎', '熊本',
    '大分', '宮崎','鹿児島', '沖縄'
  ];
  for(let i = 0; i < prefectures.length; i++){
    if(area == prefectures[i]){
      return true;
    }
  }
  console.log("areaエラー")
  return false;
}

function birthdayCheck(year,month,day){
  if(!(Number.isNaN(parseInt(year))) && !(Number.isNaN(parseInt(month))) && !(Number.isNaN(parseInt(day))) ){
    const date = new Date(year,month-1,day);
    if((year>1899) && (year<new Date().getYear()+1900) && date.getFullYear()==year && date.getMonth()==month-1 && date.getDate()==day){
      return true;
    }
  }
  console.log("birthdayエラー");
  return false;
}

function getBirthday(year,month,day){
  if(month < 10){
    month = "0" + month.toString();
  }
  if(day < 10){
    day = "0" + day.toString();
  }
  return (year.toString() + month + day);
}

function getAge(year,month,day){
  // Dateインスタンスに変換
  const birthDate = new Date(year, month-1, day);

  // 文字列に分解
  const y2 = birthDate.getFullYear().toString().padStart(4, '0');
  const m2 = (birthDate.getMonth() + 1).toString().padStart(2, '0');
  const d2 = birthDate.getDate().toString().padStart(2, '0');

  // 今日の日付
  const today = new Date();
  const y1 = today.getFullYear().toString().padStart(4, '0');
  const m1 = (today.getMonth() + 1).toString().padStart(2, '0');
  const d1 = today.getDate().toString().padStart(2, '0');

  // 引き算
  const age = Math.floor((Number(y1 + m1 + d1) - Number(y2 + m2 + d2)) / 10000);
  console.log(age);

  return age;
}
