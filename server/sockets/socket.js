const Usuarios = require('../clases/usuarios');
const {io} = require('../server');
const {crearMensaje} = require('../utilidades/utilidades');

const usuarios = new Usuarios();

io.on('connection', (client) => {

    console.log('Usuario conectado');
    
    client.on('entrarChat', (usuario, callback) => {

        if(!usuario.nombre || !usuario.sala){
            return callback({
                error: true,
                mensaje: 'El nombre y sala son necesarios'
            });
        }

        client.join(usuario.sala);

        usuarios.agregarPersona(client.id,usuario.nombre, usuario.sala);

        client.broadcast.to(usuario.sala).emit('listaPersonas',usuarios.getPersonasSala(usuario.sala));

        callback(usuarios.getPersonasSala(usuario.sala));
    });

    client.on('crearMensaje', (data) => {
        const persona = usuarios.getPersona(client.id);
        const mensaje = crearMensaje(persona.nombre, data.mensaje);
        client.broadcast.to(persona.sala).emit('crearMensaje',mensaje);
    });

    client.on('disconnect', () => {
        console.log('id',client.id);
        const personaBorrada = usuarios.borrarPersona(client.id);
        console.log('borrado', personaBorrada);
        client.broadcast.to(personaBorrada.sala).emit('crearMensaje',crearMensaje('Administrador', personaBorrada.nombre + ' abandonó el chat'));
        client.broadcast.to(personaBorrada.sala).emit('listaPersonas',usuarios.getPersonasSala(personaBorrada.sala));
    });

    client.on('mensajePrivado', (data) => {
        const persona = usuarios.getPersona(client.id);

        client.broadcast.to(data.para).emit('mensajePrivado',crearMensaje(persona.nombre, data.mensaje));
    })

});