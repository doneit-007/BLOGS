const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set('view engine','ejs');
var items = [];
var work = [];
app.get('/',function(req,res){

   var date=  new Date();
   var day = date.getDay();
   var options = {year: 'numeric', month: 'long', day: 'numeric'};
   var today  = new Date();

var dayname = today.toLocaleDateString("en-US",options);


	res.render('list',{daytype:dayname,items:items,type:"todo"});

});
app.post('/',function(req,res){
  var item = req.body.newitem;
  if(req.body.add=="todo"){
  items.push(item);
  res.redirect('/');
}
else
{

    work.push(item);
  res.redirect('/work');
}
});
app.get('/work',function(req,res){


    res.render('list',{daytype:"Work",items:work,type:"work"});

});
app.post('/work',function(req,res){
  var item = req.body.newitem;
  work.push(item);
  res.redirect('/work');
});
app.get('/about',function(req,res){


    res.render('about');

});
app.listen('3000',function(req,res){

	console.log('server started on port 3000');
});
/**/