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
        var itemDetails = getItem(upc);
        // Check if Item is present. Cannot add if Item not in Items.json
        if(!itemDetails.hasOwnProperty("error")){
          // TODO: Check if user has access to the cart.
          var itemEntry = {
            "quantity": quantity,
            "name":itemDetails.name,
            "price":itemDetails.price,
            "addedBy": userID
          };
          cart[upc] = itemEntry;
          carts[cartID] = cart;
          writeFile(__dirname+"/data/json/","carts.json", carts);
          response = cart;
        } else {
          // ERROR Item not present
          response = itemDetails;
        }
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
  var cartID = req.query.cartID;
  var userID = req.query.userID;
  console.log("/checkout : "+JSON.stringify(req.query));

  var cart = getCart(req.query.cartID);
  var response = null;
  if(!cart.hasOwnProperty("error")){
    if(cart.status != "CheckedOut"){
      //TODO: need to check if the user is in the same group as cart
      cart.status = "CheckedOut";
      var carts = readFile(__dirname+"/data/json/","carts.json");
      carts = JSON.parse(carts);
      carts[cartID] = cart;
      response = true;
      writeFile(__dirname+"/data/json/","carts.json", carts);
      console.log("/Checkout: CartID "+cartID+" CHECKED OUT by "+userID);
    } else {
      response = {
        "error":"550",
        "description": "Cart is already CheckedOut. CartID : "+cartID
      }
    }
  }
  else{
    // CartID not found
    response = cart;
    console.log("/Checkout: ERROR - "+response.description);
  }

  res.end(JSON.stringify(response));
});

app.get("/getGroup", function(req, res){
  var groupID = req.query.groupID;
  var groups = readFile(__dirname+"/data/json/","groups.json");
  groups = JSON.parse(groups);
  var response = null;
  if(groups.hasOwnProperty(groupID)){
    response = groups[groupID];
    if(response){

    }
  } else {
    response = {
      "error": "600",
      "description": "GroupID is not present. GroupID: "+groupID
    }
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
      "error" : "400",
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

var getItem = function(upc){
  var response = null;
  var Items = readFile(__dirname+"/data/json/", "items.json");
  Items = JSON.parse(Items);

  if(Items.hasOwnProperty(upc)){
    response = Items[upc];
  } else {
    response = {
      "error": "500",
      "description": "Item not found. UPC : "+upc
    }
  }
  return response;
}

/* -------------------------- Server Config --------------------------*/
var server =app.listen(8081, function(){
  var host = server.address().address;
  var port = server.address().port;
  console.log("Example app listening  Ssdd at http://%s:%s", host, port);
});
