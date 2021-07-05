class AssetLoader {
    constructor(asset, callback) {
        this.callback = callback;
        this.isDone = false;

        this.imgs = asset['imgs'] || {};
        this.sounds = asset['sounds'] || {};
        this.jsons = asset['jsons'] || {};

        this.assetsLoaded = 0;
        this.numImgs = Object.keys(this.imgs).length;
        this.numSounds = Object.keys(this.sounds).length;
        this.numjsons = Object.keys(this.jsons).length;
        this.totalAsset = this.numImgs + this.numSounds + this.numjsons;

        console.log(`numImgs:${this.numImgs}`, `numSounds:${this.numSounds}`, `numjsons:${this.numjsons}`);
        // console.log()
        if (this.totalAsset != 0) {
            this.run();
        } else {
            this.loaded(null);
        }
    }
    run() {
        var self = this;
        var src = '';
        for (let img in this.imgs) {
            src = this.imgs[img];
            var _img = new Image();
            _img.onload = (e) => self.loaded(e, img);
            _img.onerror = (e) => console.log('load error:', e.srcElement);
            _img.src = src;

            // document.body.appendChild(_img);
            this.imgs[img] = _img;
        }

        for (let sound in this.sounds) {
            src = this.sounds[sound];
            var _sound = new Audio();
            _sound.oncanplay = (e) => self.loaded(e, sound);
            _sound.onerror = (e) => console.log('load error:', e.srcElement);
            _sound.src = src;
            this.sounds[sound] = _sound;
        }

        for (let json in this.jsons) {
            src = this.jsons[json];
            loadJSON(src, function (e, xobj) {
                self.jsons[json] = JSON.parse(xobj);
                self.loaded(e, json);
            });
        }
    }
    loaded(e, obj) {
        if (this.totalAsset != 0)
            this.assetsLoaded++;

        if (this.callback) {
            this.callback(e, obj, this.assetsLoaded, this.totalAsset);
            return;
        }

        console.log(this.assetsLoaded, this.totalAsset);
        if (this.assetsLoaded == this.totalAsset) {
            this.completeLoad();
        }
    }
    completeLoad() {
        console.log("GOOD OK");
    }
}
function getJSON(src) {
    loadJSON(src, function (xobj) {
        console.log(JSON.parse(xobj));
    });
}
function loadJSON(src, callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', src, true);
    xobj.onreadystatechange = function (e) {
        if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(e, xobj.responseText);
        }
    };
    xobj.send(null);
}