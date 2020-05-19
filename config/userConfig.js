module.exports = { 
	alreadyExist : function(con,req,callback) {
		req.checkBody('email','Invalid email').notEmpty().isEmail();
		req.checkBody('password','Invalid password').notEmpty().isLength({min : 4});
		var errors = req.validationErrors();
		if(errors) {
				var msg = [];
				errors.forEach(function(error){
				if(error.msg)
				{
					msg.push(error.msg);
					req.session.success=true;
				}	
				});
			
			req.session.errors=msg;
			callback();
		}
		else
		{
			con.query('SELECT count(*)  as cou FROM user WHERE email = "'+req.body.email+'";', function (err, result, fields) {
				req.session.success=false;
				var msg = [];
				if (err) throw err;
				if(result[0].cou > 0){
					msg.push('Email is already in use');
					req.session.success=true;
					req.session.errors=msg;
					console.log('hello');
				}
				callback();
			});
		}
	},
	
	userValidation : function(con,req,callback) {
		con.query("select password,id from user where email = '"+req.body.email+"';", function(err,result,fields) {
			if (err) throw err;
			if(result.length==1)
			{
				req.checkBody('password','Invalid Email or Password').equals(result[0].password);
				var errors = req.validationErrors();
				if(!errors){
					if(req.session.id1 > 0)
					{
						req.session.cartSize=0;
						req.session.cart = null;
						req.session.itemQuantity = null;
						req.session.success= null;
						req.session.errors=null;
					}
					req.session.id1=result[0].id;
				}
			}
			callback();
		});
	},
	
	userOrders : function(con,req,callback){ 
		con.query("select * from orders where custId="+req.session.id1+" order by date asc;",function(err,result,fields){
				if(err) throw err;
				var i,daArr = [], totPri = [];
				var str = "" , str3 = "";
				
				if(result.length){
					str+=result[0].prodId;
					str3+=result[0].quan;
					daArr.push(result[0].date);
					totPri.push(result[0].totPrice);
					for(i=1;i<result.length;i++)
					{
						if(result[i].date != daArr[daArr.length-1])
						{
							daArr.push(result[i].date);
							str+=",-1,"+result[i].prodId;
							str3+=",-1,"+result[i].quan;
							totPri.push(result[i].totPrice);
						}
						else
						{
							str+=","+result[i].prodId;
							str3+=","+result[i].quan;
							totPri[totPri.length-1]+=result[i].totPrice;
						}	
					}
					
					con.query("select * from product where id in ("+str+");",function(err,result1,fields) {
						if(err) throw err;
						var  tempArr = str.split(","),i,j,k=0,ind=0;
						var  quanArr = str3.split(",");
						var product = [],prod = [];
						
						for(i=0;i<tempArr.length;i++)
						{
							if(tempArr[i]==-1)
								ind=i+1;
							else
							{
								for(j=ind;j<i;j++)
								{
									if(tempArr[j]==tempArr[i])
									{
										var t1 = parseInt(quanArr[j]) + parseInt(quanArr[i]);
										quanArr[j]=t1;
										tempArr[i]=-2;
									}
								}
							}
						}
						for(i=0;i<tempArr.length;i++)
						{
							if(tempArr[i] == "-1"){
								product.push(prod);
								prod = [];
								k++;
							}
							else{
								for(j=0;j<result1.length;j++)
								{
									if(tempArr[i] == result1[j].id)
									{
										prod.push({
											img : result1[j].img,
											name : result1[j].name,
											date : daArr[k],
											quan : quanArr[i],
											price : totPri[k]
										});
									}
								}
							}
						}
						product.push(prod);
						
						callback(product);
					});	
				}
				else{
					var product = [];
					callback(product);
				}
		});
	}
};
