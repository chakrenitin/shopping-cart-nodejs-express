var express = require('express');
var router = express.Router();
var userConfig = require('../config/userConfig');
var cartConfig = require('../config/cartConfig');
var mysql = require('mysql');
var csrf = require('csurf');
var alert = require('alert-node');

var csrfProtection = csrf();
router.use(csrfProtection);
var con = mysql.createConnection({
  host: "localhost",
  user: "nitin",
  password: "password",
  database: "shopCart"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
 });
 
/* GET home page. */
router.get('/', function(req, res, next) {
  con.query("SELECT * FROM product", function (err, result, fields) {
 	   if (err) throw err;
  	   var products = [];
  	   
  	   for (var i =0;i<result.length ; i+=3){
  	   		products.push(result.slice(i,i+3));
  	   }
  	   res.render('shop/index', { title: 'Express',prod : products });
  });
});

router.post('/user/signup', function(req, res, next) {
	
	userConfig.alreadyExist(con, req ,function (){
		if(!req.session.success)
		{
			con.query("insert into user(email,password) values('"+req.body.email+"','"+req.body.password+"');", function (err, result,fields)	{
					if (err) throw err;
			
			 con.query("select id from user where email='"+req.body.email+"';",function(err,result,fields){
			 	if(err) throw err;
			 	
			 	req.session.id1 = result[0].id;
				res.redirect('/user/profile');
			 });	
			});	
		}
		else 
			res.redirect('/user/signup');
	}); 
	
});

router.get('/user/signup', function(req, res, next) {
	if(req.session.id1 > 0)
	{
		alert('Please sign-out for current user');
		res.redirect('/');
	}
	else
	{
		res.render('user/signup',{csrfToken : req.csrfToken(),success : req.session.success, errors : req.session.errors});
		req.session.success= null;
		req.session.errors=null;
	}	
});

router.get('/user/profile',function(req,res,next) {
	if(req.session.id1 > 0)
	{
		userConfig.userOrders(con,req,function(product){
			
			res.render('user/profile',{prod :product ,id : req.session.id1});
		});
	}
	else
	{
		alert('Sign in first');
		res.redirect('/');
	}
});

router.post('/user/signin',function(req,res,next){
	var temp = req.session.id1;
	userConfig.userValidation(con,req,function(){
		if(req.session.id1 > 0 && temp != req.session.id1)
		{
			if(req.session.ischeck==3)
			{
				req.session.ischeck=0;
				res.redirect('/shop/checkout');
			}
			else
				res.redirect('/');
		}
		else{
			req.session.success=true;
			res.redirect('/user/signin');		
		}
	});		
});
router.get('/user/signin',function(req,res,next){
	res.render('user/signin',{csrfToken : req.csrfToken(), success : req.session.success})
	req.session.success = null;
});
router.get('/error', function(req, res, next) {
	res.render('error');
});

router.get('/add-to-cart',function(req,res,next) { 
	cartConfig.addToCart(req,function (){
		res.redirect('/');
	});	
});

router.get('/shop-cart',function(req,res,next) {
	cartConfig.shopCart(req,con,function(product,price) {
		req.session.price = price;
		res.render('user/shop-cart',{prod : product,price});
	});
});
router.get('/incItem',function(req,res,next) {
	cartConfig.addToCart(req,function (){
		res.redirect('/shop-cart');
	});
		
});

router.get('/decItem',function(req,res,next) {
	var id = req.query.id,i;
	for(i=0;i<req.session.cart.length;i++)
	{
		if(id == req.session.cart[i] && req.session.itemQuantity[i])
			req.session.itemQuantity[i]--;
	}
	res.redirect('/shop-cart');
});

router.post('/shop/checkout',function(req,res,next) {
	var str="",str1="";
	for(var i=0;i<req.session.cart.length;i++)
	{
		if(req.session.itemQuantity[i])
		{
			str+=req.session.cart[i]+",";
			str1+=req.session.itemQuantity[i]+",";
		}	
	}
	
	str=str.substring(0,str.length-1);
	str1=str1.substring(0,str1.length-1);
	var datetime = new Date();
    str2 = datetime.toISOString().slice(0,10);
    
    con.query("insert into orders(custId,prodId,quan,totPrice,date) values("+req.session.id1+",'"+str+"','"+str1+"',"+req.session.price+",'"+str2+"');",function(err,result,fields) {
    	if(err) throw err;
    	
    	req.session.cartSize=0;
    	req.session.cart = null;
    	req.session.itemQuantity = null;
    	alert('Order placed');
    	res.redirect('/');	 
    });
});
router.get('/shop/checkout',function(req,res,next) {
	if(req.session.id1 > 0){
		res.render('shop/checkout',{csrfToken : req.csrfToken(),  price : req.session.price});
	}
	else{
		alert('Signin first');
		req.session.ischeck=3;
		res.redirect('/user/signin');		
	}
});
router.get('/logout',function(req,res,next){
	req.session.destroy();
	res.redirect('/');
});


module.exports = router;
