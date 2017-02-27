var express = require('express');
var app = express();
var fs = require('fs');

app.get('/index.html', function (req, res) {
   res.sendFile( __dirname + "/" + "index.html" );
})

// TODO: This function lists all the users
app.get('/listUser', function(req, res){
  var response = readFile(__dirname+"/data/json/","users.json");
  response = JSON.parse(response);
  res.end(JSON.stringify(response));
});

// This function returns User Information
app.get('/getUser', function(req, res) {
  var response = getUser(req.query.userID);
  //response = JSON.parse(response);
  res.end(JSON.stringify(response));
});


// This function Adds new users
app.get('/addUser', function(req, res) {
  var fName = req.query.first_name;
  var lName = req.query.last_name;
  var nameOnCard = req.query.name_on_card;
  var card = req.query.card_type;
  var cardNumber = req.query.card_number;
  var expDate = req.query.exp_date;
  var cvv = req.query.cvv;
  var pwd = req.query.pwd;

  var data = readFile(__dirname+"/data/json/", "users.json");
  //console.log(data.toString());
  data = JSON.parse(data);
  NumOfUsers = sizeOf(data);
  user = {
    "firstname": fName,
    "lastname": lName,
    "password": pwd,
    "paymentcard": {
        "nameoncard":nameOnCard,
        "card":card,
        "cardnumber":cardNumber,
        "expdate":expDate,
        "cvv":cvv
    }
  };
  data["user"+(NumOfUsers+1)]=user;
  writeFile(__dirname+"/data/json/", "users.json", data);
});


// This function Add new Items to the specified cart
app.get('/addItem', function(req,res){
  var cartID = "cart"+req.query.cartID;
  var itemID = "item"+req.query.upc;
  var userID = "user"+req.query.userID;
  var quantity = req.query.quantity;

  var carts=readFile(__dirname+"/data/json/","carts.json");

  carts = JSON.parse(carts);
  var NumOfCarts = sizeOf(carts);
  var cart = carts[cartID];
  console.log("Selected Cart: "+ cartID+" : "+JSON.stringify(cart));
  var cartSize = sizeOf(cart);
  var cartEntry = {
    "id":itemID,
    "quantity":quantity,
    "addedBy":userID
  };
  cart["i"+(cartSize+1)] = cartEntry;
  console.log("Modified: "+JSON.stringify(cart));
  carts[cartID] = cart;
  //console.log(JSON.stringify(carts));
  writeFile(__dirname+"/data/json/","carts.json", carts);
});

// This funciton is to get a cart
app.get('/getCart', function(req, res){
  var response = getCart(req.query.cartID);
  res.end(JSON.stringify(response));
});

// This function is for checkout
app.get('/checkout', function(req, res){
  var cartID = "cart"+req.query.cartID;
  var userID = "user"+req.query.userID;
  var cartResponse = getCart(req.query.cartID);
  response = {
    "userID": userID,
    // TODO: Add this statu to cart object
    "staus": "checkedout",
    "response": cartResponse
  }
  res.end(JSON.stringify(response));
});


// Ankita's services - code

//function to check the groups and their users
app.get('/listGroups', function (req, res) {
    fs.readFile( __dirname + "/" + "../data/json/groups.json", 'utf8', function (err, data){
       console.log( data );
       res.end( data );
   });
})

//Function to add group
app.get('/AddGroup', function (req, res) {
  var QRString = "group"+req.query.QRString;
  console.log("QRString",QRString);
  var user = "user"+req.query.userID;
  var groups=readFile(__dirname+"/data/json/","groups.json");
  var carts =readFile(__dirname+"/data/json/","carts.json");
  groups = JSON.parse( groups );
  carts = JSON.parse( carts );
  var NumOfGroups = sizeOf(groups);
  var NumOfCarts = sizeOf(carts);

  if(groups[QRString] == null)
  {
     var newgroup = {
        "cartId":"cart"+(NumOfCarts+1),
        "users":{
           "u1" : user
          }
      }
      groups[QRString] = newgroup;
      res.end( JSON.stringify(groups,null,'\t'));
      console.log("Modified: "+JSON.stringify(groups));
      writeFile(__dirname+"/data/json/","groups.json", groups);
      console.log("Group has been added");
  }
  else {
    var group = groups[QRString];
    var groupusers = group["users"];
    NumOfgroupUsers = sizeOf(groupusers)
    groupusers["u"+(NumOfgroupUsers + 1)] = user;
    group["users"]= groupusers;
    groups[QRString] = group;
    res.end( JSON.stringify(groups,null,'\t'));
    console.log("Modified: "+JSON.stringify(groups));
    writeFile(__dirname+"/data/json/","groups.json", groups);
    console.log("New user has been added to already existing group");
  }
});



//Function to get the group
app.get('/getGroup', function(req, res){
  var cID  = req.query.cartID;
  var cart = getCart(cID);
  var status = cart["status"];
  response = {
    "cartID": "cart"+cID,
    "item list": cart,
    "status": status
  }
  res.end(JSON.stringify(response,null,'\t'));

});



/* -------------------------- Utility function --------------------------*/
var readFile = function(dir, fileName){
  var data = fs.readFileSync(dir+fileName);
  return data
};
var writeFile = function(dir, fileName, data){
  var result = fs.writeFile(dir+fileName,
                  JSON.stringify(data, null,'\t'), function(err){
                    if(err){
                      return console.log(err);
                    }
                    console.log("File Write Complete: Updated - "+fileName);
              });
};
var sizeOf = function(jsonObj){ return Object.keys(jsonObj).length };
var getCart = function(ID){
  var cartID = "cart"+ID;
  // reding carts.json
  var carts=readFile(__dirname+"/data/json/","carts.json");
  carts = JSON.parse(carts);
  // selecting cart
  var NumOfCarts = sizeOf(carts);
  var response;
  if(parseInt(ID) <= NumOfCarts){
      var cart = carts[cartID];
      response = cart;
  }else{
    var err = {
      "status":500,
      "description":"CartID not found. CartID: "+cartID
    }
    response = err;
  }
  return response;
};
var getUser = function(ID){
  var userID = "user"+ID;
  var users = readFile(__dirname+"/data/json/","users.json");
  users = JSON.parse(users);
  var NumOfUsers = sizeOf(users);
  var response;

  for(var user in users){
    
  }

  if(parseInt(ID) <= NumOfUsers){
    var user = users[userID];
    response = user;
  }else{
    var err = {
      "status":500,
      "description":"UserID not found. UserID: "+userID
    }
    response = err;
  }
  return response;
};
/* -------------------------- Server Config --------------------------*/
var server =app.listen(8081, function(){
  var host = server.address().address;
  var port = server.address().port;
  console.log("Example app listening  Ssdd at http://%s:%s", host, port);
});
