"use strict"; //ES6

/*

	event handled:
		[sfx]:"play":{file:"audio/file.mp3"}

	events sent:

*/

//TODO:  make sure switching to ES6 class syntax didnt break audioManager

class AudioManager {
  constructor( ) {
		console.log("AudioManager created");

		Service.Add("audio", this);

		EventBus.sfx.addListener("play", AudioManager.onSfxPlay.bind(this));
	}
	static onSfxPlay(evt) {
		if(!this.g_sfx) this.g_sfx = {};
		
		var file = evt.file;
		if( !this.g_sfx[ file ] ) {
			this.g_sfx[ file ] = new Audio(file);
		}

		var audio = this.g_sfx[ evt.file ];
		if(!audio.ended) {
			console.log("cutting sfx short " + file);
		}
		audio.play();
	}

}
