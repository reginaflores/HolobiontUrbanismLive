// References: https://aerotwist.com/tutorials/getting-started-with-three-js/
// 			   http://threejs.org/docs/#Reference/Materials/MeshBasicMaterial

function Spheres(url, scene, tension, separation) {
	//Loading JSON Data
	var spacing = 200;
	var manager = THREE.DefaultLoadingManager;
	var loader = new THREE.XHRLoader( manager );
	var gThis = this;
	var astoriaCenter = new THREE.Vector3(-spacing, 0, 0);
	console.log("astoria center:" + astoriaCenter);
	var fortGreeneCenter = new THREE.Vector3(spacing, spacing, 0);
	var crownHeightsTBCenter = new THREE.Vector3(spacing, -spacing, 0);
	var crownHeightsLCenter = new THREE.Vector3(0, spacing, spacing);

    var dev = 60;//data ball separator
    this.positions = {
    	astoria: [],
    	crownHeightsT: [],
    	crownHeightsL: [],
    	fortGreene: [],
    };
    this.sphereMap = {
    	astoria: [],
    	crownHeightsT: [],
    	crownHeightsL: [],
    	fortGreene: [],
    };
	loader.load(url, function ( text ) {
		gThis.data = JSON.parse( text );
		// console.log("HERE IS THE JSON:" + JSON.stringify(JSON.parse(text)));
		console.log("Total elements in JSON: " + gThis.data.length);
		gThis.spheres = [];

		var uniqueSpecies = [];
		var speciesCount = {};
		for (var i = 0; i < gThis.data.length; ++i) {
			var j = gThis.data[i];
			if (!speciesCount.hasOwnProperty(j.species)) {
				speciesCount[j.species] = 1;
			} else {
				speciesCount[j.species] += 1;
			}
		}
		for (var species in speciesCount) {
			if (speciesCount[species] == 1) {
				uniqueSpecies.push(species);
			}
		}

		gThis.objects = [];
		gThis.species = [];
		for (var i = 0; i < gThis.data.length; ++i) {
			// create a new mesh with
			// sphere geometry - we will cover
			// the sphereMaterial next!
			var j = gThis.data[i];
			var radius = Math.log(j.percentage * 5 + 1)*1;
			var material = null;
			if (containsObject(j.species, uniqueSpecies)) {
				material = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
			} else {
				material = new THREE.MeshBasicMaterial({ 
					// color: 0xFFFFFF, 
					opacity: 0.8,
					transparent: false,
					blending: THREE.AdditiveBlending,
					map: THREE.ImageUtils.loadTexture('../../assets/dataViz/trans2.png'),
					depthTest: false

				});
			}


			var sphere = new THREE.Mesh( new THREE.SphereGeometry(radius, 32, 32), material);
			sphere.userData = {
				species: j.species,
				connections: [],
			};
			gThis.objects.push(sphere);
			gThis.species.push(j.species);

			// sphere.position = new THREE.Vector3( 20, 20, 0 );
			// console.log(sphere.position);
			if (j.location == "ASTORIA HIVE") {
				sphere.position.x = astoriaCenter.x + randn()*dev; //TO DO: CHANGE THIS TO GAUSSIAN DIST RAND
				sphere.position.y = astoriaCenter.y + randn()*dev;
				sphere.position.z = astoriaCenter.z + randn()*dev;
				gThis.positions.astoria.push({
					species: j.species,
					location: sphere.position,
				});
				gThis.sphereMap.astoria.push(sphere);
			} else if (j.location == "CROWN HEIGHTS -TOP BAR") {
				sphere.position.x = crownHeightsTBCenter.x + randn()*dev;
				sphere.position.y = crownHeightsTBCenter.y + randn()*dev;
				sphere.position.z = crownHeightsTBCenter.z + randn()*dev;
				gThis.positions.crownHeightsT.push({
					species: j.species,
					location: sphere.position,
				});
				gThis.sphereMap.crownHeightsT.push(sphere);
			} else if (j.location == "CROWN HEIGHTS - LANGSTROTH") {
				sphere.position.x = crownHeightsLCenter.x + randn()*dev;
				sphere.position.y = crownHeightsLCenter.y + randn()*dev;
				sphere.position.z = crownHeightsLCenter.z + randn()*dev;
				gThis.positions.crownHeightsL.push({
					species: j.species,
					location: sphere.position,
				});
				gThis.sphereMap.crownHeightsL.push(sphere);
			} else if (j.location == "FORT GREENE") {
				sphere.position.x = fortGreeneCenter.x + randn()*dev;
				sphere.position.y = fortGreeneCenter.y + randn()*dev;
				sphere.position.z = fortGreeneCenter.z + randn()*dev;
				gThis.positions.fortGreene.push({
					species: j.species,
					location: sphere.position,
				});
				gThis.sphereMap.fortGreene.push(sphere);
			}
			scene.add(sphere);
		}
		gThis.connectors = new Connectors(gThis.positions, gThis.sphereMap, scene, tension);
	});
}

Spheres.prototype.getPositions = function() {
	return this.positions;
}

Spheres.prototype.getConnectors = function() {
	return this.connectors;
}


function containsObject(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
        if (list[i] === obj) {
            return true;
        }
    }

    return false;
}


function randn() {
	return ((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) - 3) / 3;
}