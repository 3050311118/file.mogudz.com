var express = require('express');
var wechat = require('wechat');
var redis = require("redis");
var mqtt = require('mqtt');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var path = require('path')
var wxconfig = require('./config');
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

app.use(express.query());
app.use('/wechat', wechat(config, function (req, res, next) {
  // 微信输入信息都在req.weixin上
  var message = req.weixin;
  var openid = message.FromUserName;
  console.log(message);
  if(message.MsgType === "event"){
    if(message.Event === "subscribe"){
      console.log(message.FromUserName)
      res.reply("感谢使用蘑菇智能")
    }else if(message.Event === "unsubscribe"){
      console.log(message.FromUserName)
    }else if(message.Event === "scancode_waitmsg"){
      var clientID=message.ScanCodeInfo.ScanResult;
      BandAction(openid,clientID)
      res.reply("正在绑定\r\n状态灯闪烁时点击确定按键完成绑定!")
    }else if(message.Event === "CLICK"){

    }
  }else if(message.MsgType === "text"){
    var content=message.Content;
    if (content.substring(0,2)==="bd"){
      var clientID=content.substring(2);
      BandAction(openid,clientID)
      res.reply("正在绑定\r\n状态灯闪烁时点击确定按键完成绑定!")
    }else if (content.substring(0,2)==="jc"){
      var clientID=content.substring(2);
      JCBandAction(openid,clientID)
      res.reply("正在解除绑定!")
    }else if (content.substring(0,4)==="wxid"){
      res.reply(message.FromUserName)
    }else{
      res.reply("发送wxid获取您在蘑菇公众号的微信唯一ID")
    }
  }
}));

app.get('/getwxinfo', function (req, res) {
    var code = req.query.code;
    var url='https://api.weixin.qq.com/sns/oauth2/access_token?appid='+wxconfig.appid+'&secret='+wxconfig.appsecret+'&code='+code+'&grant_type=authorization_code'
    request.get(url,function(error, response, body){
            if(!error && response.statusCode == 200){
                var data = JSON.parse(body);
                var url='https://api.weixin.qq.com/sns/oauth2/refresh_token?appid='+wxconfig.appid+'&grant_type=refresh_token&refresh_token='+data.refresh_token;
                request.get(url,function(error, response, body){
                    if(!error && response.statusCode == 200)
                    {
                      var data = JSON.parse(body);
                      var url='https://api.weixin.qq.com/sns/userinfo?access_token='+data.access_token+'&openid='+data.openid
                      request.get(url,function(error, response, body){
                        if(!error && response.statusCode == 200)
                        {
                           var data=JSON.parse(body)
                           if(data.errcode !== 40001){
                               console.log(body)
                               res.render('setinfo',data)
                               req.session.openid = data.openid;
                               console.log(data.openid)
                               console.log(data.nickname)
                               console.log(data.headimgurl)
                               // redisClient.hmset(data.openid,"nickname",data.nickname,"img",data.headimgurl,function(err,response){
                               //    console.log(err,response);
                               // });
                           }else{

                           }
                         }
                      })
                    }
                })
            }
        }
    )
}) 

app.get('/wxlogin', function (req, res) {
    console.log('/wxlogin')
    var router = 'getwxinfo';
    var return_uri = 'http://wechat.mogudz.com/'+router;
    var scope = 'snsapi_userinfo';
    res.redirect('https://open.weixin.qq.com/connect/oauth2/authorize?appid='+wxconfig.appid+'&redirect_uri='+return_uri+'&response_type=code&scope='+scope+'&state=1#wechat_redirect');      
}) 
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
//客服接口
app.get('/custom', function (req, res) {

}) 
//获取设备接口
app.get('/getdevice', function (req, res) {
  var openid=req.query.openid;
  //sadd
  // redisClient.smembers("dev_"+openid,function(err,response){  
  //     if(!err){  
  //         res.json(response)
  //     }
  // });         
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


//微信绑定动作
function BandAction(openid,toDev){
  var arr={};
  arr.t="wxbd";
  arr.i=openid;
  console.log(JSON.stringify(arr));
  // mqttClient.publish(toDev+'/sub',JSON.stringify(arr));
}
//微信解除绑定动作
function JCBandAction(openid,toDev){
  var arr={};
  arr.t="wxjc";
  arr.i=openid;
  console.log(JSON.stringify(arr));
  // mqttClient.publish(toDev+'/sub',JSON.stringify(arr));
}

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
      "template_id":"iEH2KZak1kUyuI7KnEBZ3WTSpp9fbQb69BiUInimQZQ", 
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
