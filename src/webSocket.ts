import http, { InformationEvent } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { Server } from 'socket.io';
import { myRooms, info } from './utils.js/data';
import { convertVideo, generateSnapshots, RESOLUTIONS } from './transformation';
import path from 'path';
import { cwd } from 'process';

export const rooms = myRooms;

const server = http.createServer();
const ioServer = new Server(server, {
    cors: {
        origin: "*"
    }
});

ioServer.on('connection', socket => {
    console.log(`User: ${socket.id}`);

    socket.on('host', (userName) => {
        console.log("EventName: hostUser, username:", userName);
        // 1. create a room i.e. a new uniqueID and hostName, etc.
        const roomId = uuidv4();
        rooms.set(roomId,
            {
                host: { id: socket.id, name: userName },
                users: [],
                currentPlayTime: 0,
                isPlaying: false,
                isPaused: true,
                isSeeking: false,
                toUpdateflag: true,
                videoName: "",
                hasUploaded: false
            }
        );

        // 2. Send back the roomID ( send to itself )
        socket.join(roomId);
        socket.emit('info', { roomId: roomId, myId: socket.id, name: userName });

        // 3. send message to all rooms

    })


    // listening to user actions like play, pause, skip to next, etc
    socket.on('newUser', (data) => {
        socket.join(data.roomId);

        const room = rooms.get(data.roomId);

        socket.emit('info', {
            myId: socket.id,
            name: data.name,
            hasUploaded: room?.hasUploaded,
            videoUrl: room?.videoName
        });


        // Add the user to the use List.
        room?.users.push({
            id: socket.id,
            name: data.name
        })

        syncPlayer(room as info, socket);
    })

    socket.on('message', (data) => {
        ioServer.in(data.roomId).emit('message', data.msg);
    })

    socket.on('request', (data: { roomId: string, action: string, name: string }) => {
        //1. get the host
        const host = rooms.get(data.roomId)?.host.id;
        ioServer.to(host as string).emit('engageRequest', {
            action: data.action,
            name: data.name
        });
    })

    socket.on("play", (data) => {
        console.log("This is data", data)
        const room = rooms.get(data.roomId) as info;
        room.isPlaying = true;
        room.isPaused = false;
        // console.log("Playing", data.roomId);
        socket.to(data.roomId).emit('play_video', {
            id: socket.id,
            message: `User: ${socket.id} started playing`
        });
    })

    socket.on("pause", (data) => {
        const room = rooms.get(data.roomId) as info;
        room.isPaused = true;
        room.isPlaying = false;
        // console.log("Paused", data.roomId);
        socket.to(data.roomId).emit('pause_video', {
            id: socket.id,
            message: `User: ${socket.id} paused the song`
        });
    })

    socket.on('seeked', (data) => {
        const room = rooms.get(data.roomId) as info;
        room.isSeeking = false;
        room.currentPlayTime = data.seekedTo;
        console.log('seeked', room.currentPlayTime);
        socket.to(data.roomId).emit('seek_video', {
            seekedTo: room.currentPlayTime
        });
    })

    socket.on('currentTime', (data) => {
        const room = rooms.get(data.roomId) as info;
        console.log(data.time);
        room.currentPlayTime = data.time;
        room.toUpdateflag = true;
    })

    socket.on('sync', (data) => {
        const room = rooms.get(data.roomId) as info;
        syncPlayer(room, socket)
    })

    socket.on('uploadingStarted', (data) => {
        socket.to(data.roomId).emit('uploadHasStarted');
    })

    socket.on('uploadingEnded', async (data) => {
        console.log(data);

        //1. Set Video URL
        const id = data.fileName.split('_')[0];
        const room = rooms.get(id);
        if (room) {
            room.hasUploaded = true;
            room.videoName = data.fileName;
        }

        //2. Generate different Resolutions of video
        const sourcePath = path.join(cwd(), '/uploads/', data.fileName);
        const baseName = data.fileName.substring(0, data.fileName.lastIndexOf("."));

        const destPath = path.join(cwd(), '/Transcoding/')

        try {
            RESOLUTIONS.forEach(async (cur) => {
                convertVideo(sourcePath, cur.dimensions, `${destPath}${baseName}_${cur.size}.mp4`);
            })
        } catch (error: any) {
            console.log(error)
        }

        //3. Generate different Thumbnails of video
        const destPathThumbnails = path.join(cwd(), '/Thumbnails/', `${baseName}_%d.jpeg`);
        try {
            generateSnapshots(sourcePath, destPathThumbnails);
        } catch (error: any) {
            console.log(error);
        }



        console.log("Reached Uploading End");
        // Single Other Rooms
        ioServer.to(data.roomId).emit('uploadHasEnded', { videoUrl: room?.videoName });


    })

    socket.on('reactionEventFromClient', (data) => {
        console.log("Hello Reaction Event", data)
        socket.to(data.roomId).emit('reactionEventFromServer', { emojiId: data.emojiId })
    })

    socket.on('disconnectMe', (data) => {
        //1. Leave room
        const room = rooms.get(data.roomId) as info;

        //2. If the user is Host
        console.log(data);
        if (data.isHost) {
            // If the users is empty
            // console.log("Hello")
            if (room.users.length === 0) {
                // Leave room x 
                socket.leave(data.roomId);
                // Delete room
                rooms.delete(data.roomId);
            }
            // If the users is non-empty
            else {
                //Make the next user host
                const nextUser = room.users[0];
                console.log("Hello", nextUser.name)
                room.host = {
                    id: nextUser.id,
                    name: nextUser.name
                }
                ioServer.to(nextUser.id).emit("updateUser");
                // Leave room
                socket.leave(data.roomId);
            }
        }
        //3. If the user is not a Host than just disconnect
        socket.leave(data.roomId);
        socket.disconnect();
    })

    socket.on("disconnect", () => {
        console.log(`User ${socket.id} disconnected`);
    })
})

function syncPlayer(room: info, socket: any) {

    //1. If playing sync with others
    if (room?.isPlaying) {
        // 1. wait synchrnously for currentPlayTime to be update
        // 2. As soon as step 1 is done call a custom function which does 2 things
        // immediately
        // a. seek the player to currentTime + 2 ( we choose 2 secs in the future)
        // b. call a setTimeout for 2 secs in which we ask to play the song. This will
        // hopefully synchrnize the player.
        room.toUpdateflag = false;
        wait().then(() => {
            // console.log(toUpdateflag);
            if (room.toUpdateflag) {
                const myTimetoPlay = room.currentPlayTime + 2.5;
                setTimeout(() => {
                    socket.emit('play_video', {
                        id: "ItsMeButItsMyFirstTimeBeGentle",
                        message: "You started Playing"
                    });
                }, 2000)
                const metatdata = {
                    seekedTo: myTimetoPlay,
                    id: "ItsMeButItsMyFirstTimeBeGentle",
                    message: `$seeked to ${myTimetoPlay / 60}`
                }
                socket.emit('seek_video', metatdata);
            }
        })
    }


    //2. If paused just seek to the current time if current time!=0
    if (room?.isPaused && room.currentPlayTime != 0) {
        const metatdata = {
            seekedTo: room.currentPlayTime,
            id: "ItsMeButItsMyFirstTimeBeGentle",
            message: `$seeked to ${room.currentPlayTime / 60}`
        }
        socket.emit('seek_video', metatdata);
    }
}

function wait() {
    return new Promise((rs, rj) => {
        setTimeout(rs, 2000);
    })
}

server.listen(8000, () => {
    console.log("Websocket running on: 8000")
});