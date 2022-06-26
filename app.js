//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose =  require('mongoose');
const _ = require('lodash');

const app = express();

// const url = 'mongodb://0.0.0.0:27017/todolist';
const url = 'mongodb+srv://predator300:N9k8i12mongo@cluster0.9aggl6q.mongodb.net/toDoList?retryWrites=true&w=majority'

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

mongoose.connect(url);

const itemsSchema = new mongoose.Schema({
  name : {
    type : String
  }
});

const workListSchema = new mongoose.Schema({
  name : {
    type : String
  }
});

const listSchema = new mongoose.Schema({
  name : {
    type : String
  },
  items : [itemsSchema]
})

const toDoList = new mongoose.model('item', itemsSchema);
// const workList = new mongoose.model('worklist', workListSchema);
const List = new mongoose.model('List', listSchema);

const Welcome = new toDoList({
  name : "Welcome to our To Do List"
});

const addItem = new toDoList({
  name : "Hit the + button to add items"
});

const removeItem = new toDoList({
  name : "Hit the check box to delete the item"
});

let defaultItems = [Welcome, addItem, removeItem];

app.get("/", function(req, res) {

  const day = date.getDate();
  // using find if any elements are there, and if there isn't we insert default items in it 
  // rather than commenting out insertMany as it cannot be done in real time situation
  toDoList.find(function(err, items){
    if(err){
      console.log(err);
    }
    else{
      if(items.length===0){
        toDoList.insertMany(defaultItems, function(err){
          if(err){
            console.log(err);
          }
        });
        res.render("list", {listTitle : day, newListItems : defaultItems});
        //or res.redirect("/");
      }
      else{
        res.render("list", {listTitle: day, newListItems: items});
      }
    }
  });
});

app.post("/", function(req, res){
  const listName = _.upperFirst(req.body.list);
  const day = _.upperFirst(date.getDate());
  const newItem = new toDoList({
    name : req.body.newItem
  });
  if(listName === day){
    newItem.save();
    res.redirect('/');
  }
  else{
    List.findOne({name : listName}, function(err, foundList){
      foundList.items.push(newItem);
      foundList.save();
    });
    res.redirect('/'+listName);
  }
});

app.get('/:customListName', function(req, res){
  const listName = _.upperFirst(req.params.customListName);
  // console.log(listName);
  List.findOne({name : listName}, function(err, foundList){
    if(!err){
      // because here we are checking for only one so returns JSON object
      if(!foundList){ 
        const list = new List({
          name : listName,
          items : defaultItems
        });
        list.save();  
        res.redirect("/"+listName);
      }
      else{
        res.render("list",{listTitle:listName, newListItems: foundList.items}) ;
      }
    }
  });
});

app.post("/delete", function(req, res){
    const checkbox = req.body.checkItem;
    const day = _.upperFirst(date.getDate());
    const listName = _.upperFirst(req.body.listName);
    if(listName === day){
      toDoList.findByIdAndRemove(checkbox, function(err){
        if(err){
          console.log(err);
        } 
      });
      res.redirect("/");
    }
    else{
      List.findOneAndUpdate(
        {name : listName},
        {$pull : {items : {_id : checkbox}}},
        function(err, docs){
          if(err){
            console.log(err);
          }
          else{
            res.redirect("/"+listName);
          }
        }
      );
    }
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
