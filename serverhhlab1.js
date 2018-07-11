var express = require('express');
var wechat = require('wechat');
var redis = require("redis");
var mqtt = require('mqtt');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var path = require('path')
var wxconfig = require('./confighhlab');
var request = require('request');
var qs = require('querystring');
var bodyParser = require('body-parser');
var multer = require('multer');
var ejs = require('ejs');
var app = express();

app.engine('.html', ejs.__express);
app.set('view engine', 'html');
app.use(express.static(path.join(__dirname, 'views')))
app.use(cookieParser());
app.use(express.json());

var tokenValue={};
// var redisClient = redis.createClient();
// redisClient.on('ready',function(err){console.log('redisClient ready');});
// redisClient.on("error", function (err) {console.log("redisClient Error " + err);});
// var mqttClient = mqtt.connect({ port: 2568, host: 'www.mogudz.com', keepalive: 10000});   
// mqttClient.on('connect', function () {console.log("mqttjs connected");});
// mqttClient.on('close',function(packet){}); 

var config = {
  token: wxconfig.token,
  appid: wxconfig.appid,
  appsecret: wxconfig.appsecret,
  encodingAESKey: wxconfig.encodingAESKey,
  checkSignature: true // 可选，默认为true。由于微信公众平台接口调试工具在明文模式下不发送签名，所以如要使用该测试工具，请将其设置为false
};

function replySMS(res)
{
      res.reply([
      {
        title: '远控二代操作说明',
        description: 'bbbbbbb',
        picurl: 'http://www.moguzn.com/weixin/images/sms.png',
        url: 'https://mp.weixin.qq.com/s/YQT32aMBIfl9JqG4q7vA1w'
      },
       {
        title: '如何用微信报警',
        description: 'yyyyyy',
        picurl: 'http://www.moguzn.com/weixin/images/wechat.png',
        url: 'https://mp.weixin.qq.com/s/bCMvaTwdYURDe6zA4PdFsA'
      },
       {
        title: '如何用群发邮件报警',
        description: 'yyyyyy',
        picurl: 'http://www.moguzn.com/weixin/images/email.png',
        url: 'https://mp.weixin.qq.com/s/C1pwysQd8bvu3grRzBMSwA'
      },
       {
        title: '用邮件免费短信提醒的方法',
        description: 'yyyyyy',
        picurl: 'http://www.moguzn.com/weixin/images/email2.png',
        url: 'https://mp.weixin.qq.com/s/iSMBP3yyf6VMvxjc4XfCuA'
      },
       {
        title: '常见问题FAQ',
        description: 'yyyyyy',
        picurl: 'http://www.moguzn.com/weixin/images/faq.png',
        url: 'https://mp.weixin.qq.com/s/wTX_LWnmVE8pagrsIvNq6Q'
      }
    ]);
}

app.use(express.query());
app.use('/wechat', wechat(config, function (req, res, next) {
  // 微信输入信息都在req.weixin上
  var message = req.weixin;
  var openid = message.FromUserName;
  console.log(message);
  if(message.MsgType === "event"){
    if(message.Event === "subscribe"){
        replySMS(res)
    }else if(message.Event === "unsubscribe"){
      console.log(message.FromUserName)
    }else if(message.Event === "scancode_waitmsg"){
      var clientID=message.ScanCodeInfo.ScanResult;
      res.reply("正在绑定\r\n状态灯闪烁时点击确定按键完成绑定!")
    }else if(message.Event === "CLICK"){
      if(message.EventKey=='V1001_GOOD')
      {
        replySMS(res)
      }
    }
  }else if(message.MsgType === "text"){
    var content=message.Content;
    if (content.substring(0,4)==="wxid"){
      res.reply(message.FromUserName)
    }else{
      res.reply("发送wxid获取您在实验平台的微信唯一ID")
    }
  }
}));

//模板接口
app.post('/template', function (req, res) {
  req.rawBody = '';
  req.on('data', function(chunk) { 
    req.rawBody += chunk;
  });
  req.on('end', function() {
    if(req.rawBody !== ""){
       var reqStr=req.rawBody
       var str1=reqStr.substr(2)
       var reqStr=reqStr.substr(0,1)+str1
       console.log(reqStr)
       var content = new Buffer(reqStr, 'base64').toString('utf8')
       try{
         console.log(content)
         var json=JSON.parse(content)
         WeixinTemplatePush(json.i,json.c,json.n,json.s)
         //微信号 报警内容 设备名 序列号
       }catch(e){
         console.log("template解析异常")
       }
    }
    res.end("ok")
  }); 
}) 

app.get('/monitor', function (req, res) {
  res.send("ok")
}) 

app.get('/test', function (req, res) {
  console.log(req.body);
  res.send(req.body);
}) 
app.post('/test', function (req, res) {
  console.log(req.body);
  res.send(req.body);
}) 


var server = app.listen(2000, function () {
  var host = server.address().address
  var port = server.address().port
  console.log("wechat http://%s:%s", host, port)
}) 

//定时获取微信access_token
function getAccessToken() {
  var queryParams = {
    'grant_type': 'client_credential',
    'appid': wxconfig.appid,
    'secret': wxconfig.appsecret
  };
  var options = {
    method: 'GET',
    url: 'https://api.weixin.qq.com'+wxconfig.tokenUrl+qs.stringify(queryParams)
  };
  request(options, function (err, res, body) {
    tokenValue=JSON.parse(body);
    console.log("getAccessToken"+JSON.stringify(tokenValue));
    console.log("tokenValue:"+tokenValue.access_token);
  });
};
getAccessToken()
setInterval(getAccessToken, 3600000);//7000000
//微信客服接口和模板接口
function weixinTemplateRequest(content){
    var url='https://api.weixin.qq.com';
    url=url+wxconfig.templateUrl+tokenValue.access_token;
    var options = {
      url: url,
      method: 'POST',
      body:JSON.stringify(content)
    };  
    request(options, function (err, res, body) {
      console.log("weixinRequest"+JSON.stringify(body))
    });  
}
//微信推送模板
// {{first.DATA}}
// 设备号：{{keyword1.DATA}}
// 设备名称：{{keyword2.DATA}}
// 消息：{{keyword3.DATA}}
// {{remark.DATA}}
// WeixinTemplatePush(json.i,json.c,json.n,json.s,json.m)
//微信号 报警内容 设备名 序列号 设备型号
function WeixinTemplatePush(openid,content,name,sn){
    var myDate = new Date();        
    // var alarmDate = myDate.getYear()+"年"+myDate.getMonth()+"月"+myDate.getDate()+"日"+myDate.getHours()+"点"+myDate.getMinutes()+"分";
    var alarmDate = (myDate.getYear()-100)+"年"+(myDate.getMonth()+1)+"月"+myDate.getDate()+"日"+myDate.getHours()+"时"+myDate.getMinutes()+"分";
    var model=sn.substr(0,3)
    var templatePush={ 
      "touser":openid, 
      "template_id":"ban2SRoIEZmSP9iDUzTcIXtcTDc6Nd-Oz4L8U2vHYN0", 
      "url":"jssdk.mogudz.com/"+model+".php?sn="+sn, 
      "topcolor":"#FF0000", 
      "data":{ 
             "first": {
                 "value": alarmDate,
                 "color":"#173177"
              },
              "keyword1":{ 
                  "value":sn, 
                  "color":"#173177" 
              }, 
              "keyword2":{ 
                  "value":name, 
                  "color":"#173177" 
              },
              "keyword3":{ 
                  "value":content, 
                  "color":"#173177" 
              },
              "remark":{
                 "value":"",
                 "color":"#173177"
             }
      } 
   };
   weixinTemplateRequest(templatePush);  
}
