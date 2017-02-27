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
  //NumOfUsers = sizeOf(data);
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
  data = addEntry("user", data, user);
  writeFile(__dirname+"/data/json/", "users.json", data);
});


// This function Add new Items to the specified cart
app.get('/addItem', function(req,res){
  var cartID = req.query.cartID;
  var upc = req.query.upc;
  var userID = req.query.userID;
  var quantity = req.query.quantity;

  console.log("/addItem : "+JSON.stringify(req.query));
  var response = null;

  var carts=readFile(__dirname+"/data/json/","carts.json");
  carts = JSON.parse(carts);

  var cart = getCart(cartID);

  if(!cart.hasOwnProperty("error")){
    // check if item is present
    if(cart["status"] == "InProgress"){
      if(!cart.hasOwnProperty(upc)){
        var itemEntry = {
          "quantity": quantity,
          "addedBy": userID
        };
        cart[upc] = itemEntry;
        carts[cartID] = cart;
        response = cart;
        writeFile(__dirname+"/data/json/","carts.json", carts);
      } else {
        response = {
          "error": "300",
          "description": "Item is already present in cart. UPC :"+upc+" cartID : "+cartID
        }
      }
    }
    else {
      response = {
        "error": "200",
        "description":"Cart Status is not In Progress"
      };
    }
  } else {
    // cartID not present. Create Empty cart with status "InProgress"
    cart = {
      "status": "InProgress",
      upc:{
        "quantity": quantity,
        "addedBy": userID
      }
    }
    carts[cartID] = cart;
    response = cart;
    writeFile(__dirname+"/data/json/","carts.json", carts);
  }

  res.end(JSON.stringify(response));
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

// This function is to delete user
app.get('/deleteUser', function(req, res){
  var ID = req.query.userID;
  var users = readFile(__dirname+"/data/json/","users.json");
  users = JSON.parse(users);
  delete users["user"+ID];
  console.log("Number of Users : "+sizeOf(users))
  writeFile(__dirname+"/data/json/","users.json", users);
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
  console.log("Reading File : "+dir+fileName);
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
var isPresent = function(list, element){
  if(list.hasOwnProperty(element))
      return true;
  else
      return false;
}

var getCart = function(ID){
  var cartID = ID;
  var response = null;
  var carts = readFile(__dirname+"/data/json/","carts.json");
  carts = JSON.parse(carts);
  if(carts.hasOwnProperty(cartID)) {
    response = carts[cartID];
  } else {
    response = {
      "error" : "404",
      "description":"CartID not found. CartID: "+cartID
    }
  }
  return response;
};

var getUser = function(ID){
  var userID = ID;
  var users = readFile(__dirname+"/data/json/","users.json");
  users = JSON.parse(users);
  var response = null;
  response = users[userID];
  if(response == null) {
    var err = {
      "error":500,
      "description":"UserID not found. UserID: "+userID
    }
    response = err;
  }
  return response;
};

var getLastKey = function(jsonObject){
  var lastKey;
  for(var key in jsonObject){
    if(jsonObject.hasOwnProperty(key)){
      lastKey = key;
    }
  }
  return lastKey;
};

/* -------------------------- Server Config --------------------------*/
var server =app.listen(8081, function(){
  var host = server.address().address;
  var port = server.address().port;
  console.log("Example app listening  Ssdd at http://%s:%s", host, port);
});
