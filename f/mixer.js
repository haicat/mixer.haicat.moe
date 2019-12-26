var mixer = {};
window.mixer = mixer;

mixer.siteUrl = "https://mixer.haicat.moe/";
mixer.backgroundLast = 3; //last background image (higher number .png)

mixer.peer = new Peer();
mixer.connection = undefined;
mixer.on = {};
mixer.ui = {};
mixer.ui.dom = {};
mixer.ui.hooks = {};


mixer.role = undefined;

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
			mixer.addSound(data.soundURL, data.soundVolume, true);
			break;
		case "volume":
			mixer.setVolume(data.soundIndex, data.soundVolume);
			break;
		case "remove":
			mixer.removeSound(mixer.sounds[data.soundIndex], true);
			break;
		case "addYoutube":
			mixer.addYoutube(data.videoID, data.soundVolume,true);
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
		for(let sound in mixer.sounds){
			console.log("Sending "+mixer.sounds[sound].url);
			mixer.sounds[sound].send(conn);
			//conn.send({command:"add", soundURL: mixer.sounds[sound].url});
		}
	});

	mixer.log("Client connected.");
};


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
	mixer.ui.updateID(mixer.peer.id);
};

mixer.ui.hideMain = function(){
	mixer.ui.dom.mixerBox.className = "panel hidden";
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

mixer.sounds = [];

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

mixer.setVolume = function(index, vol){
	//mixer.sounds[index].dom.sound.volume = vol;
	//mixer.sounds[index].dom.slider.value = vol * 100;
	mixer.sounds[index].dom.slider.value = vol;
	mixer.sounds[index].setVolume(vol);
};

mixer.ui.hooks.setVolume = function(sound){
	if(mixer.role == "host"){
			mixer.sendData({command:"volume",soundIndex: mixer.sounds.indexOf(sound),soundVolume:sound.dom.slider.value});
	}
	//sound.dom.sound.volume = sound.dom.slider.value / 100;
	sound.setVolume(sound.dom.slider.value);
};


var youtubeOnReady = function(event, sound, volume){
	event.target.playVideo();
	sound.setVolume(volume);
};

var youtubeOnStateChange = function(event){
	if(event.data === YT.PlayerState.ENDED){
		event.target.playVideo();
		
	}
};

mixer.addYoutube = function(id, volume, hostCommand){
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
			mixer.sendData({command:"addYoutube", soundVolume: volume, videoID:id});
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
			'onReady': function(event){youtubeOnReady(event, sound, volume);},
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
		sound.youtube.setVolume(vol);
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
		conn.send({command:"addYoutube", videoID: sound.id, soundVolume: sound.youtube.getVolume()});
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

mixer.addSound = function(url, volume, hostCommand){
	if(hostCommand == undefined){hostCommand = false;};
	if(!hostCommand){
		if(mixer.role == "client"){
			return;
		}
		if(mixer.role == "host"){
			mixer.sendData({command:"add", soundVolume: volume, soundURL:url});
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
	
	sound.setVolume = function(vol){
		sound.dom.sound.volume = vol/100;
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
		conn.send({command:"add", soundURL: sound.url, soundVolume: sound.dom.sound.volume*100});
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
