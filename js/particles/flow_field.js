function FlowField(size, modx, mody, modxAway, modyAway) {
	this.data = [];
	this.size = size;

	this.simplex = new SimplexNoise();

	// TODO: add sliders -> modx/mody
	// this.gen(0.01, 0.02);

	this.gen(modx, mody, modxAway, modyAway);
}

FlowField.prototype.gen = function(modx, mody, modxAway, modyAway) {
	if (this.modx != modx || this.mody != mody || this.modxAway != modxAway || this.modyAway != modyAway ) {
		for (var x = 0; x < this.size; ++x) {
			this.data[x] = [];
			for (var y = 0; y < this.size; ++y) {
				var n = this.simplex.noise(x * modx, y * mody);
				var nAway = this.simplex.noise(x * modxAway, y * modyAway);

				this.data[x][y] = {
					noise: new THREE.Vector2(
						Math.cos(n * Math.PI * 2),
						Math.sin(n * Math.PI * 2)
					),
					noiseAway: new THREE.Vector2(
						Math.cos(nAway * Math.PI * 2),
						Math.sin(nAway * Math.PI * 2)
					),
					value1: new THREE.Vector2(0, 0),
					value2: new THREE.Vector2(0, 0),
					away: new THREE.Vector2(0,0)
				};
			}
		}

		this.modx = modx;
		this.mody = mody;
		this.modxAway = modxAway;
		this.modyAway = modyAway;
	}
};

FlowField.prototype.genFromFlow = function(flowData, lerpModifier1, lerpModifier2, flowScale, awayScale, awayNoiseLerpModifier) {
	if (flowData.length == 0) { return; }
	
	function findNearestFlowPoint(v, flowData) {
		var nearestFlowPoint = flowData.reduce(function(memo, opticalFlowPoint) {
			var dist = v.distanceTo(opticalFlowPoint);

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

	for (var x = 0; x < this.size; ++x) {
		for (var y = 0; y < this.size; ++y) {
			var checkPoint = new THREE.Vector2(
				x / this.size,
				y / this.size
			);

			this.data[x][y].checkPoint = checkPoint;


			// HOT

			var foundNearestPoint1 = findNearestFlowPoint(checkPoint, flowData[0]);

			var nearestFlowPoint1 = foundNearestPoint1.point;
			var nearestFlowPointDistance1 = foundNearestPoint1.currentDistance;

			if (nearestFlowPoint1) {

				this.data[x][y].value1 = this.data[x][y].value1.subVectors(nearestFlowPoint1, checkPoint)
					.normalize()
					.multiplyScalar(flowScale); // scale the flow field vector which impacts the particle speed

				this.data[x][y].distance1 = nearestFlowPointDistance1;
				this.data[x][y].value1.lerp(this.data[x][y].noise, lerpModifier1);
				this.data[x][y].nearestFlowPoint1 = nearestFlowPoint1;

			}


			// NOT SO HOT

			var foundNearestPoint2 = findNearestFlowPoint(checkPoint, flowData[1]);

			var nearestFlowPoint2 = foundNearestPoint2.point;
			var nearestFlowPointDistance2 = foundNearestPoint2.currentDistance;


			if (nearestFlowPoint2) {
				this.data[x][y].value2 = this.data[x][y].value2.subVectors(nearestFlowPoint2, checkPoint)
					.normalize()
					//.multiplyScalar(flowScale); // scale the flow field vector which impacts the particle speed

				this.data[x][y].distance2 = nearestFlowPointDistance2;
				this.data[x][y].value2.lerp(this.data[x][y].noise, lerpModifier2);
				this.data[x][y].nearestFlowPoint2 = nearestFlowPoint2;
			}



			// COLD

			var nearestAwayPoint = foundNearestPoint1.currentDistance < foundNearestPoint2.currentDistance 
				? foundNearestPoint1 : foundNearestPoint2;

			if (nearestAwayPoint.point) {
				this.data[x][y].away = this.data[x][y].away.subVectors(checkPoint, nearestAwayPoint.point)
					.normalize()
					.multiplyScalar(awayScale) // awayScale - possibly could be bigger than 1
					.lerp(this.data[x][y].noiseAway, awayNoiseLerpModifier); // how much noise we apply to the floor particles
				this.data[x][y].awayFlowPoint = nearestAwayPoint.point;
			}
		}
	}

};

// x -> -scaleX - +scaleX
// x / scaleX -> 0 - 1
// 0 - 0, 1 -> this.size

FlowField.prototype.sample = function(x, y, scaleX, scaleY) {
	var newX = x / scaleX * this.size;
	var newY = y / scaleY * this.size;

	x = Math.round(newX);
	y = Math.round(newY); 

	return this.data[x] ? (this.data[x][y] ? this.data[x][y] : undefined) : undefined; //? is a shorthand for if statement
};