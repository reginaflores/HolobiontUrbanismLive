function Particles(scene, count, flowField) {
	this.flowField = flowField;

	var geometry = new THREE.Geometry();
	this.velocities = [];

	this.boxSize = 1000;

	for (i = 0; i < count; ++i) {
		var vertex = new THREE.Vector3(
			Math.random() * this.boxSize,
			Math.random() * this.boxSize,
			Math.random() * this.boxSize
		);

		var velocity = new THREE.Vector3(
			Math.random() - 0.5, //Math.random() gives you a number betn 0 and 1
			Math.random() - 0.5, //slow = divide by 10000
			Math.random() - 0.5  //fast = higher number
		);

		geometry.vertices.push(vertex);
		this.velocities.push(velocity);
	}


	var material = new THREE.PointsMaterial({ 
		size: 4,
		map: THREE.ImageUtils.loadTexture('assets/textures/trans.png'),
		// blending: THREE.AdditiveBlending,
		depthTest: false,
		transparent: true
	});

	this.mesh = new THREE.Points(geometry, material);
	this.mesh.position.set(-this.boxSize / 2, -this.boxSize / 2, 0)

	scene.add(this.mesh);
}

Particles.prototype.update = function(steerModifier, velocityModifier) {
    for (var i = 0; i < this.mesh.geometry.vertices.length; ++i) {
    	var g = this.mesh.geometry.vertices[i];
    	var v = this.velocities[i];

    	var f = this.flowField.sample(g.x, g.y, g.z);

    	

    	if (f !== undefined) {
    		var steer = v.clone().lerp(f, steerModifier).normalize();

	    	g.x += steer.x;
	    	g.y += steer.y;
	    	g.z += steer.z;

	    	v.lerp(steer, velocityModifier);
    	}
    	else {
    		g.x = Math.random() * this.boxSize ;
    		g.y = Math.random() * this.boxSize ;
    		g.z = Math.random() * this.boxSize ;
    		v.x = Math.random() - 0.5;
    		v.y = Math.random() - 0.5;
    		v.z = Math.random() - 0.5;
    	}
    }

    this.mesh.geometry.verticesNeedUpdate = true;

}
