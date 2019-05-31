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
    console.log('Se ha registrado un nuevo usuario: ');
    console.log(reg);
  });

  //MAKING A NEW GAME
  socket.on('newgame', (data, d) => {
    for(let i = 0; i < users.length; i++){
      if(users[i].ID === d.ID){
        let newG = {
          id: c_games,
          host: users[i].Nombre,
          num_p: 1,
          p_one: users[i].ID,
          p_two: null,
          dif: data
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
        games[i].p_two = p_id;
        en = i;
        break;
      }
    }
    for(let j = 0; j < users.length; j++){
      if(users[j].ID == p_id){
        if(en >= 0){
          games[en].num_p++;
          users[j].sock.emit('entry', games[en]);
          checkState();
        }else
          users[j].sock.emit('n_ent', null);
        break;
      }
    }
  });

}); 


function sendGames(){
  for(let i = 0; i < users.length; i++)
    users[i].sock.emit('gList', games);
}

function checkState(){
  for(let i = 0; i < games.length; i++){
    if(games[i].num_p === 2){
      for(let j = 0; j < users.length; j++){
        if(users[j].ID == games[i].p_one || users[j].ID == games[i].p_two)
          users[j].sock.emit('startgame', null);
      }
    }
  }
}