'use strict';

const ADODB = require('node-adodb');
const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=db.mdb;');

const express = require("express");
let app = express();
const server = app.listen(3000);
app.use(express.static('public'));
const socket = require('socket.io');
let io = socket(server);
//io.close();
let usr;
let games = [];
let users = [];
let c_games = 0;

let grid;
let cols,rows;
let scl = 0;

let current;
let stack = [];
let cnt = 0

let width = 800;
let height = 600;


io.sockets.on('connection',(socket) => {
  console.log('New connection ' + socket.id);

  //LOG IN CODE
  socket.on('log', (user) => {
    connection
    .query('SELECT * FROM Users WHERE Nombre = '+ '"'+ user.name + '"')
    .then(data => {
      let cont = 0;
      for(let i = 0; i < data.length; i++){
        let pass = data[i].Pass;
        if(user.pass && pass){
          if(pass == user.pass){
            console.log(`Usuario ingresado ${user.name}`);
            usr = data[i];
            socket.emit('logA', usr);
            usr.sock = socket;
            users.push(usr);
            sendGames();
            break;
          }else
            cont++;
        }
      }
      if(cont == data.length){
        console.log("Usuario o contraseña incorrecta");
        socket.emit('logD', null);
      }
    
    });
  });

  
  //REGISTER CODE
  socket.on('reg', (reg) => {
    let inst = `INSERT INTO Users(Nombre, Apellido, Pass, Nickname, Email, Pais) VALUES ("${reg.nombre}", "${reg.apellido}", "${reg.pass}", "${reg.nick}", "${reg.email}", "${reg.pais}")`;
    connection
    .execute(inst)
    .then(data => {
      console.log('Se ha registrado un nuevo usuario: ');
      console.log(reg);
    })
    .catch(error => {
      console.error(error);
    });
    console.log('Se ha registrado un nuevo usuario: ');
    console.log(reg);
  });

  //MAKING A NEW GAME
  socket.on('newgame', (data, d) => {
    for(let i = 0; i < users.length; i++){
      if(users[i].ID === d.ID){
        let newG = {
          maze: makeMaze(true, data),
          id: c_games,
          host: users[i].Nombre,
          num_p: 1,
          //PLAYER ATTR
          p_one: {
            id: users[i].ID,
            start: {
                x: Math.floor(Math.random()* (cols-1)) * scl + (scl/2),
                y: Math.floor(Math.random()* (rows-1)) * scl + (scl/2)
            },
            x: 0,
            y: 0,
            radius: (scl/2) - 5,
            color:'#00ff00'
          },
          p_two: null,
          dif: data,
          scl:scl,
          end:{
            x: Math.floor(Math.random()* (cols-1)) * scl,
            y: Math.floor(Math.random()* (rows-1)) * scl
          }
        };
        
        users[i].sock.emit('entry', newG);
        checkState();
        games.push(newG);
        sendGames();
        c_games++;
      }
    }
  });


  socket.on('r_ent', (id, p_id) => {
    let en = null;
    for(let i = 0; i < games.length; i++){
      if(games[i].id === id && games[i].num_p < 2){
        games[i].p_two = {
          id: p_id,
          start: {
            x: Math.floor(Math.random()* (cols-1)) * scl + (scl/2),
            y: Math.floor(Math.random()* (rows-1)) * scl + (scl/2)
          },
          x:0,
          y:0,
          radius: (scl/2) - 5,
          color:'#d142f4'
        };
        en = i;
        break;
      }
    }
    for(let j = 0; j < users.length; j++){
      if(users[j].ID == p_id){
        if(en >= 0 && en < 2){
          games[en].num_p++;
          users[j].sock.emit('entry', games[en]);
          checkState();
        }else
          users[j].sock.emit('n_ent', null);
        break;
      }
    }
  });



  socket.on('pos',(data, p)=>{
    
    let s;
    for(let i = 0; i < games.length; i++){
      if(games[i].id === p){
        if(data.id == games[i].p_one.id)
          s = games[i].p_two.id;
        else
          s = games[i].p_one.id;
        
        break;
      }
    }
  
    for(let i = 0; i < users.length; i++){
      if(users[i].ID === s){
        users[i].sock.emit('adv_pos', data);
        break;
      }
    }
  });

  socket.on('win', (pid, gid) => {
    let s;
    for(let i = 0; i < games.length; i++){
      if(games[i].id === gid){
        if(pid == games[i].p_one.id)
          s = games[i].p_two.id;
        else
          s = games[i].p_one.id;
        
        break;
      }
    }

    for(let i = 0; i < users.length; i++){
      if(users[i].ID === s){
        users[i].Lose++;
        updateScore(s, users[i].Win, users[i].Lose)
        users[i].sock.emit('over', false);
        break;
      }else if(users[i].ID === pid){
        users[i].Win++;
        updateScore(s, users[i].Win, users[i].Lose);
      }
    }

    for(let i = 0; i < games.length; i++){
      if(games[i].id === gid){
        games.splice(i, 1);
        sendGames();
      }
    }
  });

}); 


function updateScore(id, value, val){
  
  let inst = `UPDATE Users
  SET Win = ${value}, Lose= ${val}
  WHERE ID = ${id};`;
    connection
    .execute(inst)
    .then(data => {
      console.log('Se ha insertado el registro: ');
    })
    .catch(error => {
      console.error(error);
    });
}



function sendGames(){
  for(let i = 0; i < users.length; i++)
    users[i].sock.emit('gList', games);
}

function checkState(){
  let end = {
    x: Math.floor(Math.random()* (cols-1)) * scl,
    y: Math.floor(Math.random()* (rows-1)) * scl
  };
  for(let i = 0; i < games.length; i++){
    if(games[i].num_p === 2){
      for(let j = 0; j < users.length; j++){
        if(users[j].ID == games[i].p_one.id || users[j].ID == games[i].p_two.id){
          if(users[j].ID == games[i].p_one.id)
            users[j].sock.emit('play', games[i].p_one);
          else
            users[j].sock.emit('play', games[i].p_two);
          users[j].sock.emit('endpoint', end);
          users[j].sock.emit('maze', games[i].maze);
          users[j].sock.emit('startgame', null);
        }
      }
    }
  }
}






class Cell{
  constructor(i, j){
    this.body = {x: i * scl, y: j * scl};
    this.walls = [true, true, true, true];  // top, right, bot, left
    this.visited = false;
  }
   
  checkNeighbors(){
    let x = this.body.x / scl;
    let y = this.body.y / scl;
    let neighbors = [];

    let top, right, bot, left;

    if(index(x-1,y))
      top = grid[x-1][y];
    else
      top = index(x-1,y);

    if(index(x, y+1))
      right = grid[x][y+1];
    else
      right = index(x, y+1);

    if(index(x+1, y))
      bot = grid[x+1][y];
    else
      bot = index(x+1, y);

    if(index(x, y-1))
      left = grid[x][y-1];
    else
      left = index(x, y-1)


        
        
        
    if(top && !top.visited)
      neighbors.push(top);
    if(right && !right.visited)
      neighbors.push(right);
    if(bot && !bot.visited)
      neighbors.push(bot)
    if(left && !left.visited)
      neighbors.push(left)
        

    if(neighbors.length > 0){
      let r = Math.floor(Math.random() * neighbors.length);
      return neighbors[r];

    }else
      return undefined;
  }
}

function index(i, j) {
  if (i < 0 || j < 0 || i > cols-1 || j > rows-1) {
    return undefined;
  }
  return 1
}

function makeMaze(game, dif){
  if(dif === 1)
    scl = 50;
  else if(dif === 2)
    scl = 25;
  else if(dif === 3)
    scl = 20;
  
  cols = Math.floor(width / scl);
  rows = Math.floor(height / scl);

  grid = make2DArray(cols, rows);
  for(let i = 0; i < cols; i++){
    for(let j = 0; j < rows; j++){
        grid[i][j] = new Cell(i, j);
    }
  }
        
  current = grid[0][0];

  while (game){

    for(let i = 0; i < cols; i++){
      for(let j = 0; j < rows; j++){
        if(grid[i][j].visited)
          cnt++;
        else
          cnt = 0;
      }
    }
        
    if(cnt > rows*cols){
      game = false;
      console.log('MAZE DONE');
    }else{
      current.visited = true;

      let next = current.checkNeighbors();
      if(next){
        next.visited = true;    

        stack.push(current);
        //STEP 3
        removeWalls(current, next);
        
        //STEP 4
        current = next;
      }else if(stack.length > 0){
        current = stack.pop();
      }
    }
            
            
  }
  return grid;
}


    
    

function make2DArray(a, b) {
  let arr = new Array(a);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = new Array(b);
  }
  return arr;
}

function removeWalls(a, b){
  var x = (a.body.x / scl)  - (b.body.x / scl);
  if (x === 1){
    a.walls[3] = false;
    b.walls[1] = false;
  }else if (x === -1){
    a.walls[1] = false;
    b.walls[3] = false;
  }
  var y = (a.body.y / scl) - (b.body.y / scl);
  if(y === 1) {
    a.walls[0] = false;
    b.walls[2] = false;
  }else if (y === -1) {
    a.walls[2] = false;
    b.walls[0] = false;
  }
}






