import { Peer } from "peerjs";
import libui, {dom} from "./ui.js";
import createBind from "./bind.js";


export default class mixer {
    ui = libui;
    bind = createBind();
    siteUrl = "https://mixer.haicat.moe/";
    maxTracks = 6;
    // number of seconds the syncing can be off by, below which it wont correct
    syncTolerance = 3;
    peer = new Peer(undefined, {
		host: location.hostname,
		port: 443,
		path: "/api/peer",
		secure: true
	});

    connection = undefined;
	role = undefined;

	masterVol = 0.7;
	musicVol = 0.7;

    autoConnectId = null;
    hostID = null;

	sounds = [];

	juke = {
        listString: "",
        music: [],
        resumeTrack: null,
        player: null
    };

    constructor(){

        this.peer.on("open", ()=>this.onServerConnect());
        dom.masterSlider.addEventListener("input", ()=>this.hookSetMasterVol());
        dom.musicVolume.addEventListener("input", ()=>this.hookSetMusicVol());
        this.bind("musicList",(v)=>{
            this.juke.listString = v??"";
            dom.jukeContent.innerHTML = "";
            let ids = this.juke.listString.split("|");
            for(let id of ids){
                //why yes i am aware of how inefficient and stupid this is
                //but im lazy and want to do this with binding rather than
                //the messiness of making more host commands
                //doing it this way means i have to write less code
                if(id==""){continue;};
                this.jukeAddTrack(id, true);
            }
            this.ui.jukeUpdatePlaying(this.bind.get("musicID"));
        });

        this.hookSetMasterVol();
        this.hookSetMusicVol();

        var url = new URL(window.location.href);
		var joinId = url.searchParams.get("join");
		if(joinId != null){
			this.ui.hideConnectBox();
			this.autoConnectId = joinId;
			this.ui.showConnectConfirm();
			/*
			mixer.ui.showLoader();
			mixer.ui.hideConnectBox();
			mixer.connect(joinId);
			*/
		}
    }

    onHostBind(key, value){
        this.sendData({command:"set", key: key, value: value});
    };
    onServerConnect(){
		this.notify("Connected to the signaling server.", true);
	};
    onServerDisconnect(){
		let notif = this.notifyImportant("Disconnected from the signaling server. Click here to reconnect.",false);
		notif.onclick = ()=>{
			this.peer.reconnect();
			notif.clearNotification();
			notif.onclick = undefined;
		}
	};
    onClientError(err){
		this.ui.hideLoader();
		if((err.type == "invalid-id") || (err.type == "peer-unavailable")){
			this.ui.showError("Invalid host ID.", true);
			this.role = undefined;
		}else if(err.type == "disconnected"){
			this.ui.showError("Disconnected from the host.", true);
			this.role = undefined;
		}else{
			this.ui.showError("Unhandled error: "+err.type, true);
			this.role = undefined;
		}
	};
    onHostError(err){
		this.log(err);
	};
    onOpen(){
		this.log("Connected.");
		this.role = "client";
		for(let i = 0; i < this.maxTracks; i++){this.addTrack();};
		for(let i = 0; i < dom.hostOnly.length; i++){
			dom.hostOnly[i].setAttribute("class", "hostOnly hidden");
		}
		
		this.ui.hideLoader();
		this.ui.showMain(this.peer.id,this.hostID,this.role,this.siteUrl);
	};

    log(text){
		console.log(text);
		this.notify(text,true)
	};

    connect(id){
		if(id.trim() == ""){
			this.ui.hideLoader();
			this.ui.showError("Host ID must not be blank.", true);
			return;
		}
		this.peer.on("error", (e)=>this.onClientError(e));
		this.connection = this.peer.connect(id);
		this.connection.on("data",  (d)     =>this.onClientData(d));
		this.connection.on("open",  ()      =>this.onOpen());
		this.connection.on("close", ()      =>this.notifyImportant("Host disconnected.",false));
		this.hostID = id;
	};

    host(){
		this.peer.on("error", (e)=>this.onHostError(e));
		this.peer.on("connection", (c)=>this.onConnection(c));
		this.peer.on("disconnected", ()=>this.onServerDisconnect());
		this.role = "host";
		for(let i = 0; i < this.maxTracks; i++){this.addTrack();};
		this.bind.bindGlobal((k,v)=>this.onHostBind(k,v));
		
		for(let i = 0; i < dom.hostOnly.length; i++){
			dom.hostOnly[i].setAttribute("class", "hostOnly");
		}
		
		this.ui.showMain(this.peer.id,this.hostID,this.role,this.siteUrl);
	};

    sendData(data){
		for(let conn in this.peer.connections){
			if(this.peer.connections[conn][0] == undefined){
				continue;
			}
			this.peer.connections[conn][0].send(data);
		}
	};

    onClientData(data){
		if(data.commend == "undefined"){return;};
		switch(data.command.trim()){
			case "set":
				this.bind.set(data.key, data.value);
				break;
			default:
				this.log("Unknown host command: "+data.command);
		}
	};

    onConnection(conn){
		conn.on("data", (data)=>{
			this.log(data);
		});
		conn.on("open", ()=>{
			for(let prop in this.bind.properties){
				conn.send({command:"set", key: prop, value: this.bind.get(prop)});
			}
		});
		
		conn.on("close", ()=>{
			this.log("Client disconnected.");
		});

		this.log("Client connected.");
	};

    notify(message, autoclear, onClear?){
		if(autoclear === undefined){autoclear = true;};
		let notification : any = document.createElement("div");
		notification.className = "notification";
		notification.appendChild(document.createTextNode(message));
		notification.clearNotification = ()=>{
			setTimeout(()=>{
				dom.notificationBar.removeChild(notification);
			},500);
			notification.className = "notification notifHide";
		}
		if(autoclear){
			setTimeout(()=>{
				if(onClear != undefined){
					onClear();
				}
				notification.clearNotification();
			},10000);
		}
		dom.notificationBar.appendChild(notification);
		return notification;
	};

    notifyImportant (message, autoclear, onClear?){
		if(autoclear === undefined){autoclear = true;};
		let notification : any = document.createElement("div");
		notification.className = "notification notifImportant";
		notification.appendChild(document.createTextNode(message));
		notification.clearNotification = ()=>{
			setTimeout(()=>{
				dom.notificationBar.removeChild(notification);
			},500);
			notification.className = "notification notifImportant notifHide";
		}
		if(autoclear){
			setTimeout(()=>{
				if(onClear != undefined){
					onClear();
				}
				notification.clearNotification();
			},10000);
		}
		dom.notificationBar.appendChild(notification);
		return notification;
	};

    playTrack(ytid, vol){
		for(let sound of this.sounds){
			if(!sound.visible){
				sound.load(ytid);
				sound.setVolume(vol);
				return;
			}
		}
		this.ui.showError("Max number of tracks reached.");
	};

    addTrack(){
		let sound : any = {};
		sound.id = (this.sounds.push(sound)-1);
		sound.ready = false;
		sound.visible = false;
		sound.dom = this.ui.createChannelYoutube(this.role, sound.id, {
			'onReady': (event)=>{
				sound.ready = true;
				this.bind(sound.key("volume"),(v)=>{sound.setVolume(v,true);});
				this.bind(sound.key("videoID"),(v)=>{sound.load(v,true);});
				this.bind(sound.key("time"),(v)=>{sound.seek(v,true);});
			},
			'onStateChange': (event)=>{
				if(event.data === (window as any).YT.PlayerState.ENDED){
					event.target.playVideo();
				}
			},
			'onError': ()=>{
				sound.dom.channel.className = "mixerChannel channelError";
			}
		});
		
		sound.key = (sub)=>{
			return "mixerTrack"+sound.id+sub;
		};
		
		//getters
		sound.getTime = ()=>{
			if(!sound.ready){
				return 0;
			}
			return sound.dom.youtube.getCurrentTime();
		}
		
		sound.getDuration = ()=>{
			if(!sound.ready){
				return 0;
			}
			return sound.dom.youtube.getDuration();
		}
		
		
		//setters
		sound.setVolume = (vol, suppressBind)=>{
			if(sound.ready){
				sound.dom.youtube.setVolume(vol * this.masterVol);
				if(sound.dom.youtube.isMuted()){
					sound.dom.youtube.unMute();
				}
			}
			
			if(suppressBind != true){
				this.bind.set(sound.key("volume"), vol);
			}
			sound.dom.slider.value = vol;
		}
		
		
		sound.seek = (time, suppressBind)=>{
			let diff = Math.abs(time - sound.getTime());
			if((diff > this.syncTolerance) && sound.ready){
				sound.dom.youtube.seekTo(time, true);
			}
			if(suppressBind != true){
				this.bind.set(sound.key("time"), time);
			}
		}
		
		
		sound.load = (videoID, suppressBind)=>{
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
				this.bind.set(sound.key("videoID"), videoID);
			}
		};
		
		sound.dom.slider.addEventListener("input", ()=>{
			this.bind.set(sound.key("volume"),sound.dom.slider.value);
			
		});
		if(this.role == "host"){
			sound.dom.del.addEventListener("click", ()=>{
				sound.load(null);
			});
		}
	};

    jukeAddTrack(videoID, suppressBind){
		let jdom = this.ui.createJukeTrack(videoID, this.role);
		let musicID = this.juke.music.push(videoID);
		
		jdom.del.addEventListener("click", ()=>{
			
			let ids = this.juke.listString.split("|");
			if(ids.length == 1){
				this.hookJukePause();
			}else{
				this.hookJukeSkip();
			}
			var index = ids.indexOf(videoID);
			if(index != -1){
				ids.splice(index, 1);
				this.bind.set("musicList",ids.join("|"));
			}
			
		});
		
		jdom.channel.ondblclick = ()=>{
			if(this.role=="client"){return;};
			this.bind.set("musicID",videoID);
		}
		
		dom.jukeContent.appendChild(jdom.channel);
		if(!suppressBind){
			this.bind.set("musicList",this.bind.get("musicList")+"|"+videoID);
		}
	};

    //from https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url
    parseYoutube(url){
		var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
		var match = url.match(regExp);
		return (match&&match[7].length==11)? match[7] : false;
	};



    hookSetMasterVol(){
		this.masterVol = Number.parseFloat(dom.masterSlider.value) / 100;
		for(let sound in this.sounds){
			this.sounds[sound].setVolume(this.sounds[sound].dom.slider.value);
		}
	};

    hookAcYes(){
		this.ui.hideConnectConfirm();
		this.ui.showLoader();
		this.ui.hideConnectBox();
		this.connect(this.autoConnectId);
	};

    hookAcNo(){
		this.ui.hideConnectConfirm();
		this.ui.showConnectBox();
	};

    hookErrorOK(){
		this.ui.hideError();
		if(this.ui.errorReconnect){
			this.ui.errorReconnect = false;
			this.ui.showConnectBox();
		}
	};

    hookConnect(){
		this.ui.showLoader();
		this.ui.hideConnectBox();
		this.connect(dom.joinID.value);
	};

    hookHost(){
		this.ui.hideConnectBox();
		this.host();
	};

    hookJukePlay(){
		let ids = (this.bind.get("musicList")??"").split("|");
		if(ids == ""){return;};
		
		let toPlay = ids[0];
		if(ids.indexOf(this.juke.resumeTrack) != -1){
			toPlay = this.juke.resumeTrack;
		}
		
		this.bind.set("musicID",toPlay);
	};

    hookJukePause(){
		this.bind.set("musicID",null);
	};

    hookJukeSkip(){
		let playingID = this.bind.get("musicID");
		
		if(playingID == null){
			playingID = this.juke.resumeTrack;
		};
		
		let ids = (this.bind.get("musicList")??"").split("|");
		if(ids == ""){return;};
		
		let index = ids.indexOf(playingID)+1;
		if(index < 0){index = 0;};
		if(index >= ids.length){index = 0;};
		
		this.bind.set("musicID",ids[index]);
	};

    hookSetMusicVol(){
		this.bind.set("musicVol", dom.musicVolume.value);
	};

    hookAddYoutube(){
		var ytid = this.parseYoutube(dom.youtubeID.value);
		if(ytid == false){
			this.ui.showError("Invalid YouTube Link", false);
			return;
		}
		this.playTrack(ytid, dom.mixerAddSlider.value);
		dom.youtubeID.value = "";
	};

    hookJukeAddYoutube(){
		let inputs = dom.jukeYoutubeID.value.trim().split("\n");
		if(inputs.length==0){
			return;
		}
		let err = false;
		let ids = this.bind.get("musicList")??"";
		for(let index in inputs){
			let line = inputs[index].trim();
			if(line == ""){
				continue;
			}
			var ytid = this.parseYoutube(line);
			if(ytid==false){
				err = true;
				continue;
			};
			if(ids.includes(ytid)){continue;};
			ids += ((ids=="")?"":"|")+ytid;
		}
		this.bind.set("musicList", ids);
		if(err == true){
			this.ui.showError("One or more lines contained an invalid YouTube link and was not added.", false);
			return;
		}
		dom.jukeYoutubeID.value = "";
	};

};