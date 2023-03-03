function LocationInfo(url) {
	this.manager = THREE.DefaultLoadingManager;
	var loader = new THREE.XHRLoader( this.manager );
	var gThis = this;
	this.images = {};
	// var species = [];
	loader.load( url, function ( text ) {
		gThis.data = JSON.parse( text );
		// console.log("HERE IS THE JSON:" + JSON.stringify(JSON.parse(text)));
		console.log("Total elements in JSON: " + gThis.data.length);
		var astoriaCount = 0;
		var chCount = 0;
		var chlCount = 0;
		var fgCount = 0;
		var imageCounter = 1;
		for (var i = 0; i < gThis.data.length; i++) {
			var d = gThis.data[i];
			if (!gThis.images.hasOwnProperty(d.species)) {
				gThis.images[d.species] = "oscillator" + imageCounter + ".png";
				imageCounter++;
			}
			if (d.location == 'Astoria') {
				astoriaCount++;
			} else if (d.location == 'CrowneHeights') {
				chCount++;
			} else if (d.location == 'CrowneHeightsLangstroth') {
				chlCount++;
			} else if (d.location == 'ForteGreen') {
				fgCount++;
			}
		}
		console.log("Counts: " + astoriaCount + ":" + chCount + ":" + chlCount + ":" + fgCount);
	});
}

LocationInfo.prototype.getData = function() {
	return this.data;
}

LocationInfo.prototype.getImages = function() {
	return this.images;
}

LocationInfo.prototype.count = function(loc, mint1, maxt1, mint2, maxt2, mint3, maxt3) {
	var ret = {bucket1: [], bucket2: [], bucket3: []};
	console.log("Counting location: " + loc);
	if (this.data !== undefined) {
		for (var i = 0; i < this.data.length; i++) {
			var d = this.data[i];
			if (d.location == loc || loc == 'All') {
				var obj = {
					species: d.species,
					percentage: d.percentage,
				}
				if (mint1 <= d.temp && d.temp < maxt1) {
					ret.bucket1.push(obj);
				} else if (mint2 <= d.temp && d.temp < maxt2) {
					ret.bucket2.push(obj);
				} else if (mint3 <= d.temp && d.temp < maxt3) {
					ret.bucket3.push(obj);
				}
			}
		}
	}
	return ret;
}