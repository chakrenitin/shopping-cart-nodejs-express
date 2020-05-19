module.exports = {
	addToCart : function(req,callback) {
		if(req.session.cartSize){
			var i;
			for(i = 0; i < req.session.cartSize; i++){
				if(req.session.cart[i] == req.query.id){
					req.session.itemQuantity[i]+=1;				
					break;
				}
			}
			
			if(i == req.session.cartSize)
			{	
				req.session.cartSize+=1;
				req.session.cart.push(req.query.id);
				req.session.itemQuantity.push(1);
			}
		}
		else{
			req.session.cartSize=1;
			var temp = [],temp1 = [];
			temp.push(req.query.id);
			temp1.push(1);
			req.session.cart = temp;
			req.session.itemQuantity = temp1;
		}
		callback();
	},
	shopCart : function(req,con,callback){
		
		if(!req.session.cartSize)
			callback([],0);
		else{
			var str="";
			var i;
			for(i=0;i<req.session.cartSize-1;i++)
			{
				if(req.session.itemQuantity[i])
					str= str + req.session.cart[i] + ",";
			}
			if(req.session.itemQuantity[i])	
				str+=req.session.cart[i];
				
			if(str=="" || str[str.length -1] ==',')
				str+="-1";
			con.query('SELECT id,img,name,price FROM product WHERE id in ('+str+');', function (err, result, fields) {
					if(err) throw err;
					var product = [];
					var price=0;
					for(var i=0;i<result.length;i++)
					{
						for(var j=0;j<req.session.cartSize;j++)
						{
							if(req.session.cart[j]==result[i].id)
							{
								price += result[i].price * req.session.itemQuantity[j];
								break;
							}
						}	
						product.push({
							id : result[i].id,
							img : result[i].img,
							name : result[i].name,
							price : result[i].price,
							quan : req.session.itemQuantity[j]
						});
					}
					
					callback(product,price);
			});
		}
	} 
};
