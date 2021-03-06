require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
//const bcrypt = require('bcrypt');
const _ = require('lodash');
const fs = require('fs');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const LocalStrategy = require('passport-local');
const app = express();

app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static("public"));
app.set('view engine','ejs');


const saltRounds = 8;
app.use(session({
  secret:process.env.SECRET,
  resave:false,
saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb://localhost:27017/blogsDB");



const userSchema = new mongoose.Schema({
  username:String,
  password:String

});

userSchema.plugin(passportLocalMongoose);
User = mongoose.model('user',userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
const votecount  = {
  username:String,
  votevalue:Number
}
const blogSchema = new mongoose.Schema({
  title:{
    required:true,
    type:String
  },
  date:{
    required:true,
    type:String
  },
  imgsrc:{
    required:true,
    type:String

  },
 post:{
    required:true,
    type:String

  },

  vote:[votecount],
  count:Number
});
const Blog = mongoose.model('Blog',blogSchema);
app.get('/',function(req,res){

  if(req.isAuthenticated())
  { 
  Blog.find({},function(err,blogs){
    res.render('home',{blogs:blogs,header:"Logout"});
  });}
  else
  {

    res.redirect('/signup-login?valid=' + "You are not logged in !!");
  }
  


}); 
app.get('/about',function(req,res){
  if(req.user)
  res.render('about',{header:"Logout"});
else
  res.render('about',{header:"Login"});
});
app.get('/signup-login',function(req,res){



   var passedVariable = req.query.valid;
   if (typeof(passedVariable) != "undefined")
   {
      if(req.user)
  res.render('login',{comment:passedVariable,header:"Logout"});
else
  res.render('login',{comment:passedVariable,header:"Login"});
}
else
{    
  req.logout();
  res.render('login',{comment:"",header:"Login"});
}
});

app.post('/signup-login',function(req,res,next){

User.findOne({username:req.body.username},function(err,user){

   if(err){

    console.log(err);
    res.redirect('/signup-login');
   }
   else
  {
       

     if(user)
     {

              

             req.login(user,function(err){
                if(err)
                {   
                    console.log(err);
                    res.redirect('/signup-login');
                }
              else
              {
                      passport.authenticate('local', function(err, user, info) {
                if (err) { return next(err); }
                if (!user) { return res.redirect('/signup-login?valid=' + "Password or username is incorrect"); }
                req.logIn(user, function(err) {
                  if (err) { return next(err); }
                  return res.redirect('/');
                });
              })(req, res, next);

                        /* passport.authenticate("local")(req,res,function(){
                       
                       return res.redirect('/');

                        });*/
                         
              }

                 

          });



     }
     else
      { User.register({username:req.body.username},req.body.password,function(err,user){

          if(err){

            console.log(err);
            res.redirect('/signup-login');
          }
          else
        {   

              passport.authenticate("local")(req,res,function(){
                    
                  res.redirect('/');


              });

          }


           });

     }





  }


  


});




});

app.get('/compose',function(req,res){
    
   if(req.isAuthenticated())
  {  
     if(req.user.username==process.env.ADMIN)
       res.render('compose',{header:"Logout"});
else
{
  var string = encodeURIComponent('You are not admin !!');
  res.redirect('/signup-login?valid=' + string);
    
}
}
  else
  {
     var string = encodeURIComponent('You are not logged in !!');
  res.redirect('/signup-login?valid=' + string);
  }
  
});
var src = "\\images\\"
app.post('/compose',function(req,res){
     if(req.isAuthenticated())
  {  
     if(req.user.username==process.env.ADMIN)
       {
        const dir1 = __dirname +"\\public" + src +req.body.blog_date + ".jpg" ;
     const dir2 = __dirname +"\\public" + src+ req.body.blog_date + ".png" ;
     console.log(dir1);
 
     if (fs.existsSync(dir1)) {
         var blog = new Blog({title: req.body.blog_title,
    post:req.body.blog_post,
    imgsrc:src +req.body.blog_date + ".jpg" ,
      date :req.body.blog_date ,count:0,
      votecount:[]});
         blog.save();
       } 
     else {
          var blog = new Blog({title: req.body.blog_title,
    post:req.body.blog_post,
    imgsrc: src+ req.body.blog_date + ".png" ,
      date :req.body.blog_date,count:0,
    votecount:[]});
          blog.save();
      }
  
    

     res.redirect('/');
       }
else
{
  var string = encodeURIComponent('You are not admin !!');
  res.redirect('/signup-login?valid=' + string);

    
}
}
  else
  {
     var string = encodeURIComponent('You are not admin !!');
  res.redirect('/signup-login?valid=' + string);
  }
  
});
     

app.get('/post/:blogtitle',function(req,res){
  
 Blog.findOne({title:req.params.blogtitle},function(err,blog){
 if(blog){
   console.log(req.query);
   if(req.query.vote)
   {   if(req.query.vote=="voted")
      res.render('post',{blogobj:blog,header:"Logout",vote_comment:"You can't unvote/revote"});
      else
      {
        res.render('post',{blogobj:blog,header:"Logout",vote_comment:"Thanks for you vote"});
      }
 }
 else
 {
              res.render('post',{blogobj:blog,header:"Logout",vote_comment:""});

 }

 }
 else
  res.send("Page not found");

 });

});



app.post('/post/:blogtitle',function(req,res){
  
  if(req.isAuthenticated())
  { 
                 var flag = 0;
        
                  Blog.findOne({title:req.params.blogtitle},function(err,blog){

                       if(err)
                       {
                              console.log(err);
                              res.redirect('/post/'+ req.params.blogtitle);

                       }
                       else if(blog)
                       {
                                       
                           for(var i = 0;i<blog.vote.length;i++)
                           { 
                                    if(blog.vote[i].username==req.user.username)
                                      flag =1;

                           }
                           
                           if(!flag)
                           { 
                                   if(req.query.vote=='upvote')
                                      {

                                         blog.vote.push({
                                          username:req.user.username,
                                          votevalue:1
                                         });
                                         blog.count++;
                                         blog.save();
                                         }
                                         else
                                         {
                                             blog.vote.push({
                                          username:req.user.username,
                                          votevalue:-1
                                         });
                                         blog.count--;
                                         blog.save();


                                         }
                                         res.redirect('/post/'+ req.params.blogtitle + "?vote=unvoted"); 

                           }
                           else
                              res.redirect('/post/'+ req.params.blogtitle + "?vote=voted");
                          
          
                      
                         


                       }
                       else
                       {
                        res.redirect('/post/'+ req.params.blogtitle);
                       }

                       

                });
 
        

 
 }
  else
  {

    res.redirect('/signup-login?valid=' + "You are not logged in !!");
  }

});
app.get('/post_edit/:blogtitle',function(req,res){
  

  if(req.isAuthenticated())
  {  
     if(req.user.username==process.env.ADMIN)
       {  Blog.findOne({title:req.params.blogtitle},function(err,blog){
        
          res.render('post_edit',{blog:blog,header:"Logout"});
           });
       }
   else
     {
  
            res.redirect('/post/'+req.params.blogtitle);
    
     }
}
  else
  {
     var string = encodeURIComponent('You are not admin !!');
      res.redirect('/signup-login?valid=' + string);
  }

});

app.post('/post_edit/:blogtitle',function(req,res){
  
 if(req.isAuthenticated())
  {  
     if(req.user.username==process.env.ADMIN)
       {  
               if(req.query.query=="edit"){
                    

                  Blog.updateOne({title:req.params.blogtitle},
                    {title:req.body.blog_title,date:req.body.blog_date,post:req.body.blog_post},function(err,result){

                          if(err)
                          {
                            console.log(err);
                               res.redirect('/post_edit/:' + req.params.blogtitle);

                          }
                          else
                          {

                                    res.redirect('/');
                          }
                    });

               }
               else
               {

   
                    Blog.remove({title:req.params.blogtitle},function(err,result){
                        if(err)
                          {
                            console.log(err);
                               res.redirect('/post_edit/:' + req.params.blogtitle);

                          }
                          else
                          {

                                    res.redirect('/');
                          }


                    });

               }



           

       }
else
     {
  
            res.redirect('/post/req.params.blogtitle');
    
     }
}
  else
  {
     var string = encodeURIComponent('You are not admin !!');
      res.redirect('/signup-login?valid=' + string);
  }

});
app.listen('3000',function(req,res){

	console.log('server started on port 3000');
});