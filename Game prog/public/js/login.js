$('.toggle').click(function(){
    $('.formulario').animate({
        height: "toggle",
        'padding-top': 'toggle',
        'padding-bottom': 'toggle',
        opacity: 'toggle'
    }, "slow");
});


let socket = io('http://192.168.0.5:3000/');
let user = {};

function sing(){
    let data = {};
    data.nombre = $('#name').val();
    data.apellido = $('#last').val();
    data.pass = $('#pass').val();
    data.nick = $('#nick').val();
    data.email = $('#email').val();
    data.pais = $('#cont').val();

    if(data.nombre && data.apellido && data.pass && data.nick && data.email && data.pais){
        socket.emit('reg', data);
        location.reload();
    }else{
        if(!data.nombre){
            $('#name').css('border-bottom', '4px solid red');
            location.href = "#name";
        }else
            $('#name').css('border-bottom', '4px solid #ff851b');
        if(!data.apellido){
            $('#last').css('border-bottom', '4px solid red');
            location.href = "#last";
        }else
            $('#last').css('border-bottom', '4px solid #ff851b');
        if(!data.pass){
            $('#pass').css('border-bottom', '4px solid red');
            location.href = "#pass";
        }else
            $('#pass').css('border-bottom', '4px solid #ff851b');
        if(!data.nick){
            $('#nick').css('border-bottom', '4px solid red');
            location.href = "#nick";
        }else
            $('#nick').css('border-bottom', '4px solid #ff851b');
        if(!data.email){
            $('#email').css('border-bottom', '4px solid red');
            location.href = "#email";
        }else
            $('#email').css('border-bottom', '4px solid #ff851b');
        if(!data.pais){
            $('#cont').css('border-bottom', '4px solid red');
            location.href = "#cont";
        }else
            $('#cont').css('border-bottom', '4px solid #ff851b');
    }
}


function login(){

    user.name = $('#user').val();
    user.pass = $('#uPass').val();
    
    if(user.name && user.pass)
        socket.emit('log', user);
    
}


socket.on('logA', (data) => {
    user = data;
    $('.contenedor-form').css('display', 'none');
    $('.lobby').css('display', 'block');
    let n = document.getElementById('username');
    let w = document.getElementById('win');
    let l = document.getElementById('lose');
    n.innerHTML = user.Nombre;
    w.innerHTML = user.Win;
    l.innerHTML = user.Lose;
});

socket.on('logD', (dat) => {
    alert("El nombre de usuario y la contraseña que ingresaste no coinciden con nuestros registros. Por favor, revisa e inténtalo de nuevo.");
    $('#user').css('border-bottom', '4px solid red');
    $('#uPass').css('border-bottom', '4px solid red');
});




