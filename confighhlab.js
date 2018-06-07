// https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx151461669b255af0&secret=d16166cdff755f42cb3e14d568e297b7
module.exports = {
  'wxoauth':'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxa690edcf92ee8f2e&redirect_uri=http://a3050311118.gicp.net/oauth2.php&response_type=code&scope=snsapi_userinfo&state=1#wechat_redirect',
  'token': 'wechat',
  'appid': 'wxa690edcf92ee8f2e',
  'appsecret' :'7d4c2f2b7d014983cf1db8c9f34ac1e1', 
  'encodingAESKey': 'SmU0TqkFTpVeY2yvotC8pfQBUynY3FTV8vXxiSrsTeo',
  'tokenUrl':'/cgi-bin/token?',
  'customUrl':'/cgi-bin/message/custom/send?access_token=',
  'templateUrl':'/cgi-bin/message/template/send?access_token='
};
