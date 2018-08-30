// https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx151461669b255af0&secret=d16166cdff755f42cb3e14d568e297b7
module.exports = {
  'wxoauth':'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx151461669b255af0&redirect_uri=http://a3050311118.gicp.net/oauth2.php&response_type=code&scope=snsapi_userinfo&state=1#wechat_redirect',
  'token': 'wechat',
  'appid': 'wx151461669b255af0',
  'appsecret' :'d16166cdff755f42cb3e14d568e297b7', 
  'encodingAESKey': 'dQ7RlwJd14PjB6BYK11o9gPHBWTdFSACb7BzalyPsvq',

  // 'appid': 'wx848a2dec6db78175', //www.mogudz.com
  // 'appsecret' :'77e0974a8b091823f3675ef0409a2dff', 
  // 'encodingAESKey': 'dQ7RlwJd14PjB6BYK11o9gPHBWTdFSACb7BzalyPsvq',

  'tokenUrl':'/cgi-bin/token?',
  'customUrl':'/cgi-bin/message/custom/send?access_token=',
  'templateUrl':'/cgi-bin/message/template/send?access_token='
};
