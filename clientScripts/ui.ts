export const dom = {
	idBox: document.getElementById("idBox") as HTMLDivElement,
	connectBox: document.getElementById("connectBox") as HTMLDivElement,
	loader: document.getElementById("loader") as HTMLDivElement,
	errorBox: document.getElementById("errorBox") as HTMLDivElement,
	errorContent: document.getElementById("errorContent") as HTMLDivElement,
	mixerBox: document.getElementById("mixerBox") as HTMLDivElement,
	soundCont: document.getElementById("soundCont") as HTMLDivElement,
	//soundURL: document.getElementById("soundURL") ,
	youtubeID: document.getElementById("youtubeID") as HTMLInputElement,
	joinID: document.getElementById("joinID") as HTMLInputElement,
	mixerAddSlider: document.getElementById("mixerAddSlider") as HTMLInputElement,
	joinLink: document.getElementById("joinLink") as HTMLDivElement,
	autoConnectBox: document.getElementById("autoConnectBox") as HTMLDivElement,
	errorCont: document.getElementById("errorCont") as HTMLDivElement,
	back: document.getElementById("back") as HTMLDivElement,
	hostOnly: document.getElementsByClassName("hostOnly"),
	masterSlider: document.getElementById("masterSlider") as HTMLInputElement,
	jukebox: document.getElementById("jukebox") as HTMLDivElement,
	jukeContent: document.getElementById("jukeContent") as HTMLDivElement,
	musicVolume: document.getElementById("musicVolume") as HTMLInputElement,
	jukeYoutubeID: document.getElementById("jukeYoutubeID") as HTMLTextAreaElement,
	notificationBar: document.getElementById("notificationBar") as HTMLDivElement,
	jukePlayer: document.getElementById("jukePlayer") as HTMLDivElement
};

const backgroundLast = 3; //last background image (highest number .png)

const backIndex = Math.floor(Math.random() * backgroundLast) + 1;

dom.back.style.backgroundImage = "url('backgrounds/"+backIndex+".png')";

export default new class {
	errorReconnect = false;

	hideConnectBox(){
		dom.connectBox.className = "popup panel hidden";
	};

	showConnectBox(){
		dom.connectBox.className = "popup panel";
	};

	showLoader(){
		dom.loader.className = "popup panel";
	};

	hideLoader(){
		dom.loader.className = "popup panel hidden";
	};

	showConnectConfirm(){
		dom.autoConnectBox.className = "popup panel";
	};

	hideConnectConfirm(){
		dom.autoConnectBox.className = "popup panel hidden";
	};

	showError(err, disconnect = false){
		if(disconnect==true){
			this.errorReconnect = true;
			this.hideMain();
		}
		dom.errorCont.className = "";
		//ui.dom.errorBox.className = "popup panel";
		dom.errorContent.innerHTML = "";
		dom.errorContent.appendChild(document.createTextNode(err));
	};

	hideError(){
		dom.errorCont.className = "fadeOut";
		//ui.dom.errorBox.className = "popup panel hidden";
	};

	showMain(peerID,hostID,role,siteUrl){
		dom.mixerBox.className = "panel";
		dom.jukebox.className = "panel";
		this.updateID(peerID,hostID,role,siteUrl);
	};

	hideMain(){
		dom.mixerBox.className = "panel hidden";
		dom.jukebox.className = "panel hidden";
	};

	updateID(id,hostID,role,siteUrl){
		dom.idBox.innerHTML = "";
		dom.idBox.appendChild(document.createTextNode(id));
		
		dom.joinLink.innerHTML = "";
		if(role == "host"){
			dom.joinLink.appendChild(document.createTextNode(siteUrl+"?join="+id));
		}
		if(role=="client"){
			dom.joinLink.appendChild(document.createTextNode(siteUrl+"?join="+hostID));
		}
	};

	jukeUpdatePlaying(playingID){
		let track = (playingID==undefined)?undefined:document.getElementById("jukeTrack"+playingID);
		let playing = document.getElementsByClassName("playing");
		for(let ch of playing){
			ch.className = "jukeTrack";
		}
		if(track != undefined){
			track.className = "jukeTrack playing";
		}
	};

	createJukeTrack(videoID, role){
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

	createChannelYoutube(role,id,events){
		let ch : any = {};
		ch.sound = document.createElement("div");
		ch.sound.id = "mixerTrack"+id;
		
		dom.soundCont.appendChild(ch.sound);
		
		ch.youtube = new (window as any).YT.Player(ch.sound.id,{
			height: '390',
			width: '640',
			events: events
		});
		
		ch.channel = document.createElement("div");
		ch.channel.className = "mixerChannel hidden";
		
		ch.slider = document.createElement("input");
		ch.slider.className = "mixerSlider";
		ch.slider.type = "range";
		ch.slider.setAttribute("orient", "vertical");
		ch.slider.min = 0;
		ch.slider.max = 100;
		ch.slider.value = 70;//volume;
		
		if(role == "host"){
			ch.del = document.createElement("button");
			ch.del.className = "mixerDelete";
			ch.channel.appendChild(ch.del);
		}
		
		ch.label = document.createElement("div");
		ch.label.className = "mixerLabel";
		
		ch.label.appendChild(document.createTextNode("Track "+id));
		ch.label.contentEditable = "true";
		
		ch.channel.appendChild(ch.slider);
		
		ch.channel.appendChild(ch.label);
		
		
		
		dom.mixerBox.appendChild(ch.channel);
		return ch;
	};
}();



