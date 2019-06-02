let id_game;
let game_list;
let scl;
let game = false;
let dfc = null;
let player;
function showMenu() {
    let x = document.getElementById("n_game");
    if (x.style.display === "none")
      x.style.display = "block";
    else
      x.style.display = "none";
    
}



function setDif(a){ 
    dfc = a;
}

function newGame(){
    if(dfc){
        socket.emit('newgame', dfc, user);
    }else{
        location.href = '#range';
        alert('Seleccione la dificultad');
    }
}


socket.on('entry', (data) => {
    id_game = data;
    console.log(id_game);
    scl = id_game.scl;
    $('.lobby').css('display', 'none');
});

socket.on('n_ent', (dat) =>{
    alert('No fue posible entrar a la partida, por favor intentelo de nuevo o cree una');
});

socket.on('gList', (data) => {
    game_list = data;
    console.log(game_list);
    if(game_list.length > 0){
        $('#gameL p').remove();
        
        for(let i = 0; i < game_list.length; i++){
            $('#gameL').append(`<center><p onclick="entryG(${game_list[i].id})">  ${game_list[i].host}     ${game_list[i].dif}           ${game_list[i].num_p}/2 </p></center>`);
        }
    }else
        $('#gameL p').remove();
});


socket.on('startgame', (dat) => {
    $('#mycanvas').css('display', 'block');
    setup(801, 601);
});


function entryG(a){
    console.log(a);
    socket.emit('r_ent', a, user.ID);
}


