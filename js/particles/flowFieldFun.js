function FlowField(width, height, depth, margin, modx, mody, modz) {
	this.data = [];
	this.margin = margin;

	this.width = width;
	this.height = height;
	this.depth = depth;

	this.simplex = new SimplexNoise();

	this.gen(modx, mody, modz);
}

FlowField.prototype.gen = function(modx, mody, modz) {
	if (this.prevModz !== modz || 
		this.prevMody !== mody ||
		this.prevModx !== modx) {

		for (var x = 0; x < this.width; ++x) {
			this.data[x] = [];
			for (var y = 0; y < this.height; ++y) {
				this.data[x][y] = [];

				for (var z = 0; z < this.depth; ++z) {

					var n = this.simplex.noise3d(x * modx, y * mody, z * modz);

					//THIS IS THE SHAPE OF HOW PARTICLES MOVE *********
					this.data[x][y][z] = new THREE.Vector3(
						Math.cos(n * Math.PI * 2), 
						Math.sin(n * Math.PI * 2),
						Math.cos(n * Math.PI * 2) * (n / 2)
					);
				}
			}
		}

		this.prevModz = modz;
		this.prevMody = mody;
		this.prevModx = modx;
	}
};

FlowField.prototype.sample = function(x, y, z) {
	x = Math.round(x / this.margin);
	y = Math.round(y / this.margin);
	z = Math.round(z / this.margin);

	//return this.data[x] ? this.data[x][y] : undefined; //? is a shorthand for if statement
	return this.data[x] ? (this.data[x][y] ? this.data[x][y][z] : undefined) : undefined;
};