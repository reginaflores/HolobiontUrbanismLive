function Particles(params) {
	this.flowField = params.flowField;

	var geometry = new THREE.BufferGeometry();
	
	this.vertices = new Float32Array(params.particleCount * 3);
	this.velocities = [];


	this.alphas = new Float32Array(params.particleCount); // [ 0.2, 0.2144, 0.0, ... ]
	this.textureIdxs = new Float32Array(params.particleCount);

	for (i = 0; i < params.particleCount; ++i) {
		var vertex = new THREE.Vector3(
			Math.random() * params.scaleX,
			Math.random() * params.scaleY,
			0
		);

		var velocity = new THREE.Vector3(
			0, // Math.random() - 0.5, //Math.random() gives you a number betn 0 and 1
			0, // Math.random() - 0.5, //slow = divide by 10000
			0
		);

		this.vertices[i * 3]     = vertex.x;
		this.vertices[i * 3 + 1] = vertex.y;
		this.vertices[i * 3 + 2] = vertex.z;

		this.velocities.push(velocity);

		this.alphas[i] = 0;
		this.textureIdxs[i] = 0;
	}

	geometry.addAttribute('position', new THREE.BufferAttribute(this.vertices, 3));
	geometry.addAttribute('alpha', new THREE.BufferAttribute(this.alphas, 1));
	geometry.addAttribute('textureIdx', new THREE.BufferAttribute(this.textureIdxs, 1));


	this.textures = params.textureArray;

	var material = new THREE.ShaderMaterial({
		uniforms: { 
			pointSize: { type: 'f', value: 1.0 },
			color: { type: 'v3', value: params.color },
			textures: { type: 'tv', value: this.textures }
		},
		vertexShader: params.vertexShader,
		fragmentShader: params.fragmentShader,
		depthTest: false,
	 	transparent: true
	});

	this.countInfo = null;
	this.assignedTextureIndex = new Array(params.particleCount);
	for (var i = 0; i < params.particleCount; ++i) {
		this.assignedTextureIndex[i] = 0;
	}

	this.mesh = new THREE.Points(geometry, material);

	// console.log(this.mesh);

	params.scene.add(this.mesh);
}

Particles.prototype.count = function() {
	return this.velocities.length;
}

Particles.prototype.remove = function(scene) {
	scene.remove(this.mesh);
}

function findNearestFlowPoint(pos, flowData) {
	var nearestFlowPoint = flowData.reduce(function(memo, opticalFlowPoint) {
		var dist = pos.distanceTo(opticalFlowPoint);

		if ( dist < memo.currentDistance ) {
			return {
				point: opticalFlowPoint,
				currentDistance: dist
			}
		}
		else {
			return memo;
		}
	}, { currentDistance: Infinity, point: flowData[0] });

	return nearestFlowPoint;
}

// function randn() {
//     return ((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) - 3) / 3;
// }

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function range(N) {
	var a = new Array(N);
	for (var i = 0; i < N; ++i) {
		a[i] = i;
	}
	return a;
}

function shuffledRange(N) {
	var a = range(N);
	return shuffleArray(a);
}

Particles.prototype.getTextureIndex = function() {
	return this.assignedTextureIndex;
}

// update scaleX/scaleY as a parameter from UI
Particles.prototype.update = function(params) {
	this.mesh.position.set(-params.scaleX / 2, -params.scaleY / 2, 0.0);
	
	/////
	//Species A = 15%, temp = 10C
	//Species B = 35%, temp = 12C

	// 15,35
	// 0.3, 0.7
	// 0.3, 1.0
	// n = 10000
	// i = 0..10000
	// i/n (1500/10000 = 0.15 < 0.3)
	// up to 3000, assign 1.png
	// 7000 to 10000, assign 2.png

	//97 images. 
	//GPU can only take 16. 
	//So only works when you have <= 16 species in a location by bucket, so total 32. 
	//////

	// convert bucket percentages to an array of percentages
	// var assignedTextureIndex = null;
	if (params.countInfo && this.countInfo != params.countInfo) {
		// console.log("Updating from new countInfo!");
		var amounts = [];
		var totalAmount = 0;
		for (var i = 0; i < params.countInfo.length; ++i) {
			var a = params.countInfo[i].percentage;
			amounts.push(a);
			totalAmount += a;
		}
		for (var i = 0; i < params.countInfo.length; ++i) {
			amounts[i] /= totalAmount;
		}
		var numberOfParticles = Math.floor(this.vertices.length / 3);
		var cumulative = [];
		var prev = 0;
		for (var i = 0; i < amounts.length; ++i) {
			var a = amounts[i] + prev;
			cumulative.push(a);
			prev = a;
		}
		// assignedTextureIndex = new Array(numberOfParticles);
		var currentIndex = 0;
		var randomArray = shuffledRange(numberOfParticles);
		for (var i = 0; i < numberOfParticles; ++i) {
			if (i / numberOfParticles >= cumulative[currentIndex]) {
				currentIndex++;
			}
			var j = randomArray[i];
			this.assignedTextureIndex[j] = currentIndex % 16; //note 16 is GPU image limit
		}
		this.countInfo = params.countInfo;
	}

    for (var j = 0; j < this.vertices.length; j += 3) {
    	var i = j / 3;

    	var shouldCalculateAlpha = j > this.vertices.length * params.airParticle; //0.01; // change number of particles flying from the screen -> set as param later (0.05)
    	var shouldDie = Math.random() < params.airDeath; //0.001;
    	
    	var gx = this.vertices[j];
    	var gy = this.vertices[j + 1];
    	var gz = this.vertices[j + 2];

    	var v = this.velocities[i];
    	var a = this.alphas[i];

    	var f = this.flowField.sample(gx, gy, params.scaleX, params.scaleY);


    	if (f !== undefined && !shouldDie) {
    		// flowFieldProperty -> "value" | "away"
    		var flowVec = new THREE.Vector3(
    			f[params.flowFieldProperty].x, 
    			f[params.flowFieldProperty].y, 
    			0
    		);

    		var steer = flowVec
    			.sub(v);
    			//.multiplyScalar(params.speedDampener / 10);

    		// steer = steerModifier * (f - v) 
    		// var steer = v.clone()
	    	// 	.lerp(flowVec, params.steerModifier)
	    	// 	// .normalize()
	    	// 	.multiplyScalar(params.speedDampener / 10);
	    		
	    	v = v.addScaledVector(steer, params.velocityModifier);

	    	var speedMod = params.speedDampener / 10;

	    	gx += v.x * speedMod;
	    	gy += v.y * speedMod;
	    	gz += v.z * speedMod;

	    	// console.log(flowVec, [ gx, gy, gz ]);

	    	if (params.opacityCalculationEnabled) {
		    	// gets the distance that flow field grid has to nearest pink dot

	    		var checkPoint = f[params.checkPointName];
	    		var distance;

	    		if (checkPoint) {
	    			distance = new THREE.Vector2(gx / params.scaleX, gy / params.scaleY)
	    				.distanceTo(checkPoint);
	    		}
	    		else {
	    			distance = 1.0;
	    		}
	    		
		    	
		    	

		    	// calculate distance from particles current position (gx/gy) to nearest pink dot
		  		//var distance = findNearestFlowPoint(
				// 	new THREE.Vector2(gx / params.scaleX, gy / params.scaleY), 
				// 	params.flowData
				// ).currentDistance;

				// set final alpha value - we are only showing the particles that are "close" to the pink ones
				// this is the hack instead of using openCV - Lukas Kanade 

				if (distance > 1) {
					a = 0;
				}
				else if (params.flowFieldProperty == "away") {
					// TODO: check this later
					a = Math.min(1, Math.max(0, distance)) / params.distanceModifier;
				}
				else if (shouldCalculateAlpha) {
					var d = (1.0 - distance);
					var distCutoff = 0.05;
					a = distance < distCutoff ? d / params.distanceModifier : 0;
				}
				else {
					a = 1.0
				}
	    	}
	    	else {
	    		a = 1;
	    	}
	    	
    	}
    	else {
    		// particle went outside of flow-field -> reset to random position / velocity
    		gx = Math.random() * params.scaleX;
    		gy = Math.random() * params.scaleY;
    		gz = 0;

    		v.x = Math.random() - 0.5;
    		v.y = Math.random() - 0.5;
    		v.z = 0;

    		a = 0;
    	}

    	this.vertices[j] = gx;
    	this.vertices[j + 1] = gy;
    	this.vertices[j + 2] = gz;


    	this.mesh.geometry.attributes.position.array[j] = gx;
    	this.mesh.geometry.attributes.position.array[j + 1] = gy;
    	this.mesh.geometry.attributes.position.array[j + 2] = gz;


    	this.mesh.geometry.attributes.alpha.array[i] = a; // for sanity, not sure if needed
    	if (this.assignedTextureIndex != null) {
    		// console.log("Assigning new texture index");
    		this.mesh.geometry.attributes.textureIdx.array[i] = this.assignedTextureIndex[i];
    	} else {
    		this.mesh.geometry.attributes.textureIdx.array[i] = i % params.numberOfImages; // numberOfImages = 1 -> [ 1, 1, 1, 1 ]
    	}
    	// number -> 2 -> [1,2,1,2,1,2 ..],
    	// number ->3 -> [ 1, 2,3,1,2,3 ...]
    }

    // not sure about that
    // TODO: test this
    this.mesh.geometry.attributes.alpha.needsUpdate = true;
    this.mesh.geometry.attributes.position.needsUpdate = true;

    this.mesh.material.uniforms.pointSize.value = params.particleSize;

    // for (var  i = 0; i < this.textures.length; ++i) {
    // 	this.textures[i] = params.textureArray[i];
    // }
    
   // this.mesh.material.uniforms.textures.needsUpdate = true;
}
