"use strict"; //ES6
//#include js/framework/Service.js

class ResourceProvider {
	constructor() {
		
		this.eventBus = new EventBus("RP");
		
		this.images = {};
		this.numImagesLoading = 0;
		
		this.sprites = {};
		this.numSpritesLoading = 0;

		this.spriteBatches = {};
		this.numSpriteBatchesLoading = 0;
		
		this.jsonFiles = {};
		this.numJsonFilesLoading = 0;
		
		this.animations = {}
		this.fourPoleAnimations = {}
		this.numAnimationsQuickLoading = 0;

		this.dynamicRes = {};
		
		this.baseURL = "";
		this.verbose = false;
		this.eventBus.verbose = false;
		
		Service.Add("rp", this);
	}
	
	isLoading() {
		if( this.numImagesLoading > 0 ) return true;
		if( this.numSpritesLoading > 0 ) return true;
		if( this.numSpriteBatchesLoading > 0 ) return true;
		if( this.numJsonFilesLoading > 0 ) return true;
		if( this.numAnimationsQuickLoading > 0) return true;
		return false;
	}
	
	_didLoad(fileName, resource) {
		this.eventBus.dispatch({"evtName":fileName, "status":"loadComplete", "res":resource});
		this.eventBus.clearListeners(fileName);
	}
	
	/**
	 * Loads the image if it's not already loaded
	 * @return:Image
	 */
	getImage(fileName, fnOnLoad) {
		if(!this.images[fileName] || !this.images[fileName].isLoaded)
		{
			this.loadImage(fileName, fnOnLoad);
			return;
		}
		
		if(fnOnLoad) fnOnLoad({"evtName":fileName, "status":"loadComplete", "res":this.images[fileName]});
		
		return this.images[fileName];
	}
	loadImage(fileName, fnOnLoad) {
		var RP = this;
		if(this.images[fileName]) {
			if(this.images[fileName].isLoaded) {
				//already loaded
				if(fnOnLoad) fnOnLoad({"evtName":fileName, "status":"loadComplete", "res":this.images[fileName]});
			} else {
				//pending load
				if(fnOnLoad) RP.eventBus.addListener(fileName, fnOnLoad);
			}
			return;
		}
		
		if(this.verbose) console.log("load image " + fileName);
		
		var img = new Image();
		img.isLoaded = false;
		img.src = this.baseURL + fileName;
		
		this.images[fileName] = img;
		
		if(fnOnLoad) RP.eventBus.addListener(fileName, fnOnLoad);
		img.onload = function() {
			//console.log("image loaded: " + fileName);
			RP.images[fileName].isLoaded = true;
			RP.numImagesLoading--;
			RP._didLoad(fileName, RP.images[fileName]);
		}
		if(img.complete)
		{
			console.warn("image already complete, abort loading")
		}else {
			this.numImagesLoading++;
		}
	}
	
	/**
	 * Loads the sprite if its not already loaded
	 * @return:Sprite
	 */
	getSprite(fileName, fnOnLoad) {
		if(!this.sprites[fileName] || !this.sprites[fileName].isLoaded)
		{
			this.loadSprite(fileName, fnOnLoad);
			return;
		}
		
		if(fnOnLoad) fnOnLoad({"evtName":fileName, "status":"loadComplete", "res":this.sprites[fileName]});
		
		return this.sprites[fileName];
	}
	loadSprite(fileName, fnOnLoad) {
		var RP = this;
		if(this.sprites[fileName]) {
			if(this.sprites[fileName].isLoaded) {
				//already loaded
				if(fnOnLoad) fnOnLoad({"evtName":fileName, "status":"loadComplete", "res":this.sprites[fileName]});
			} else {
				//pending load
				if(fnOnLoad) RP.eventBus.addListener(fileName, fnOnLoad);
			}
			return;
		}
		
		if(this.verbose) console.log("load sprite " + fileName);
		
		var sprite = new Sprite(fileName);
		
		if(fnOnLoad) RP.eventBus.addListener(fileName, fnOnLoad);
		getJSON(this.baseURL + fileName, function(data) {
		 if(RP.verbose) console.log("sprite loaded: " + fileName);
		 RP.sprites[fileName]._load(data, function(){
			 RP.numSpritesLoading--;
			 RP._didLoad(fileName, RP.sprites[fileName]);
		 });
		});
		
		this.sprites[fileName] = sprite;
		this.numSpritesLoading++;
	}
	hasSprite(fileName) {
		return this.sprites[fileName] != undefined;
	}
	 
	getSpriteBatch(fileName, fnOnLoad) {
		if(!this.spriteBatches[fileName] || !this.spriteBatches[fileName].isLoaded)
		{
			this.loadSpriteBatch(fileName, fnOnLoad);
			return;
		}
		
		if(fnOnLoad) fnOnLoad({"evtName":fileName, "status":"loadComplete", "res":this.spriteBatches[fileName]});
		
		return this.spriteBatches[fileName];
	}
	loadSpriteBatch(fileName, fnOnLoad) {
		var RP = this;
		if(this.spriteBatches[fileName]) {
			if(this.spriteBatches[fileName].isLoaded) {
				//already loaded
				if(fnOnLoad) fnOnLoad({"evtName":fileName, "status":"loadComplete", "res":this.spriteBatches[fileName]});
			} else {
				//pending load
				if(fnOnLoad) RP.eventBus.addListener(fileName, fnOnLoad);
			}
			return;
		}

		if(this.verbose) console.log("load spriteBatch " + fileName);
		
		var spriteBatch = new SpriteBatch(fileName);
		
		if(fnOnLoad) RP.eventBus.addListener(fileName, fnOnLoad);
		getJSON(this.baseURL + fileName, function(data) {
			if(RP.verbose) console.log("spriteBatch loaded: " + fileName);
			RP.spriteBatches[fileName].LoadFromJson(data, function(){
				RP.numSpriteBatchesLoading--;
				RP._didLoad(fileName, RP.spriteBatches[fileName]);
			});
		});
		
		this.spriteBatches[fileName] = spriteBatch;
		this.numSpriteBatchesLoading++;
	}
	getAnimationQuickAttach(fileName, baseName, fnOnLoad) {
		var resName = fileName + ":" + baseName
		if(!this.animations[resName] || !this.animations[resName].isLoaded)
		{
			this.loadAnimationQuickAttach(fileName, baseName, fnOnLoad);
			return;
		}
		
		if(fnOnLoad) fnOnLoad({"evtName":resName, "status":"loadComplete", "res":this.animations[resName]});
		
		return this.animations[resName];
	}
	loadAnimationQuickAttach(fileName, baseName, fnOnLoad) {
		var resName = fileName + ":" + baseName
		var RP = this;
		if(this.animations[resName]) {
			if(this.animations[resName].isLoaded) {
				//already loaded
				if(fnOnLoad) fnOnLoad({"evtName":resName, "status":"loadComplete", "res":this.animations[resName]});
			} else {
				//pending load
				if(fnOnLoad) RP.eventBus.addListener(resName, fnOnLoad);
			}
			return;
		}

		if(this.verbose) console.log("load animation quickAttach " + fileName);

		var anim = new Animation()
		anim.isLoaded = false
		
		if(fnOnLoad) RP.eventBus.addListener(resName, fnOnLoad);
		getJSON(this.baseURL + fileName, function(data) {
			anim.LoadFromJson(data)
			anim.QuickAttach(baseName, ".sprite", function(){
				if(RP.verbose) console.log("animation quickAttach loaded: " + resName);
				anim.isLoaded = true
				RP.numAnimationsQuickLoading--
				RP._didLoad(resName, RP.animations[resName]);
			})
		})

		this.animations[resName] = anim
		this.numAnimationsQuickLoading++
	}

	getFourPoleAnimationQuickAttach(fileName, baseName, fnOnLoad) {
		var resName = fileName + ":" + baseName
		if(!this.fourPoleAnimations[resName] || !this.fourPoleAnimations[resName].isLoaded)
		{
			this.loadAnimationQuickAttach(fileName, baseName, fnOnLoad);
			return;
		}
		
		if(fnOnLoad) fnOnLoad({"evtName":resName, "status":"loadComplete", "res":this.fourPoleAnimations[resName]});
		
		return this.fourPoleAnimations[resName];
	}
	loadFourPoleAnimationQuickAttach(fileName, baseName, fnOnLoad) {
		var resName = fileName + ":" + baseName
		var RP = this;
		if(this.fourPoleAnimations[resName]) {
			if(this.fourPoleAnimations[resName].isLoaded) {
				//already loaded
				if(fnOnLoad) fnOnLoad({"evtName":resName, "status":"loadComplete", "res":this.fourPoleAnimations[resName]});
			} else {
				//pending load
				if(fnOnLoad) RP.eventBus.addListener(resName, fnOnLoad);
			}
			return;
		}

		if(this.verbose) console.log("load FourPole quickAttach " + fileName);

		var anim = new FourPoleAnimation()
		anim.isLoaded = false
		
		if(fnOnLoad) RP.eventBus.addListener(resName, fnOnLoad);
		getJSON(this.baseURL + fileName, function(data) {
			anim.LoadFromJson(data)
			anim.QuickAttach(baseName, ".sprite", function(){
				if(RP.verbose) console.log("FourPole quickAttach loaded: " + resName);
				anim.isLoaded = true
				RP.numAnimationsQuickLoading--
				RP._didLoad(resName, RP.fourPoleAnimations[resName]);
			})
		})

		this.fourPoleAnimations[resName] = anim
		this.numAnimationsQuickLoading++
	}

	getJson(fileName, fnOnLoad) {
		if(!this.jsonFiles[fileName] || !this.jsonFiles[fileName].isLoaded) 
		{
			this.loadJson(fileName, fnOnLoad);
			return;
		}

		if(fnOnLoad) fnOnLoad({"evtName":fileName, "status":"loadComplete", "res":this.jsonFiles[fileName].data});

		return this.jsonFiles[fileName].data;
	}
	loadJson(fileName, fnOnLoad) {
		var RP = this;
		if(this.jsonFiles[fileName]) {
			if(this.jsonFiles[fileName].isLoaded) {
				//already loaded
				if(fnOnLoad) fnOnLoad({"evtName":fileName, "status":"loadComplete", "res":this.jsonFiles[fileName].data});
			} else {
				//pending load
				if(fnOnLoad) RP.eventBus.addListener(fileName, fnOnLoad);
			}
			return;
		}
		
		if(this.verbose) console.log("load json: " + fileName);
				
		if(fnOnLoad) RP.eventBus.addListener(fileName, fnOnLoad);
		var self = this;
		getJSON(this.baseURL + fileName, function(data) {
		 if(self.verbose) console.log("json loaded: " + fileName);
		 RP.jsonFiles[fileName].data = data;
		 RP.jsonFiles[fileName].isLoaded = true;
		 RP.numJsonFilesLoading--;
		 RP._didLoad(fileName, RP.jsonFiles[fileName].data);
		});
		
		if(this.verbose) console.log("json being loaded: "+fileName);
		this.jsonFiles[fileName] = { file:fileName, data:null, isLoaded:false };
		this.numJsonFilesLoading++;
	}
	
	setResource(fileName, res) {
		if(this.dynamicRes.hasOwnProperty(fileName)) {
			console.warn("tried to set already existing resource " + fileName);
			return;
		}
		this.dynamicRes[fileName] = res;
	}
	getResource(fileName) {
		return this.dynamicRes[fileName];
	}
}
