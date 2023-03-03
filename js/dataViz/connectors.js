function randomVector3(tension) {
	return new THREE.Vector3(Math.random()*tension, Math.random()*tension, Math.random()*tension);
}

function Connectors(spheres, sphereObjects, scene, tension) {
	this.tension = tension;
	this.curves = [];
	this.curveObjects = [];

	var keys = ["astoria", "crownHeightsT", "crownHeightsL", "fortGreene"];

	// console.log("Spheres input:" + JSON.stringify(spheres));

	var k = -1;
	for (var i = 0; i < keys.length; ++i) {
		for (var j = i+1; j < keys.length; ++j) {

			// var v1 = new THREE.Vector3(Math.random()*window.innerWidth, Math.random()*window.innerHeight, Math.random()*200);
			// var v2 = new THREE.Vector3(Math.random()*window.innerWidth, Math.random()*window.innerHeight, Math.random()*200);
			var v1 = randomVector3(tension);
			var v2 = randomVector3(tension);
			this.curves.push([]);
			this.curveObjects.push([]);
			k++;

			for (var ii = 0; ii < spheres[keys[i]].length; ++ii) {
				for (var jj = 0; jj < spheres[keys[j]].length; ++jj) {
					var p1 = spheres[keys[i]][ii];
					var p2 = spheres[keys[j]][jj];

					if (p1.species == p2.species) {

						var curve = new THREE.CubicBezierCurve3(
							p1.location,
							// new THREE.Vector3(Math.random()*100, Math.random()*100, Math.random()*100),
							// new THREE.Vector3(Math.random()*100, Math.random()*100, Math.random()*100),
							v1, v2,
							p2.location
						);
						this.curves[k].push(curve);

						var geometry = new THREE.Geometry();
						geometry.vertices = curve.getPoints( 50 );

						var material = new THREE.LineBasicMaterial( { 
							color : 0x999999, 
							opacity: 0.1,
							linewidth: 0.05,
							// blending: THREE.AdditiveBlending, 
							// transparent: true
						} );
						material.opacity = 0.5;
						material.transparent = true;

						// Create the final Object3d to add to the scene
						var curveObject = new THREE.Line( geometry, material );
						this.curveObjects[k].push(curveObject);

						scene.add(curveObject);

						// Connect the spheres to the lines and vice versa
						var s1 = sphereObjects[keys[i]][ii];
						var s2 = sphereObjects[keys[j]][jj];
						s1.userData.connections.push(curveObject);
						s2.userData.connections.push(curveObject);
						curveObject.userData.connections = [s1, s2];

						if (s1.userData.connections.length > 3) {
							console.log("FOUND > 3 CONNECTIONS");
							console.log("Species:" + s1.userData.species);
							console.log("key1:" + keys[i]);
							console.log("key2:" + keys[j]);
						}
						if (s2.userData.connections.length > 3) {
							console.log("FOUND > 3 CONNECTIONS");
							console.log("Species:" + s2.userData.species);
							console.log("key1:" + keys[i]);
							console.log("key2:" + keys[j]);
						}

						break;
					}
				}
			}
		}
	}
}

Connectors.prototype.update = function(tension) {
	if (this.tension != tension) {
		this.tension = tension;
		console.log("connectors.update");

		// redraw connectors
		for (var k = 0; k < this.curves.length; ++k) {
			var v1 = randomVector3(tension);
			var v2 = randomVector3(tension);
			for (var i = 0; i < this.curves[k].length; ++i) {
				// this.curves[i].v1 = randomVector3(tension);
				// this.curves[i].v2 = randomVector3(tension);
				var co = this.curveObjects[k][i].geometry;
				var v0 = this.curves[k][i].v0;
				var v3 = this.curves[k][i].v3;

				var curve = new THREE.CubicBezierCurve3(v0, v1, v2, v3);
				co.vertices = curve.getPoints( 50 );
				co.verticesNeedUpdate = true;
			}
		}
	}
}

