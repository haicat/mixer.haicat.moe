var mixer = {};
window.mixer = mixer;

mixer.siteUrl = "https://mixer.haicat.moe/";
mixer.backgroundLast = 3; //last background image (highest number .png)

mixer.peer = new Peer();
mixer.connection = undefined;
mixer.on = {};
mixer.ui = {};
mixer.ui.dom = {};
mixer.ui.hooks = {};


mixer.role = undefined;

mixer.masterVol = 0.7;
mixer.musicVol = 0.7;

mixer.syncTolerance = 3; // number of seconds the syncing can be off by, below which it wont correct

mixer.sounds = [];
mixer.music = [];
mixer.playing = false;
mixer.trackNumber = 0;


mixer.log = function(text){
	console.log(text);
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
	mixer.hostID = id;
};

mixer.host = function(){
	mixer.peer.on("error", mixer.on.hostError);
	mixer.peer.on("connection", mixer.on.connection);
	mixer.role = "host";
	
	for(let i = 0; i < mixer.ui.dom.hostOnly.length; i++){
		mixer.ui.dom.hostOnly[i].setAttribute("class", "hostOnly");
	}
	
	mixer.ui.showMain();
};

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
	
	for(let i = 0; i < mixer.ui.dom.hostOnly.length; i++){
		mixer.ui.dom.hostOnly[i].setAttribute("class", "hostOnly hidden");
	}
	
	mixer.ui.hideLoader();
	mixer.ui.showMain();
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
		case "add":
			mixer.addSound(data.soundURL, data.soundVolume, data.timeStamp, true);
			break;
		case "volume":
			mixer.setVolume(data.soundIndex, data.soundVolume);
			break;
		case "remove":
			mixer.removeSound(mixer.sounds[data.soundIndex], true);
			break;
		case "addYoutube":
			mixer.addYoutube(data.videoID, data.soundVolume, data.timeStamp, true);
			break;
		case "seek":
			mixer.seek(data.soundIndex, data.timeStamp, true);
			break;
		case "jukeAddYoutube":
			mixer.jukeAddYoutube(data.videoID, data.timeStamp, true)
			break;
		case "playTrack":
			mixer.playTrack(data.soundIndex,true);
			break;
		case "removeTrack":
			mixer.removeTrack(mixer.music[data.soundIndex], true);
			break;
		case "jukeInitial":
			mixer.jukeInitial(data.playing,data.trackNumber);
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
		console.log("Sending channels:");
		for(let sound in mixer.sounds){
			console.log(sound);
			mixer.sounds[sound].send(conn);
			//conn.send({command:"add", soundURL: mixer.sounds[sound].url});
		}
		console.log("Sending jukebox:");
		for(let sound in mixer.music){
			console.log(sound);
			mixer.music[sound].send(conn);
		}
		conn.send({command:"jukeInitial",playing:mixer.playing,trackNumber:mixer.trackNumber});
		/*if(mixer.playing){
			conn.send({command:"playTrack", soundIndex: mixer.trackNumber});
		}*/
	});

	mixer.log("Client connected.");
};

mixer.resync = function(){
	if(mixer.role != "host"){return;};
	for(let sound in mixer.sounds){
		console.log("Syncing "+sound);
		mixer.seek(sound, mixer.sounds[sound].getTime(), false, true)
			//conn.send({command:"add", soundURL: mixer.sounds[sound].url});
	}
}


mixer.ui.dom.idBox = document.getElementById("idBox");
mixer.ui.dom.connectBox = document.getElementById("connectBox");
mixer.ui.dom.loader = document.getElementById("loader");
mixer.ui.dom.errorBox = document.getElementById("errorBox");
mixer.ui.dom.errorContent = document.getElementById("errorContent");
mixer.ui.dom.mixerBox = document.getElementById("mixerBox");
mixer.ui.dom.soundCont = document.getElementById("soundCont");
mixer.ui.dom.soundURL = document.getElementById("soundURL");
mixer.ui.dom.youtubeID = document.getElementById("youtubeID");
mixer.ui.dom.joinID = document.getElementById("joinID");
mixer.ui.dom.mixerAddSlider = document.getElementById("mixerAddSlider");
mixer.ui.dom.joinLink = document.getElementById("joinLink");
mixer.ui.dom.autoConnectBox = document.getElementById("autoConnectBox");
mixer.ui.dom.errorCont = document.getElementById("errorCont");
mixer.ui.dom.back = document.getElementById("back");
mixer.ui.dom.hostOnly = document.getElementsByClassName("hostOnly");
mixer.ui.dom.masterSlider = document.getElementById("masterSlider");
mixer.ui.dom.jukebox = document.getElementById("jukebox");
mixer.ui.dom.musicVolume = document.getElementById("musicVolume");
mixer.ui.dom.jukeYoutubeID = document.getElementById("jukeYoutubeID");

mixer.ui.hooks.setMasterVol= function(){
	mixer.masterVol = mixer.ui.dom.masterSlider.value / 100;
	for(let sound in mixer.sounds){
		mixer.sounds[sound].setVolume(mixer.sounds[sound].dom.slider.value);
	}
};

mixer.ui.hooks.setMusicVol = function(){
	mixer.musicVol = mixer.ui.dom.musicVolume.value / 100;
	for(let sound in mixer.music){
		mixer.music[sound].setVolume();
	}
};

mixer.ui.dom.masterSlider.addEventListener("input", function(){
	mixer.ui.hooks.setMasterVol();
});

mixer.ui.dom.musicVolume.addEventListener("input", function(){
	mixer.ui.hooks.setMusicVol();
});

mixer.ui.hooks.setMasterVol();
mixer.ui.hooks.setMusicVol();

mixer.ui.errorReconnect = false;

var backIndex = Math.floor(Math.random() * mixer.backgroundLast) + 1;
mixer.ui.dom.back.style.backgroundImage = "url('f/backgrounds/"+backIndex+".png')";


mixer.ui.hideConnectBox = function(){
	mixer.ui.dom.connectBox.className = "popup panel hidden";
};

mixer.ui.showConnectBox = function(){
	mixer.ui.dom.connectBox.className = "popup panel";
};

mixer.ui.showLoader = function(){
	mixer.ui.dom.loader.className = "popup panel";
};

mixer.ui.hideLoader = function(){
	mixer.ui.dom.loader.className = "popup panel hidden";
};

mixer.ui.showMain = function(){
	mixer.ui.dom.mixerBox.className = "panel";
	mixer.ui.dom.jukebox.className = "panel";
	mixer.ui.updateID(mixer.peer.id);
};

mixer.ui.hideMain = function(){
	mixer.ui.dom.mixerBox.className = "panel hidden";
	mixer.ui.dom.jukebox.className = "panel hidden";
};

mixer.ui.updateID = function(id){
	mixer.ui.dom.idBox.innerHTML = "";
	mixer.ui.dom.idBox.appendChild(document.createTextNode(id));
	
	mixer.ui.dom.joinLink.innerHTML = "";
	if(mixer.role == "host"){
		mixer.ui.dom.joinLink.appendChild(document.createTextNode(mixer.siteUrl+"?join="+id));
	}
	if(mixer.role=="client"){
		mixer.ui.dom.joinLink.appendChild(document.createTextNode(mixer.siteUrl+"?join="+mixer.hostID));
	}
};

mixer.ui.showConnectConfirm = function(){
	mixer.ui.dom.autoConnectBox.className = "popup panel";
}

mixer.ui.hideConnectConfirm = function(){
	mixer.ui.dom.autoConnectBox.className = "popup panel hidden";
}

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

mixer.ui.showError = function(err, disconnect){
	if(disconnect==true){
		mixer.ui.errorReconnect = true;
		mixer.ui.hideMain();
	}
	mixer.ui.dom.errorCont.className = "";
	//mixer.ui.dom.errorBox.className = "popup panel";
	mixer.ui.dom.errorContent.innerHTML = "";
	mixer.ui.dom.errorContent.appendChild(document.createTextNode(err));
};

mixer.ui.hideError = function(){
    mixer.ui.dom.errorCont.className = "fadeOut";
	//mixer.ui.dom.errorBox.className = "popup panel hidden";
};

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



mixer.removeSound = function(sound, hostCommand){
	if(hostCommand == undefined){hostCommand = false;};
	if(!hostCommand){
		if(mixer.role == "client"){
			return;
		}
		if(mixer.role == "host"){
			mixer.sendData({command:"remove",soundIndex:mixer.sounds.indexOf(sound)});
		}
	}
	sound.dom.channel.parentNode.removeChild(sound.dom.channel);
	sound.dom.slider.parentNode.removeChild(sound.dom.slider);
	sound.dom.del.parentNode.removeChild(sound.dom.del);
	//sound.dom.innerLabel.parentNode.removeChild(sound.dom.innerLabel);
	sound.dom.label.parentNode.removeChild(sound.dom.label);
	
	if(sound.youtube != undefined){
		sound.youtube.destroy();
	}
	
	//if(sound.dom.sound.parentNode != null){
		sound.dom.sound.parentNode.removeChild(sound.dom.sound);
	//}
	
	sound.dom.channel = undefined;
	sound.dom.slider = undefined;
	sound.dom.del = undefined;
	//sound.dom.innerLabel = undefined
	sound.dom.label = undefined;
	sound.dom.sound = undefined;
	
	mixer.sounds.splice(mixer.sounds.indexOf(sound),1);
};


mixer.removeTrack = function(sound, hostCommand){
	if(hostCommand == undefined){hostCommand = false;};
	if(!hostCommand){
		if(mixer.role == "client"){
			return;
		}
		if(mixer.role == "host"){
			mixer.sendData({command:"removeTrack",soundIndex:mixer.music.indexOf(sound)});
		}
	}
	sound.dom.channel.parentNode.removeChild(sound.dom.channel);
	sound.dom.del.parentNode.removeChild(sound.dom.del);
	sound.dom.label.parentNode.removeChild(sound.dom.label);
	
	if(sound.youtube != undefined){
		sound.youtube.destroy();
	}
	
	sound.dom.sound.parentNode.removeChild(sound.dom.sound);
	
	sound.dom.channel = undefined;
	sound.dom.del = undefined;
	sound.dom.label = undefined;
	sound.dom.sound = undefined;
	
	mixer.music.splice(mixer.music.indexOf(sound),1);
};

mixer.setVolume = function(index, vol){
	//mixer.sounds[index].dom.sound.volume = vol;
	//mixer.sounds[index].dom.slider.value = vol * 100;
	mixer.sounds[index].dom.slider.value = vol;
	mixer.sounds[index].setVolume(vol);
};

mixer.seek = function(index, time, hostCommand, sendOnly){
	if(hostCommand == undefined){hostCommand = false;};
	if(sendOnly == undefined){sendOnly = false;};
	if(!hostCommand){
		if(mixer.role == "client"){
			return;
		}
		if(mixer.role == "host"){
			mixer.sendData({command:"seek", soundIndex: index, timeStamp:time});
		}
	}
	if(sendOnly){return;};
	mixer.sounds[index].seek(time);
};

mixer.ui.hooks.setVolume = function(sound){
	if(mixer.role == "host"){
			mixer.sendData({command:"volume",soundIndex: mixer.sounds.indexOf(sound),soundVolume:sound.dom.slider.value});
	}
	//sound.dom.sound.volume = sound.dom.slider.value / 100;
	sound.setVolume(sound.dom.slider.value);
};

mixer.playTrack = function(index, hostCommand){
	if(mixer.music.length == 0){return;};
	if(hostCommand == undefined){hostCommand = false;};

	if(!hostCommand){
		if(mixer.role == "client"){
			return;
		}
		if(mixer.role == "host"){
			mixer.sendData({command:"playTrack", soundIndex: index});
		}
	}
	
	for(let sound in mixer.music){
		mixer.music[sound].pause();
	}
	
	if(index == null){
		mixer.playing = false;
		return;
	}
	
	if(index >= mixer.music.length){
		index = 0;
	}
	
	mixer.music[index].play();
	mixer.trackNumber = index;
	mixer.playing = true;
}

mixer.jukeInitial = function(playing,trackNumber){
	mixer.playing = playing;
	mixer.trackNumber = trackNumber;
	if(mixer.playing){
		mixer.playTrack(mixer.trackNumber);
	}
}


mixer.ui.hooks.jukePlay = function(){
	mixer.playTrack(mixer.trackNumber);
}

mixer.ui.hooks.jukePause = function(){
	mixer.playTrack(null);
}

mixer.ui.hooks.jukeSkip = function(){
	mixer.trackNumber++;
	mixer.playTrack(mixer.trackNumber);
}



var youtubeOnReady = function(event, sound, volume, time){
	event.target.playVideo();
	sound.setVolume(volume);
	sound.seek(time);
	mixer.log(time);
};

var jukeYoutubeOnReady = function(event, sound, volume, time){
	if(mixer.playing && (mixer.trackNumber == mixer.music.indexOf(sound))){
		event.target.playVideo();
		sound.seek(time);
	}
	sound.setVolume(volume);
	sound.setVolume();
	sound.isReady = true;
	mixer.log(time);
};

var youtubeOnStateChange = function(event){
	if(event.data === YT.PlayerState.ENDED){
		event.target.playVideo();
		
	}
};

var jukeYoutubeOnStateChange = function(event){
	if(mixer.role == "client"){
		return;
	}
	if(event.data === YT.PlayerState.ENDED){
		mixer.trackNumber++;
		mixer.playTrack(mixer.trackNumber);
	}
}

mixer.jukeAddYoutube = function(id, time, hostCommand){
	var existing = document.getElementById(id);
	if(time==undefined){time=0;};
	if(existing != null){
		mixer.ui.showError("Cannot add the same YouTube video twice.", false);
		return;
	}
	if(hostCommand == undefined){hostCommand = false;};
	if(!hostCommand){
		if(mixer.role == "client"){
			return;
		}
		if(mixer.role == "host"){
			mixer.sendData({command:"jukeAddYoutube", timeStamp: time, videoID:id});
		}
	}
	
	let sound = {};
	sound.id = id;
	sound.isReady = false;
	sound.dom = {};
	sound.dom.sound = document.createElement("div");
	sound.dom.sound.id = id;
	
	mixer.ui.dom.soundCont.appendChild(sound.dom.sound);
	
	sound.youtube = new YT.Player(id,{
		height: '390',
		width: '640',
		videoId: id,
		events: {
			'onReady': function(event){
				jukeYoutubeOnReady(event,sound,mixer.musicVol,time);
			},
			'onStateChange': jukeYoutubeOnStateChange,
            'onError': function(){
                sound.dom.channel.className = "jukeTrack jukeError";
            }
		}
	});
	
	sound.play = function(){
		sound.dom.channel.className = "jukeTrack playing";
		if(!sound.isReady){return;};
		sound.youtube.seekTo(0, true);
		sound.youtube.playVideo();
	}
	
	sound.pause = function(){
		sound.youtube.pauseVideo();
		sound.dom.channel.className = "jukeTrack";
	}
	
	sound.setVolume = function(){
		sound.youtube.setVolume(mixer.musicVol * 100);
	}
	
	sound.seek = function(time){
		let diff = Math.abs(time - sound.getTime());
		if(diff > mixer.syncTolerance){
			sound.youtube.seekTo(time, true);
		}
	}
	
	sound.getTime = function(){
		return sound.youtube.getCurrentTime();
	}
	
	sound.getDuration = function(){
		return sound.youtube.getDuration();
	}

	sound.dom.channel = document.createElement("div");
	sound.dom.channel.className = "jukeTrack";
	
	sound.dom.del = document.createElement("button");
	sound.dom.del.className = "jukeDelete";
	if(mixer.role == "client"){
		sound.dom.del.className += " hidden";
	}
	
	sound.dom.label = document.createElement("div");
	sound.dom.label.className = "jukeLabel";
	
	sound.dom.label.appendChild(document.createTextNode(id));
	sound.dom.label.contentEditable = "true";
	
	sound.dom.channel.appendChild(sound.dom.del);
	sound.dom.channel.appendChild(sound.dom.label);
	
	
	sound.send = function(conn){
		conn.send({command:"jukeAddYoutube", videoID: sound.id, timeStamp: sound.getTime() });
	}
	
	mixer.music.push(sound);
	
	sound.dom.del.addEventListener("click", function(){
		mixer.removeTrack(sound);
	});
	
	mixer.ui.dom.jukebox.appendChild(sound.dom.channel);
	
}

mixer.addYoutube = function(id, volume, time, hostCommand){
	var existing = document.getElementById(id);
	if(existing != null){
		mixer.ui.showError("Cannot add the same YouTube video twice.", false);
		return;
	}
	if(hostCommand == undefined){hostCommand = false;};
	if(!hostCommand){
		if(mixer.role == "client"){
			return;
		}
		if(mixer.role == "host"){
			mixer.sendData({command:"addYoutube", soundVolume: volume, timeStamp: time, videoID:id});
		}
	}
	
	let sound = {};
	sound.id = id;
	sound.dom = {};
	sound.dom.sound = document.createElement("div");
	sound.dom.sound.id = id;
	
	mixer.ui.dom.soundCont.appendChild(sound.dom.sound);
	
	sound.youtube = new YT.Player(id,{
		height: '390',
		width: '640',
		videoId: id,
		events: {
			'onReady': function(event){youtubeOnReady(event, sound, volume, time);},
			'onStateChange': youtubeOnStateChange,
            'onError': function(){
                sound.dom.channel.className = "mixerChannel channelError";
            }
		}
	});
	
	/*sound.dom.sound.src = url;
	sound.dom.sound.loop = true;
	sound.dom.sound.autoplay = true;
	sound.dom.sound.volume = 0.7;*/
	
	//sound.youtube.setVolume(70);
	
	sound.setVolume = function(vol){
		sound.youtube.setVolume(vol * mixer.masterVol);
	}
	
	sound.seek = function(time){
		let diff = Math.abs(time - sound.getTime());
		if(diff > mixer.syncTolerance){
			sound.youtube.seekTo(time, true);
		}
	}
	
	sound.getTime = function(){
		return sound.youtube.getCurrentTime();
	}
	
	sound.getDuration = function(){
		return sound.youtube.getDuration();
	}

	sound.dom.channel = document.createElement("div");
	sound.dom.channel.className = "mixerChannel";
	
	sound.dom.slider = document.createElement("input");
	sound.dom.slider.className = "mixerSlider";
	sound.dom.slider.type = "range";
	sound.dom.slider.setAttribute("orient", "vertical");
	sound.dom.slider.min = 0;
	sound.dom.slider.max = 100;
	sound.dom.slider.value = volume;
	
	sound.dom.del = document.createElement("button");
	sound.dom.del.className = "mixerDelete";
	if(mixer.role == "client"){
		sound.dom.del.className += " hidden";
	}
	
	sound.dom.label = document.createElement("div");
	sound.dom.label.className = "mixerLabel";
	
	sound.dom.label.appendChild(document.createTextNode(id));
	sound.dom.label.contentEditable = "true";
	
	/*
	sound.dom.innerLabel = document.createElement("span");
	sound.dom.innerLabel.className = "mixerLabelInner";
	sound.dom.innerLabel.appendChild(document.createTextNode(id));
	sound.dom.innerLabel.contentEditable = "true";
	
	sound.dom.label.appendChild(sound.dom.innerLabel);
	*/
	
	sound.dom.channel.appendChild(sound.dom.slider);
	sound.dom.channel.appendChild(sound.dom.del);
	sound.dom.channel.appendChild(sound.dom.label);
	
	
	sound.send = function(conn){
		conn.send({command:"addYoutube", videoID: sound.id, soundVolume: sound.dom.slider.value, timeStamp: sound.getTime() /*sound.youtube.getVolume()*/});
	}
	
	mixer.sounds.push(sound);
	
	
	sound.dom.slider.addEventListener("input", function(){
		mixer.ui.hooks.setVolume(sound);
	});
	
	sound.dom.del.addEventListener("click", function(){
		mixer.removeSound(sound);
	});
	
	mixer.ui.dom.mixerBox.appendChild(sound.dom.channel);
	//mixer.ui.dom.soundCont.appendChild(sound.dom.sound);
}

mixer.addSound = function(url, volume, time, hostCommand){
	if(hostCommand == undefined){hostCommand = false;};
	if(!hostCommand){
		if(mixer.role == "client"){
			return;
		}
		if(mixer.role == "host"){
			mixer.sendData({command:"add", soundVolume: volume, timeStamp: time, soundURL:url});
		}
	}
	let sound = {};
	sound.url = url;
	sound.dom = {};
	sound.dom.sound = document.createElement("AUDIO");
	sound.dom.sound.src = url;
	sound.dom.sound.loop = true;
	sound.dom.sound.autoplay = true;
	sound.dom.sound.volume = volume/100;
	sound.dom.sound.currentTime = time;
	
	sound.setVolume = function(vol){
		sound.dom.sound.volume = (vol/100) * mixer.masterVol;
	}
	
	sound.seek = function(time){
		let diff = Math.abs(time - sound.getTime());
		if(diff > mixer.syncTolerance){
			sound.dom.sound.currentTime = time;
		}
	}
	
	sound.getTime = function(){
		return sound.dom.sound.currentTime;
	}
	
	sound.getDuration = function(){
		return sound.dom.sound.duration;
	}

	sound.dom.channel = document.createElement("div");
	sound.dom.channel.className = "mixerChannel";
    
    sound.dom.sound.onerror = function(){
        sound.dom.channel.className = "mixerChannel channelError";
    }
	
	sound.dom.slider = document.createElement("input");
	sound.dom.slider.className = "mixerSlider";
	sound.dom.slider.type = "range";
	sound.dom.slider.setAttribute("orient", "vertical");
	sound.dom.slider.min = 0;
	sound.dom.slider.max = 100;
	sound.dom.slider.value = volume;
	
	sound.dom.del = document.createElement("button");
	sound.dom.del.className = "mixerDelete";
	if(mixer.role == "client"){
		sound.dom.del.className += " hidden";
	}
	
	sound.dom.label = document.createElement("div");
	sound.dom.label.className = "mixerLabel";
	
	sound.dom.label.appendChild(document.createTextNode(url));
	sound.dom.label.contentEditable = "true";
	
	/*
	sound.dom.innerLabel = document.createElement("span");
	sound.dom.innerLabel.className = "mixerLabelInner";
	sound.dom.innerLabel.appendChild(document.createTextNode(url));
	sound.dom.innerLabel.contentEditable = "true";
	
	sound.dom.label.appendChild(sound.dom.innerLabel);
	*/
	
	sound.dom.channel.appendChild(sound.dom.slider);
	sound.dom.channel.appendChild(sound.dom.del);
	sound.dom.channel.appendChild(sound.dom.label);
	
	sound.send = function(conn){
		conn.send({command:"add", soundURL: sound.url, soundVolume: sound.dom.slider.value, timeStamp: sound.getTime()/*sound.dom.sound.volume*100*/});
	}
	
	mixer.sounds.push(sound);
	
	
	sound.dom.slider.addEventListener("input", function(){
		mixer.ui.hooks.setVolume(sound);
	});
	
	sound.dom.del.addEventListener("click", function(){
		mixer.removeSound(sound);
	});
	
	mixer.ui.dom.mixerBox.appendChild(sound.dom.channel);
	mixer.ui.dom.soundCont.appendChild(sound.dom.sound);
};

//from https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url
var parseYoutube = function(url){
	var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
	var match = url.match(regExp);
	return (match&&match[7].length==11)? match[7] : false;
}

mixer.ui.hooks.addSound = function(){
	mixer.addSound(mixer.ui.dom.soundURL.value, mixer.ui.dom.mixerAddSlider.value);
};

mixer.ui.hooks.addYoutube = function(){
	var ytid = parseYoutube(mixer.ui.dom.youtubeID.value);
	if(ytid == false){
		mixer.ui.showError("Invalid YouTube Link", false);
		return;
	}
	mixer.addYoutube(ytid, mixer.ui.dom.mixerAddSlider.value);
}

mixer.ui.hooks.jukeAddYoutube = function(){
	var ytid = parseYoutube(mixer.ui.dom.jukeYoutubeID.value);
	if(ytid == false){
		mixer.ui.showError("Invalid YouTube Link", false);
		return;
	}
	mixer.jukeAddYoutube(ytid);
}

mixer.ui.hooks.resync = function(){
	mixer.resync();
}

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

mixer.init();
