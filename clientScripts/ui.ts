
var ui : any = {};
ui.dom = {};
ui.hooks = {};

ui.errorReconnect = false;

const backgroundLast = 3; //last background image (highest number .png)

ui.backIndex = Math.floor(Math.random() * backgroundLast) + 1;


ui.dom.idBox = document.getElementById("idBox");
ui.dom.connectBox = document.getElementById("connectBox");
ui.dom.loader = document.getElementById("loader");
ui.dom.errorBox = document.getElementById("errorBox");
ui.dom.errorContent = document.getElementById("errorContent");
ui.dom.mixerBox = document.getElementById("mixerBox");
ui.dom.soundCont = document.getElementById("soundCont");
ui.dom.soundURL = document.getElementById("soundURL");
ui.dom.youtubeID = document.getElementById("youtubeID");
ui.dom.joinID = document.getElementById("joinID");
ui.dom.mixerAddSlider = document.getElementById("mixerAddSlider");
ui.dom.joinLink = document.getElementById("joinLink");
ui.dom.autoConnectBox = document.getElementById("autoConnectBox");
ui.dom.errorCont = document.getElementById("errorCont");
ui.dom.back = document.getElementById("back");
ui.dom.hostOnly = document.getElementsByClassName("hostOnly");
ui.dom.masterSlider = document.getElementById("masterSlider");
ui.dom.jukebox = document.getElementById("jukebox");
ui.dom.jukeContent = document.getElementById("jukeContent");
ui.dom.musicVolume = document.getElementById("musicVolume");
ui.dom.jukeYoutubeID = document.getElementById("jukeYoutubeID");
ui.dom.notificationBar = document.getElementById("notificationBar");
ui.dom.jukePlayer = document.getElementById("jukePlayer");

ui.dom.back.style.backgroundImage = "url('backgrounds/"+ui.backIndex+".png')";

ui.hideConnectBox = function(){
	ui.dom.connectBox.className = "popup panel hidden";
};

ui.showConnectBox = function(){
	ui.dom.connectBox.className = "popup panel";
};

ui.showLoader = function(){
	ui.dom.loader.className = "popup panel";
};

ui.hideLoader = function(){
	ui.dom.loader.className = "popup panel hidden";
};

ui.showConnectConfirm = function(){
	ui.dom.autoConnectBox.className = "popup panel";
}

ui.hideConnectConfirm = function(){
	ui.dom.autoConnectBox.className = "popup panel hidden";
}

ui.showError = function(err, disconnect){
	if(disconnect==true){
		ui.errorReconnect = true;
		ui.hideMain();
	}
	ui.dom.errorCont.className = "";
	//ui.dom.errorBox.className = "popup panel";
	ui.dom.errorContent.innerHTML = "";
	ui.dom.errorContent.appendChild(document.createTextNode(err));
};

ui.hideError = function(){
    ui.dom.errorCont.className = "fadeOut";
	//ui.dom.errorBox.className = "popup panel hidden";
};

ui.showMain = function(peerID,hostID,role,siteUrl){
	ui.dom.mixerBox.className = "panel";
	ui.dom.jukebox.className = "panel";
	ui.updateID(peerID,hostID,role,siteUrl);
};

ui.hideMain = function(){
	ui.dom.mixerBox.className = "panel hidden";
	ui.dom.jukebox.className = "panel hidden";
};

ui.updateID = function(id,hostID,role,siteUrl){
	ui.dom.idBox.innerHTML = "";
	ui.dom.idBox.appendChild(document.createTextNode(id));
	
	ui.dom.joinLink.innerHTML = "";
	if(role == "host"){
		ui.dom.joinLink.appendChild(document.createTextNode(siteUrl+"?join="+id));
	}
	if(role=="client"){
		ui.dom.joinLink.appendChild(document.createTextNode(siteUrl+"?join="+hostID));
	}
};

ui.jukeUpdatePlaying = function(playingID){
	let track = (playingID==undefined)?undefined:document.getElementById("jukeTrack"+playingID);
	let playing = document.getElementsByClassName("playing");
	for(let ch of playing){
		ch.className = "jukeTrack";
	}
	if(track != undefined){
		track.className = "jukeTrack playing";
	}
};

ui.createJukeTrack = function(videoID, role){
	let dom : any = {};
	dom.channel = document.createElement("div");
	dom.channel.className = "jukeTrack";
	dom.channel.id = "jukeTrack"+videoID;
	dom.del = document.createElement("button");
	dom.del.className = "jukeDelete";
	if(role == "client"){
		dom.del.className += " hidden";
	}
	dom.label = document.createElement("div");
	dom.label.className = "jukeLabel noSelect";
	dom.label.addEventListener('contextmenu', function(event){
		dom.label.contentEditable = "true";
		dom.label.focus();
		dom.label.className = "jukeLabel";
		event.preventDefault();
	});
	dom.label.addEventListener('focusout', function(event){
		dom.label.contentEditable = "false";
		dom.label.className = "jukeLabel noSelect";
	});
	dom.label.appendChild(document.createTextNode(videoID));
	dom.channel.appendChild(dom.del);
	dom.channel.appendChild(dom.label);
	return dom;
};

ui.createChannelYoutube = function(role,id,events){
	let dom : any = {};
	dom.sound = document.createElement("div");
	dom.sound.id = "mixerTrack"+id;
	
	ui.dom.soundCont.appendChild(dom.sound);
	
	dom.youtube = new (window as any).YT.Player(dom.sound.id,{
		height: '390',
		width: '640',
		events: events
	});
	
	dom.channel = document.createElement("div");
	dom.channel.className = "mixerChannel hidden";
	
	dom.slider = document.createElement("input");
	dom.slider.className = "mixerSlider";
	dom.slider.type = "range";
	dom.slider.setAttribute("orient", "vertical");
	dom.slider.min = 0;
	dom.slider.max = 100;
	dom.slider.value = 70;//volume;
	
	if(role == "host"){
		dom.del = document.createElement("button");
		dom.del.className = "mixerDelete";
		dom.channel.appendChild(dom.del);
	}
	
	dom.label = document.createElement("div");
	dom.label.className = "mixerLabel";
	
	dom.label.appendChild(document.createTextNode("Track "+id));
	dom.label.contentEditable = "true";
	
	dom.channel.appendChild(dom.slider);
	
	dom.channel.appendChild(dom.label);
	
	
	
	ui.dom.mixerBox.appendChild(dom.channel);
	return dom;
};

export default ui;