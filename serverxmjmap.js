var express = require('express');
var path = require('path')
var request = require('request');
var qs = require('querystring');
var ejs = require('ejs');
var app = express();

app.engine('.html', ejs.__express);
app.set('view engine', 'html');
app.use(express.static(path.join(__dirname, 'views')))
app.use(express.json());

app.set('port', process.env.PORT || 2000);
app.set('views', path.join(__dirname, 'views'));//__dirname


app.get('/xmj02map',function(req, res, next){
  addr=req.query.addr
  lng=req.query.lng
  lat=req.query.lat
  res.render('xmj02map.html', {addr: addr,lng:lng,lat:lat});
});

var server = app.listen(8081, function () {
 
  var host = server.address().address
  var port = server.address().port
  
})