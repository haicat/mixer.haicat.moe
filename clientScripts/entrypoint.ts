
//mixer.bind = (await import("./bind.js")).default;


import * as YTLoader from "youtube-iframe";
import libmixer from "./mixer.js";
import { dom } from "./ui.js";

const mixer = new libmixer();

YTLoader.load((YT)=>{
	(window as any).mixer = mixer;

	(window as any).YT = YT;
	(window as any).mixer = mixer;


	YT.ready(()=>{
	mixer.juke.player = new YT.Player(dom.jukePlayer.id,{
		height: '390',
		width: '640',
		events: {
			'onReady': function(event){
				
				mixer.bind("musicVol",(v)=>{
					mixer.musicVol = v;
					dom.musicVolume.value = v;
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
					mixer.hookJukeSkip();
				}
				
			},
			'onError': function(){
				//sound.dom.channel.className = "mixerChannel channelError";
			}
		}
	});
	});
});