(async function(){

var mixer = {};
window.mixer = mixer;

mixer.siteUrl = "https://mixer.haicat.moe/";
mixer.maxTracks = 6;
// number of seconds the syncing can be off by, below which it wont correct
mixer.syncTolerance = 3;


mixer.peer = new Peer();
mixer.connection = undefined;
mixer.on = {};


mixer.role = undefined;

mixer.masterVol = 0.7;
mixer.musicVol = 0.7;


mixer.sounds = [];

mixer.juke = {};
mixer.juke.listString = "";
mixer.juke.music = [];
mixer.juke.resumeTrack = null;

mixer.bind = (await import("./mixer.bind.js")).default;
mixer.ui = (await import("./mixer.ui.js")).default;




mixer.log = function(text){
	console.log(text);
	mixer.notify(text,true)
};

mixer.connect = function(id){
    if(id.trim() == ""){
        mixer.ui.hideLoader();
        mixer.ui.showError("Host ID must not be blank.", true);
        return;
    }
	mixer.peer.on("error", mixer.on.clientError);
	mixer.connection = mixer.peer.connect(id);
	mixer.connection.on("data", mixer.on.clientData);
	mixer.connection.on("open", mixer.on.open);
	mixer.connection.on("close", function(){
		mixer.notifyImportant("Host disconnected.",false);
	});
	mixer.hostID = id;
};

mixer.host = function(){
	mixer.peer.on("error", mixer.on.hostError);
	mixer.peer.on("connection", mixer.on.connection);
	mixer.peer.on("disconnected", mixer.on.serverDisconnect);
	mixer.role = "host";
	for(let i = 0; i < mixer.maxTracks; i++){mixer.addTrack();};
	mixer.bind.bindGlobal(mixer.on.hostBind);
	
	for(let i = 0; i < mixer.ui.dom.hostOnly.length; i++){
		mixer.ui.dom.hostOnly[i].setAttribute("class", "hostOnly");
	}
	
	mixer.ui.showMain(mixer.peer.id,mixer.hostID,mixer.role,mixer.siteUrl);
};

mixer.on.hostBind = function(key, value){
	mixer.sendData({command:"set", key: key, value: value});
};

mixer.on.serverConnect = function(){
	mixer.notify("Connected to the signaling server.", true);
};

mixer.peer.on("open", mixer.on.serverConnect);

mixer.on.serverDisconnect = function(){
	let notif = mixer.notifyImportant("Disconnected from the signaling server. Click here to reconnect.",false);
	notif.onclick = function(){
		mixer.peer.reconnect();
		notif.clearNotification();
		notif.onclick = undefined;
	}
}

mixer.on.clientError = function(err){
	mixer.ui.hideLoader();
	if((err.type == "invalid-id") || (err.type == "peer-unavailable")){
		mixer.ui.showError("Invalid host ID.", true);
		mixer.role = undefined;
	}else if(err.type == "disconnected"){
		mixer.ui.showError("Disconnected from the host.", true);
		mixer.role = undefined;
	}else{
		mixer.ui.showError("Unhandled error: "+err.type, true);
		mixer.role = undefined;
	}
	
};

mixer.on.hostError = function(err){
	mixer.log(err);
};

mixer.on.open = function(){
	mixer.log("Connected.");
	mixer.role = "client";
	for(let i = 0; i < mixer.maxTracks; i++){mixer.addTrack();};
	for(let i = 0; i < mixer.ui.dom.hostOnly.length; i++){
		mixer.ui.dom.hostOnly[i].setAttribute("class", "hostOnly hidden");
	}
	
	mixer.ui.hideLoader();
	mixer.ui.showMain(mixer.peer.id,mixer.hostID,mixer.role,mixer.siteUrl);
};

mixer.sendData = function(data){
	for(let conn in mixer.peer.connections){
		if(mixer.peer.connections[conn][0] == undefined){
			continue;
		}
		mixer.peer.connections[conn][0].send(data);
	}
}

mixer.on.clientData = function(data){
	if(data.commend == "undefined"){return;};
	switch(data.command.trim()){
		case "set":
			mixer.bind.set(data.key, data.value);
			break;
		default:
			mixer.log("Unknown host command: "+data.command);
	}
};



mixer.on.connection = function(conn){
	conn.on("data", function(data){
		mixer.log(data);
	});
	conn.on("open", function(){
		for(let prop in mixer.bind.properties){
			conn.send({command:"set", key: prop, value: mixer.bind.get(prop)});
		}
	});
	
	conn.on("close", function(){
		mixer.log("Client disconnected.",true);
	});

	mixer.log("Client connected.");
};


mixer.notify = function(message, autoclear, onClear){
	if(autoclear === undefined){autoclear = true;};
	let notification = document.createElement("div");
	notification.className = "notification";
	notification.appendChild(document.createTextNode(message));
	notification.clearNotification = function(){
		setTimeout(function(){
			mixer.ui.dom.notificationBar.removeChild(notification);
		},500);
		notification.className = "notification notifHide";
	}
	if(autoclear){
		setTimeout(function(){
			if(onClear != undefined){
				onClear();
			}
			notification.clearNotification();
		},10000);
	}
	mixer.ui.dom.notificationBar.appendChild(notification);
	return notification;
};

mixer.notifyImportant = function(message, autoclear, onClear){
	if(autoclear === undefined){autoclear = true;};
	let notification = document.createElement("div");
	notification.className = "notification notifImportant";
	notification.appendChild(document.createTextNode(message));
	notification.clearNotification = function(){
		setTimeout(function(){
			mixer.ui.dom.notificationBar.removeChild(notification);
		},500);
		notification.className = "notification notifImportant notifHide";
	}
	if(autoclear){
		setTimeout(function(){
			if(onClear != undefined){
				onClear();
			}
			notification.clearNotification();
		},10000);
	}
	mixer.ui.dom.notificationBar.appendChild(notification);
	return notification;
};

mixer.playTrack = function(ytid, vol){
	for(let sound of mixer.sounds){
		if(!sound.visible){
			sound.load(ytid);
			sound.setVolume(vol);
			return;
		}
	}
	mixer.ui.showError("Max number of tracks reached.");
};


mixer.ui.hooks.setMasterVol= function(){
	mixer.masterVol = mixer.ui.dom.masterSlider.value / 100;
	for(let sound in mixer.sounds){
		mixer.sounds[sound].setVolume(mixer.sounds[sound].dom.slider.value);
	}
};

mixer.ui.dom.masterSlider.addEventListener("input", function(){
	mixer.ui.hooks.setMasterVol();
});

mixer.ui.dom.musicVolume.addEventListener("input", function(){
	mixer.ui.hooks.setMusicVol();
});





mixer.ui.hooks.acYes = function(){
	mixer.ui.hideConnectConfirm();
	mixer.ui.showLoader();
	mixer.ui.hideConnectBox();
	mixer.connect(mixer.autoConnectId);
}

mixer.ui.hooks.acNo = function(){
	mixer.ui.hideConnectConfirm();
	mixer.ui.showConnectBox();
}


mixer.ui.hooks.errorOK = function(){
	mixer.ui.hideError();
	if(mixer.ui.errorReconnect){
		mixer.ui.errorReconnect = false;
		mixer.ui.showConnectBox();
	}
};

mixer.ui.hooks.connect = function(){
	mixer.ui.showLoader();
	mixer.ui.hideConnectBox();
	mixer.connect(mixer.ui.dom.joinID.value);
};

mixer.ui.hooks.host = function(){
	mixer.ui.hideConnectBox();
	mixer.host();
};


mixer.addTrack = function(){
	let sound = {};
	sound.id = (mixer.sounds.push(sound)-1);
	sound.ready = false;
	sound.visible = false;
	sound.dom = mixer.ui.createChannelYoutube(mixer.role, sound.id, {
		'onReady': function(event){
			sound.ready = true;
			mixer.bind(sound.key("volume"),(v)=>{sound.setVolume(v,true);});
			mixer.bind(sound.key("videoID"),(v)=>{sound.load(v,true);});
			mixer.bind(sound.key("time"),(v)=>{sound.seek(v,true);});
		},
		'onStateChange': function(event){
			if(event.data === YT.PlayerState.ENDED){
				event.target.playVideo();
			}
		},
		'onError': function(){
			sound.dom.channel.className = "mixerChannel channelError";
		}
	});
	
	sound.key = function(sub){
		return "mixerTrack"+sound.id+sub;
	};
	
	//getters
	sound.getTime = function(){
		if(!sound.ready){
			return 0;
		}
		return sound.dom.youtube.getCurrentTime();
	}
	
	sound.getDuration = function(){
		if(!sound.ready){
			return 0;
		}
		return sound.dom.youtube.getDuration();
	}
	
	
	//setters
	sound.setVolume = function(vol, suppressBind){
		if(sound.ready){
			sound.dom.youtube.setVolume(vol * mixer.masterVol);
			if(sound.dom.youtube.isMuted()){
				sound.dom.youtube.unMute();
			}
		}
		
		if(suppressBind != true){
			mixer.bind.set(sound.key("volume"), vol);
		}
		sound.dom.slider.value = vol;
	}
	
	
	sound.seek = function(time, suppressBind){
		let diff = Math.abs(time - sound.getTime());
		if((diff > mixer.syncTolerance) && sound.ready){
			sound.dom.youtube.seekTo(time, true);
		}
		if(suppressBind != true){
			mixer.bind.set(sound.key("time"), time);
		}
	}
	
	
	sound.load = function(videoID, suppressBind){
		sound.visible = (videoID!=null);
		sound.dom.channel.className = (videoID==null)?"mixerChannel hidden":"mixerChannel";
		if(sound.ready){
			if(videoID == null){
				sound.dom.youtube.stopVideo();
			}else{
				sound.dom.youtube.loadVideoById(videoID);
			}
		}
		if(suppressBind != true){
			mixer.bind.set(sound.key("videoID"), videoID);
		}
	};
	
	sound.dom.slider.addEventListener("input", function(){
		mixer.bind.set(sound.key("volume"),sound.dom.slider.value);
		
	});
	if(mixer.role == "host"){
		sound.dom.del.addEventListener("click", function(){
			sound.load(null);
		});
	}
};


mixer.juke.addTrack = function(videoID, suppressBind){
	let dom = mixer.ui.createJukeTrack(videoID, mixer.role);
	let musicID = mixer.juke.music.push(videoID);
	
	dom.del.addEventListener("click", function(){
		
		let ids = mixer.juke.listString.split("|");
		if(ids.length == 1){
			mixer.ui.hooks.jukePause();
		}else{
			mixer.ui.hooks.jukeSkip();
		}
		var index = ids.indexOf(videoID);
		if(index != -1){
			ids.splice(index, 1);
			mixer.bind.set("musicList",ids.join("|"));
		}
		
	});
	
	dom.channel.ondblclick = function(){
		if(mixer.role=="client"){return;};
		mixer.bind.set("musicID",videoID);
	}
	
	mixer.ui.dom.jukeContent.appendChild(dom.channel);
	if(!suppressBind){
		mixer.bind.set("musicList",mixer.bind.get("musicList")+"|"+videoID);
	}
};

mixer.bind("musicList",(v)=>{
	mixer.juke.listString = v??"";
	mixer.ui.dom.jukeContent.innerHTML = "";
	let ids = mixer.juke.listString.split("|");
	for(let id of ids){
		//why yes i am aware of how inefficient and stupid this is
		//but im lazy and want to do this with binding rather than
		//the messiness of making more host commands
		//doing it this way means i have to write less code
		if(id==""){continue;};
		mixer.juke.addTrack(id, true);
	}
	mixer.ui.jukeUpdatePlaying(mixer.bind.get("musicID"));
});

//from https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url
var parseYoutube = function(url){
	var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
	var match = url.match(regExp);
	return (match&&match[7].length==11)? match[7] : false;
};

YT.ready(()=>{
mixer.juke.player = new YT.Player(mixer.ui.dom.jukePlayer.id,{
	height: '390',
	width: '640',
	events: {
		'onReady': function(event){
			
			mixer.bind("musicVol",(v)=>{
				mixer.musicVol = v;
				mixer.ui.dom.musicVolume.value = v;
				mixer.juke.player.setVolume(mixer.musicVol * mixer.masterVol);
			});
			mixer.bind("musicID",(v)=>{
				if(v == null){
					mixer.juke.player.stopVideo();
					return;
				};
				mixer.juke.resumeTrack = v;
				mixer.juke.player.loadVideoById(v);
				
				mixer.ui.jukeUpdatePlaying(v);
			});
		},
		'onStateChange': function(event){
			if(event.data === YT.PlayerState.ENDED){
				mixer.ui.hooks.jukeSkip();
			}
			
		},
		'onError': function(){
			//sound.dom.channel.className = "mixerChannel channelError";
		}
	}
});
});


mixer.ui.hooks.jukePlay = function(){
	let ids = (mixer.bind.get("musicList")??"").split("|");
	if(ids == ""){return;};
	
	let toPlay = ids[0];
	if(ids.indexOf(mixer.juke.resumeTrack) != -1){
		toPlay = mixer.juke.resumeTrack;
	}
	
	mixer.bind.set("musicID",toPlay);
};

mixer.ui.hooks.jukePause = function(){
	mixer.bind.set("musicID",null);
};

mixer.ui.hooks.jukeSkip = function(){
	let playingID = mixer.bind.get("musicID");
	
	if(playingID == null){
		playingID = mixer.juke.resumeTrack;
	};
	
	let ids = (mixer.bind.get("musicList")??"").split("|");
	if(ids == ""){return;};
	
	let index = ids.indexOf(playingID)+1;
	if(index < 0){index = 0;};
	if(index >= ids.length){index = 0;};
	
	mixer.bind.set("musicID",ids[index]);
};

mixer.ui.hooks.setMusicVol = function(){
	mixer.bind.set("musicVol",mixer.ui.dom.musicVolume.value);
};


mixer.ui.hooks.addYoutube = function(){
	var ytid = parseYoutube(mixer.ui.dom.youtubeID.value);
	if(ytid == false){
		mixer.ui.showError("Invalid YouTube Link", false);
		return;
	}
	mixer.playTrack(ytid, mixer.ui.dom.mixerAddSlider.value);
	mixer.ui.dom.youtubeID.value = "";
}

mixer.ui.hooks.jukeAddYoutube = function(){
	let inputs = mixer.ui.dom.jukeYoutubeID.value.trim().split("\n");
	if(inputs.length==0){
		return;
	}
	let err = false;
	let ids = mixer.bind.get("musicList")??"";
	for(let index in inputs){
		let line = inputs[index].trim();
		if(line == ""){
			continue;
		}
		var ytid = parseYoutube(line);
		if(ytid==false){
			err = true;
			continue;
		};
		if(ids.includes(ytid)){continue;};
		ids += ((ids=="")?"":"|")+ytid;
	}
	mixer.bind.set("musicList", ids);
	if(err == true){
		mixer.ui.showError("One or more lines contained an invalid YouTube link and was not added.", false);
		return;
	}
	mixer.ui.dom.jukeYoutubeID.value = "";
};

mixer.init = function(){
	var url = new URL(window.location.href);
	var joinId = url.searchParams.get("join");
	if(joinId != null){
		mixer.ui.hideConnectBox();
		mixer.autoConnectId = joinId;
		mixer.ui.showConnectConfirm();
		/*
		mixer.ui.showLoader();
		mixer.ui.hideConnectBox();
		mixer.connect(joinId);
		*/
	}
};

mixer.ui.hooks.setMasterVol();
mixer.ui.hooks.setMusicVol();

mixer.init();
})();