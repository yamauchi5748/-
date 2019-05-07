var key = {
  index:0,
  topId:"1",
  bottomId:"-1",
  type:"search"
};
var conFlg = false;
var newResultBox = [];
function connect(uri,data,callback,error){
  const req = new XMLHttpRequest();

  //レスポンスが返ってきたときの処理
  req.addEventListener("load",function(e) {
    console.log("connect");
    console.log("uri",uri);
    console.log("送信データ",data);
    console.log("受信データ",req.response);

    callback(req.response);
  })
  req.addEventListener("error",function(e){
    console.error(uri+"でエラーが起きています。");
    console.error("入力値:",data);
    if(error){
      error()
    }
  })
  req.responseType = "json"
  req.open('POST', uri);
  req.setRequestHeader("Content-type", "application/JSON");
  req.send(JSON.stringify(data));
}
function updateResult(response){
  const res = response.result;
  const result = document.getElementById("result");
  for(let index in res){
    const card = createCard(res[index]);

    result.appendChild(card);

    createBody(res,res[index]);
  }
  setActionVote();
  key.index += res.length;
  key.bottomId = res[res.length-1]._id;
  document.getElementById("loader").setAttribute('style','display:none;');
  conFlg = response.conFlg;
  console.log("done");
}

function addNewResult(){
  const result = document.getElementById("result");
  for(let index in newResultBox){
    const child = document.getElementById(key.topId + "-card");
    const card = createCard(newResultBox[index]);

    result.insertBefore(card,child);
    key.topId = newResultBox[index]._id;

    createBody(newResultBox,newResultBox[index]);
  }
  setActionVote();
  newResultBox.length = 0;
  this.setAttribute("style","display: none;");
  document.getElementById("noResulttext").setAttribute("style","display: none;");
}

function createCard(data){
  const card = document.createElement("div");
  card.setAttribute("id",data._id + "-card");
  card.setAttribute("class","card");
  card.setAttribute("style","margin-top:10px;");
  card.setAttribute("key",data._id);

  const header = document.createElement("div");
  header.setAttribute("class","card-header");
  header.setAttribute("role","tab");
  header.setAttribute("style","background-color:white");

  const img = document.createElement("img");
  img.setAttribute("class","rounded-circle");
  img.setAttribute("height","46");
  img.setAttribute("src","/image/" + data.inventory.img);
  img.setAttribute("align","top");
  img.setAttribute("onerror","this.src='/image/default.jpg'")
  header.appendChild(img);

  const label1 = document.createElement("label");
  label1.setAttribute("class","ml-3");
  label1.innerHTML = data.inventory.nickname;
  header.appendChild(label1);

  const label2 = document.createElement("label");
  label2.setAttribute("class","text-center text-muted");
  label2.innerHTML = "@" + data.senderId;
  header.appendChild(label2);

  const a = document.createElement("a");
  a.setAttribute("class","text-body ml-5");
  a.setAttribute("data-toggle","collapse");
  a.setAttribute("href","#" + data._id);
  a.setAttribute("role","button");
  a.setAttribute("aria-expanded","false");
  a.setAttribute("aria-controls","collapseOne");
  a.innerHTML = data.query;
  header.appendChild(a);

  const form = document.createElement("div");
  form.setAttribute("class","form-check-inline");
  header.appendChild(form);

  const i = document.createElement("i");
  i.setAttribute("class","far fa-chart-bar");
  i.innerHTML = data.total;
  form.appendChild(i);

  const label3 = document.createElement("label");
  label3.setAttribute("for",data._id + "-favorite");

  const inp = document.createElement("input");
  inp.setAttribute("id",data._id + "-favorite");
  inp.setAttribute("type","checkbox");
  inp.setAttribute("style","display:none;");
  inp.setAttribute("onclick","favorite(this)");
  if(data.myfavorite){
    inp.setAttribute("checked","true");
  }
  label3.appendChild(inp);

  const i2 = document.createElement("i");
  i2.setAttribute("id",data._id + "-star");
  if(data.myfavorite){
    i2.setAttribute("class","fas fa-star");
    i2.setAttribute("style","color:yellow");
  }else {
    i2.setAttribute("class","far fa-star");
    i2.setAttribute("style","color:#000000");
  }
  i2.textContent = " " + data.favorite;
  label3.appendChild(i2);

  form.appendChild(label3);

  const body = document.createElement("div");
  body.setAttribute("id",data._id);
  body.setAttribute("class","card-body collapse");
  body.setAttribute("role","tabpanel");
  body.setAttribute("aria-labelledby","headingOne");
  body.setAttribute("data-parent","#accordion");

  card.appendChild(header);
  card.appendChild(body);

  return card;
}

function createBody(array,data){
  const contents = document.getElementById(data._id);
  if(data.result){
    const canvas = document.createElement("canvas");
    contents.appendChild(canvas);
    graph(canvas,data)
  }else{
    contents.innerHTML =
    `<table class="table">
      <tbody>`
      +
      function(){
        let answers = "";
        for(let j in data.answers){
          answers +=
          `<tr>
            <td>
              <div class="custom-control custom-` + data.type + `">
                <input id=` + data._id + "-" + j + ` name=` + data._id + "-answer" + ` type=` + data.type + ` class="custom-control-input">
                <label class="custom-control-label" for=` + data._id + "-" + j +`>` + data.answers[j].answer + `</label>
              </div>
            </td>
          </tr>`
        }
        return answers;
      }()
      +
      `</tbody>
    </table>
    <button type="button" class="btn btn-primary" name="vote">投票</button>
    <div class="border-top"></div>`;
  }
}

function setActionVote(){
  const btns = document.getElementsByName("vote");
  for(let btn of btns){
    btn.addEventListener("click",function(e){
      const card = e.target.parentElement;
      const answers = document.getElementsByName(card.id + "-answer");
      const obj = {
        id:card.id,
        index:[]
      }
      for(let answer of answers){
        if(answer.checked){
          obj.index.push(1);
        }else{
          obj.index.push(0);
        }
      }
      connect("/vote/",obj,function(newResultBox){
        card.innerHTML = "";
        const canvas = document.createElement("canvas");
        card.appendChild(canvas);
        graph(canvas,newResultBox);
      })
    })
  }
}

function graph(canvas,array){
  canvas.parentNode.style.height= array.answers.length*60+"px";
  const chartData = function(data){
    const obj = {
      labels:[],
      datasets:[
        {
          label:"なし",
          data:[],
          backgroundColor: function(context) {
              console.log(this)
              var index = context.dataIndex;
              var value = context.dataset.data[index];
              return value < 0 ? 'red' :  // 赤で負値を描画する
                  index % 2 ? 'blue' :    // 負値でなければ、青と緑の交互
                  'green';
          }
        }
      ]
    };
    for(let d of data.answers){
      obj.labels.push(d.answer);
      obj.datasets[0].data.push(d.total);
    }
    return obj;
  }(array)
  new Chart(canvas, {
    // 作成するグラフの種類
    type: 'horizontalBar',
    // ラベルとデータセットを設定
    data: chartData,
    //オプション設定
    options: {
      legend: {
          display: false,            //詳細ラベルの表示
      },
      scales: {                      //軸設定
        yAxes: [{                    //表示設定
          stacked: false,
          //y軸の数字
          ticks: {
            min: 0,                   //最小値
            fontSize: 18,             //フォントサイズ
            stepSize: 10,             //軸間隔
            fontColor: "#00f"
          },
          //y軸グリッド
          gridLines:{           //グリッド設定
            display:true,
            color:"rgba(0,0,0,0.8)"
          }
        }],
        xAxes: [{                         //x軸設定
          stacked: false,
          categoryPercentage: 0.4,      //棒グラフ幅
          scaleLabel: {                 //軸ラベル設定
            display: true,             //表示設定
            fontSize: 18               //フォントサイズ
          },
          //x軸の数字
          ticks: {
            fontSize: 16,             //フォントサイズ
            fontColor:"#fff",
            tickMarkLength:1
          },
          //x軸グリッド
          gridLines:{           //グリッド設定
            display:true,
            color:"rgba(0,0,0,0.3)",
          }
        }],
      },
      animation:{
        duration:1500, //アニメーションにかける時間
        easing:"easeInQuad"
      },
      tooltips:{
        mode:'label' //マウスオーバー時に表示されるtooltip
      }
    }
  });
}
function favorite(btn){
  const req = new XMLHttpRequest();
  const data = {
    targetId:btn.parentElement.parentElement.parentElement.parentElement.getAttribute("key"),
    favorite:btn.checked ? 1 : 0
  }
  //レスポンスが返ってきたときの処理
  req.addEventListener("load",function(e) {
    console.log(req.response)
    if(req.response.status == "success"){
      document.getElementById(data.targetId + "-favorite").parentElement.lastElementChild.textContent = req.response.favorite;
      if(data.favorite === 1){
        document.getElementById(data.targetId + "-favorite").parentElement.lastElementChild.setAttribute("style","color:red;");
      }else {
        document.getElementById(data.targetId + "-favorite").parentElement.lastElementChild.setAttribute("style","color:#000000;");
      }
    }
  })
  req.responseType = "json"
  req.open('POST', 'favorite');
  req.setRequestHeader("Content-type", "application/JSON");
  req.send(JSON.stringify(data));
}
