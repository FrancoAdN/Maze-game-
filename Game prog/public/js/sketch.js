let cnv;
let game = false;
let scl = 40;
let maze;
let player;
let p_change = false;
let draw_adv = false;
let adv;
let end;
let c = 0;

socket.on('maze', (data, data2, data_end) =>{
    maze = data;
    player = data2;
    end = data_end;
    game = true;
});


socket.on('adv_pos', (data) => {
    adv = data;
    draw_adv = true;
    
});

socket.on('over', (data) => {
    game = data;
});


function setup(a, b){
    cnv = createCanvas(a, b);
    if(game){
        cnv.id('mycanvas');
        $('#mycanvas').css({
            "position": "absolute",
            "left": "50%",
            "margin-left": "-"+width/2+"px"
        });
    }
    
}

function draw(){
    if(game){
        background(51);
        socket.emit('pos', player);

        for(let i = 0; i < maze.length; i++){
            for(let j = 0; j < maze[i].length; j++){
                show(maze[i][j]);
                // if(colision(maze[i][j])){
                //     changePos(player.start.x, player.start.y);
                //     p_change = false;
                // }
                    
                    
            }   
        }

        noStroke();
        fill(player.color);
        circle(player.x, player.y, player.radius);

        if(draw_adv){
            noStroke();
            fill(adv.color);
            circle(adv.x, adv.y, adv.radius);
        }

        fill('#ed259d');
        noStroke();
        rect(end.x + 1, end.y + 1, scl-1, scl-1);

        if(dist(player.x, player.y, end.x + (scl/2), end.y + (scl/2)) < 11){
            console.log('WIN');
            game = false;
            socket.emit('win');

        }


        if(p_change){
            changePos(mouseX, mouseY);
        }
    }
}


function show(obj){
    let x = obj.body.x;
    let y = obj.body.y;
    stroke(255);
    if(obj.walls[0]) // TOP WALL
        line(x, y, x + scl, y);
    if(obj.walls[1]) //RIGHT WALL
        line(x + scl, y, x + scl, y + scl);
    if(obj.walls[2]) //BOT WALL
        line(x + scl, y + scl, x, y + scl);
    if(obj.walls[3]) //LEFT WALL
        line(x, y + scl, x, y);
    
}


function changePos(x, y){
    player.x = x;
    player.y = y;
}

function mousePressed(){

    if((mouseX > player.x - player.radius && mouseX < player.x + player.radius) && (mouseY > player.y - player.radius && mouseY < player.y + player.radius )){
        p_change = true;
    }
}

function colision(obj){
    let x = obj.body.x;
    let y = obj.body.y;
    let range = 11;
    if(obj.walls[0]){
        if(dist(x + (scl / 2), y, player.x, player.y) < range){
            return true;
        }
    }

    if(obj.walls[1]){
        if(dist(x + scl, y + (scl / 2), player.x, player.y) < range){
            return true;
        }
    }

    if(obj.walls[2]){
        if(dist(x + (scl / 2), y + scl, player.x, player.y) < range){
            return true;
        }
    }

    if(obj.walls[3]){
        if(dist(x, y + (scl / 2), player.x, player.y) < range){
            return true;
        }
    }

    return false;
}