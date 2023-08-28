const socket = io('http://192.168.29.152:8000');

const audioElement = document.getElementById('myAudi');
let userId;
let action_by_user;

//on connect get the ID
socket.on('connect', () => {
  userId = socket.id;
  action_by_user = userId;
  socket.emit('newUser');
});

// message emitted from the server.
socket.on('play_song', (data) => {
  console.log(data.message);
  action_by_user = data.id;
  audioElement.play();
});

socket.on('pause_song', (data) => {
  console.log(data.message);
  action_by_user = data.id;
  audioElement.pause();
});

socket.on('seek_song', (data) => {
  console.log(data.message);
  action_by_user = data.id;
  audioElement.currentTime = data.seekedTo;
});

audioElement.onplay = () => {
  // if played by someone else, that return
  if (userId != action_by_user) {
    action_by_user = userId;
    return;
  }

  // if clicked and played by me than emit.
  startBroadcastCurrentTime();
  socket.emit('play', 'Playing');
};

audioElement.onpause = () => {
  if (userId != action_by_user) {
    action_by_user = userId;
    return;
  }

  endBroadcastCurrentTime();
  socket.emit('pause', 'Paused');
};

audioElement.onseeked = (e) => {
  if (userId != action_by_user) {
    action_by_user = userId;
    return;
  }
  const seekedTo = e.target.currentTime;
  socket.emit('seeked', seekedTo);
};

let Timer;
const startBroadcastCurrentTime = () => {
  Timer = setInterval(() => {
    socket.emit('currentTime', audioElement.currentTime);
  }, 1000);
};

const endBroadcastCurrentTime = () => {
  if (Timer) {
    clearInterval(Timer);
  }
};
