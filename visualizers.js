window.visualizers = [];
function defineVisualizer(name, description, visualizerFunction) {
	visualizers.push({ name: name, description: description, visualizerFunction: visualizerFunction }); // wish i had ES6 :/
}

defineVisualizer('simpleBars', 'Simplest visualizer: just draws bars representing the exact frequency values.', function (plot, frequencies, width, height) {
	var barWidth = width / frequencies.length;
	for (var b = 0; b < frequencies.length; b++) {
		for (var x = b * barWidth; x < (b + 1) * barWidth - 1; x++) {
			for (var y = 0; y < frequencies[b] * height; y++) {
				plot(x, y, '#25aae1');
			}
		}
	}
});

defineVisualizer('pixelBars', 'Draws bars split up into pixel squares, making it a more discrete spectrum rather than continuous.', function (plot, frequencies, width, height) {
	var barWidth = width / frequencies.length;
	for (var barIndex = 0; barIndex < frequencies.length; barIndex++) {
		for (var x = barIndex * barWidth; x < (barIndex + 1) * barWidth - 1; x++) {
			var blockHeight = barWidth;
			var barHeight = frequencies[barIndex] * height;
			var verticalBuckets = barHeight / blockHeight;
			for (var blockIndex = 0; blockIndex < verticalBuckets; blockIndex++) {
				for (var y = blockIndex * blockHeight; y < (blockIndex + 1) * blockHeight - 1; y++) {
					plot(x, y, '#25aae1');
				}
			}
		}
	}
});

defineVisualizer('barsWithCaps', 'Draws bars with little caps on the top to add some differentiation.', function (plot, frequencies, width, height) {
	var barWidth = width / frequencies.length;
	for (var barIndex = 0; barIndex < frequencies.length; barIndex++) {
		for (var x = barIndex * barWidth; x < (barIndex + 1) * barWidth - 1; x++) {
			var blockHeight = barWidth;
			var barHeight = frequencies[barIndex] * height;
			var verticalBuckets = barHeight / blockHeight;

			for (var y = 0; y < barHeight; y++) {
				// If we are at the 
				var beforeLastBlock = barHeight - 4;

				if (y > beforeLastBlock) {
					plot(x, y, '#25aae1');
				}
				else if (/*(y % blockHeight == 0 && y < barHeight - blockHeight) || */(Math.abs(y - beforeLastBlock) < 1)) {
				} else {
					plot(x, y, '#25aae1');
				}
			}
		}
	}
});

defineVisualizer('pixelBarsQuadWithLeading', 'Attempts to show velocity by splitting each pixel bar into two columns and having the rightmost column lead in the direction of the velocity (up when rising, down when falling).', function (plot, frequencies, width, height, velocity) {
	var barWidth = width / frequencies.length;
	for (var barIndex = 0; barIndex < frequencies.length; barIndex++) {
		for (var x = barIndex * barWidth; x < (barIndex + 0.5) * barWidth - 1; x++) {
			var blockHeight = barWidth / 2;
			var barHeight = frequencies[barIndex] * height;
			var verticalBuckets = barHeight / blockHeight;

			if (velocity[barIndex] > 0) {
				verticalBuckets -= 1;
			}

			for (var blockIndex = 0; blockIndex < verticalBuckets; blockIndex++) {
				for (var y = blockIndex * blockHeight; y < (blockIndex + 1) * blockHeight - 1; y++) {
					plot(x, y, '#25aae1');
				}
			}
		}

		for (var x = (barIndex + 0.5) * barWidth; x < (barIndex + 1) * barWidth - 1; x++) {
			var blockHeight = barWidth / 2;
			var barHeight = frequencies[barIndex] * height;
			var verticalBuckets = barHeight / blockHeight;

			if (velocity[barIndex] < 0) {
				verticalBuckets -= 1;
			}

			for (var blockIndex = 0; blockIndex < verticalBuckets; blockIndex++) {
				for (var y = blockIndex * blockHeight; y < (blockIndex + 1) * blockHeight - 1; y++) {
					plot(x, y, '#25aae1');
				}
			}
		}
	}
});

Array.prototype.flatMap = function(transform) {
	return this.map(transform).reduce(function(a, b) { return a.concat(b) }, []);
};

function rescaleFrequencies(frequencies, length) {
	var seed = 0;
	var resampleFactor = Math.floor(length / frequencies.length) - 1;
	return frequencies.flatMap(function(x) {
		var fudgedSamples = [x];
		for (var i = 0; i < resampleFactor; i++) {
			fudgedSamples.push(x + Math.abs(Math.sin(seed * Math.PI / resampleFactor)) * 0.1);
			seed += 1;
		}
		return fudgedSamples;
	});
}

defineVisualizer('centerBars', 'Centered bars.', function(plot, frequencies, width, height) {
	var rescaledFrequencies = rescaleFrequencies(frequencies, 60);

	var barWidth = width / rescaledFrequencies.length;
	var actualBarWidth = barWidth / 4;
	for (var barIndex = 0; barIndex < rescaledFrequencies.length; barIndex++) {
		var barMidX = (barIndex + 0.5) * barWidth;
		for (var x = barMidX - actualBarWidth / 2; x < barMidX + actualBarWidth / 2; x++) {
			var midY = height / 2;
			var otherHeight = rescaledFrequencies[barIndex] * height / 2;
			var startY = midY - otherHeight / 2;
			var endY = midY + otherHeight / 2;

			for (var y = startY; y < endY; y++) {
				plot(x, y, '#25aae1');
			}
		}
	}
});

defineVisualizer('shakingCenterBars', 'Centered bars shaking to the beat.', function(plot, frequencies, width, height, velocity, frameIndex) {
	var bassAverage = frequencies.slice(0, 5).reduce(function(a, b) { return a + b }, 0) / 5;
	var maxVariationX = 0.08 * width;
	var maxVariationY = 0.00 * height;
	var rescaledFrequencies = rescaleFrequencies(frequencies, 60);

	var barWidth = width / rescaledFrequencies.length;
	var actualBarWidth = barWidth / 4;
	for (var barIndex = 0; barIndex < rescaledFrequencies.length; barIndex++) {
		var barMidX = (barIndex + 0.5) * barWidth;
		for (var x = barMidX - actualBarWidth / 2; x < barMidX + actualBarWidth / 2; x++) {
			var midY = height / 2;
			var otherHeight = rescaledFrequencies[barIndex] * height / 2;
			var startY = midY - otherHeight / 2;
			var endY = midY + otherHeight / 2;

			for (var y = startY; y < endY; y++) {
				var variationX = Math.pow(bassAverage, 2) * maxVariationX * Math.sin(frameIndex);
				var variationY = Math.pow(bassAverage, 2) * maxVariationY * Math.sin(frameIndex);
				plot(x + variationX, y + variationY, '#25aae1');
			}
		}
	}
});

function smoothFrequencies(frequencies, length) {
	var resampleFactor = Math.floor(length / frequencies.length) - 1;
	return frequencies.flatMap(function(frequency, index) {
		var nextFrequency = frequencies[index + 1] || frequency;

		var step = (nextFrequency - frequency) / resampleFactor;

		var fudgedSamples = [frequency];
		for (var i = 0; i < resampleFactor; i++) {
			fudgedSamples.push(frequency + step * i);
		}

		return fudgedSamples;
	});
}

defineVisualizer('mountainsAndValleys', 'Seashells from Sally.', function(plot, frequencies, width, height, velocity, frameIndex) {
	var smoothedFrequencies = smoothFrequencies(frequencies, width);

	for (var x = 0; x < width; x++) {
		var frequency = smoothedFrequencies[x];
		var otherFrequency = smoothedFrequencies[width - x];

		var frequencyY = height / 2 + frequency * height / 2;
		var otherFrequencyY = height / 2 - otherFrequency * height / 2;
		for (var y = otherFrequencyY; y < frequencyY; y++) {
			plot(x, y, '#25aae1');
		}
	}
});

defineVisualizer('tatteredLineOfString', 'Diagonally symmetric plot of frequencies.', function(plot, frequencies, width, height, velocity, frameIndex) {
	var smoothedFrequencies = smoothFrequencies(frequencies, width);

	for (var x = 0; x < width; x++) {
		var frequency = smoothedFrequencies[x];
		var nextFrequency = smoothedFrequencies[x + 1] || frequency;

		var frequencyY = height / 2 + frequency * height / 2;
		var nextFrequencyY = height / 2 + nextFrequency * height / 2;
		for (var y = Math.min(frequencyY, nextFrequencyY); y <= Math.max(frequencyY, nextFrequencyY); y++) {
			plot(x, y, '#25aae1');
		}
	}
});

defineVisualizer('sun', 'Draws concentric circles representing approximate bass, mid and treble frequency ranges.', function (plot, frequencies, width, height, rgbaNorm) {
	var bassAverage = frequencies.slice(0, 5).reduce(function(a, b) { return a + b }, 0) / 5;
	var midAverage = frequencies.slice(5, 15).reduce(function(a, b) { return a + b }, 0) / 10;
	var trebleAverage = frequencies.slice(15, 20).reduce(function(a, b) { return a + b }, 0) / 5;

	var bassCumulative = bassAverage;
	var midCumulative = midAverage + bassAverage;
	var trebleCumulative = midCumulative + trebleAverage;

	function drawCircle(innerRadius, outerRadius, color, cx, cy) {
		var rx = outerRadius * width;
		var ry = outerRadius * height;

		// var cx = width / 2;
		// var cy = height / 2;

		for (var r = innerRadius; r < rx; r += 1) {
			var big = true;
			for (var theta = 0; theta < 2 * Math.PI; theta += 0.05) {
				if (big) {
					plot(cx + r * Math.cos(theta), cy + (ry / rx) * r * Math.sin(theta), color);
				} else {
					plot(cx + r / 1.5 * Math.cos(theta), cy + (ry / rx) * r / 1.5 * Math.sin(theta), color);
				}
				big = !big;
			}
		}
	}
	
	drawCircle(0, trebleCumulative, 'red', width / 2, height / 2);
	drawCircle(trebleCumulative, midCumulative, 'orange', width / 2, height / 2);
	drawCircle(midCumulative, bassCumulative, 'yellow', width / 2, height / 2);

	// for (var x = width / 2 - wvariation; x < width / 2 + wvariation; x++) {
	// 	for (var y = height / 2 - hvariation; y < height / 2 + hvariation; y++) {
	// 		plot(x, y, rgbaNorm(1 - bassCumulative, midAverage, 1 - trebleAverage, 1));
	// 	}
	// }
});

defineVisualizer('shakingPixelBars', 'Shows pixel bars but shakes them.', function(plot, frequencies, width, height, velocity, frameIndex) {
	var bassAverage = frequencies.slice(0, 5).reduce(function(a, b) { return a + b }, 0) / 5;
	var maxVariationX = 0.15 * width;
	var maxVariationY = 0.08 * height;
	var barWidth = width / frequencies.length;

	for (var barIndex = 0; barIndex < frequencies.length; barIndex++) {
		for (var x = barIndex * barWidth; x < (barIndex + 1) * barWidth - 1; x++) {
			var blockHeight = barWidth;
			var barHeight = frequencies[barIndex] * height;
			var verticalBuckets = barHeight / blockHeight;
			for (var blockIndex = 0; blockIndex < verticalBuckets; blockIndex++) {
				for (var y = blockIndex * blockHeight; y < (blockIndex + 1) * blockHeight - 1; y++) {
					var variationX = Math.pow(bassAverage, 2) * maxVariationX * Math.sin(frameIndex);
					var variationY = Math.pow(bassAverage, 2) * maxVariationY * Math.sin(frameIndex);
					plot(x + variationX, y + variationY, '#25aae1');
				}
			}
		}
	}
});

defineVisualizer('shakingBars', 'Shows regular bars but shakes them in time with bass.', function (plot, frequencies, width, height, velocity, frameIndex) {	
	var bassAverage = frequencies.slice(0, 5).reduce(function(a, b) { return a + b }, 0) / 5;
	var maxVariationX = 0.15 * width;
	var maxVariationY = 0.08 * height;
	var barWidth = width / frequencies.length;

	for (var b = 0; b < frequencies.length; b++) {
		for (var x = b * barWidth; x < (b + 1) * barWidth - 1; x++) {
			for (var y = 0; y < frequencies[b] * height; y++) {
				var variationX = Math.pow(bassAverage, 2) * maxVariationX * Math.sin(frameIndex);
				var variationY = Math.pow(bassAverage, 2) * maxVariationY * Math.sin(frameIndex);
				plot(x + variationX, y + variationY, '#25aae1');
			}
		}
	}
});

defineVisualizer('movingBlob', 'Frequency-based blobs in the center that give the illusion of constant directional movement AND move with the beat.', function(plot, frequencies, width, height, velocity, frameIndex) {
	var smoothedFrequencies = smoothFrequencies(frequencies, width);

	for (var x = 0; x < width; x++) {
		var frequency = Math.abs(smoothedFrequencies[x] * Math.sin(0.25 * frameIndex + x * (frequencies.length / smoothedFrequencies.length)));

		var top = height / 2 + frequency * height / 2;
		var bottom = height / 2 - frequency * height / 2;
		for (var y = bottom; y < top; y++) {
			plot(x, y, '#25aae1');
		}
	}
});

const small_flame_settings = {
	COLD_COLOR_AGE: 12,
	MED_COLOR_AGE: 3,
	HOT_COLOR: [0,0,50,1],
	MED_COLOR: [220,200,180,1],
	COLD_COLOR: [255, 80, 80, 0.4],
	DEATH_AGE: 12,
	FULL_AMP_SPAWN_COUNT:	 16,
	MAX_INIT_UP: 0.04,
	INIT_UP_RAND: 0.01,
	INIT_X_RAND: 0.005,
	PARTICLE_SIZE: 0.02
};

const SMALL_FLAMES = 1;
const BIG_FLAMES = 2;
const particleSystem = {
	head: null,
	tail: null,
	pool: []
};
function addParticle(position, velocity){
	if(particleSystem.pool.length == 0){
		particle = {};
	}
	else{
		particle = particleSystem.pool.pop();
	}
	particle.velocity = velocity;
	particle.position = position;
	particle.age = 0;
	if(particleSystem.head === null){
		particleSystem.head = particle;
		particleSystem.tail = particle;
	}
	else{
		particle.prev = particleSystem.tail;
		particleSystem.tail.next = particle;
		particleSystem.tail = particle;
	}
	particleSystem.tail.next = null;
}
function killParticle(particle){
	particleSystem.pool.push(particle);
	if(particle !== particleSystem.head && particle !== particleSystem.tail){
		particle.prev.next = particle.next;
		particle.next.prev = particle.prev;
	}
	else if(particle === particleSystem.head){
		particleSystem.head = particleSystem.head.next;
		if(particleSystem.head !== null){
			particleSystem.head.prev = null;
		}
	}
	else{
		particleSystem.tail = particleSystem.tail.prev;
		if(particleSystem.tail !== null){
			particleSystem.tail.next = null;
		}
	}
}
function updateParticle(particle){
	++particle.age;
	particle.position[0] += particle.velocity[0];
	particle.position[1] += particle.velocity[1];
}

function createParticleTransparencyMap(width){
	const size = parseInt(width * small_flame_settings.PARTICLE_SIZE);
	let row;
	let map = [];
	let transparency;
	let dist;
	const center = size/2;
	for(let x = 0; x < size; ++ x){
		row = [];
		for(let y = 0; y< size; ++y){
			dist = Math.sqrt(Math.pow(center - x, 2) + Math.pow(center - y, 2));
			transparency = Math.min(Math.pow(dist * 2 / size, 2), 1);
			row.push(1 - transparency);
		}
		map.push(row);
	}
	return map;
}
let particleTransparencyMap;

defineVisualizer('particles1', 'flame-like visualization',function(plot, frequencies, width, height, velocity, frameIndex){
	const flameWidth = 1 / frequencies.length;
	for(let flameIdx = 0; flameIdx < frequencies.length; ++ flameIdx){
		for(let i = 0; i < Math.floor(frequencies[flameIdx] * small_flame_settings.FULL_AMP_SPAWN_COUNT); ++i){
			addParticle(
				[flameIdx * flameWidth + Math.random() * flameWidth, 0],
				[-1 * Math.random() * small_flame_settings.INIT_X_RAND +
					2 * Math.random() * small_flame_settings.INIT_X_RAND,
					small_flame_settings.MAX_INIT_UP *frequencies[flameIdx] + Math.random() * small_flame_settings.INIT_UP_RAND
				],
			);
		}
	}
	let particle = particleSystem.head;	
	let nextParticle;
	let color = [0,0,0,0]
	let colorLerpAmount;
	let formattedColor;
	let particleRenderedSize = small_flame_settings.PARTICLE_SIZE * width;
	while(particle !== null){
		if(particle.age <= small_flame_settings.MED_COLOR_AGE){
			colorLerpAmount = particle.age / small_flame_settings.MED_COLOR_AGE;
			for(let i = 0; i < 4 ; ++i){
				color[i] =  (1 - colorLerpAmount) * small_flame_settings.HOT_COLOR[i] + colorLerpAmount * small_flame_settings.MED_COLOR[i];
			}
		}
		else{
			colorLerpAmount = (particle.age - small_flame_settings.MED_COLOR_AGE) / (small_flame_settings.COLD_COLOR_AGE - small_flame_settings.MED_COLOR_AGE);
			colorLerpAmount = Math.min(colorLerpAmount, 1);
			for(let i = 0; i < 4 ; ++i){
				color[i] =  (1 - colorLerpAmount) * small_flame_settings.MED_COLOR[i] + colorLerpAmount * small_flame_settings.COLD_COLOR[i];
			}
		}
		color[0] = Math.floor(color[0]);
		color[1] = Math.floor(color[1]);
		color[2] = Math.floor(color[2]);
		for(let particleX = 0; particleX < particleRenderedSize ; ++particleX){
			for(let particleY = 0; particleY < particleRenderedSize; ++particleY){
				plot(parseInt(particle.position[0] * width) + particleX,
					parseInt(particle.position[1] * height) + particleY,
					`rgba(${color[0]},${color[1]},${color[2]},${color[3]})`);
			}
		}
		
		updateParticle(particle);
		nextParticle = particle.next;
		if(particle.age >= small_flame_settings.DEATH_AGE){
			killParticle(particle);			
		}
		particle = nextParticle;
	}
});
const big_flame_settings = {
	COLD_COLOR_AGE: 12,
	MED_COLOR_AGE: 3,
	HOT_COLOR: [255,255,255,1],
	MED_COLOR: [200,180,220,1],
	COLD_COLOR: [80, 80, 255, 0.4],
	DEATH_AGE: 12,
	FULL_AMP_SPAWN_COUNT:	 1,
	MAX_INIT_UP: 0.07,
	INIT_UP_RAND: 0.01,
	INIT_X_RAND: 0,
};
defineVisualizer('particles2', 'another particle system',function(plot, frequencies, width, height, velocity, frameIndex){
	const flameWidth = 1 / frequencies.length;
	for(let flameIdx = 0; flameIdx < frequencies.length; ++ flameIdx){
		for(let i = 0; i < Math.round(frequencies[flameIdx] *
			 big_flame_settings.FULL_AMP_SPAWN_COUNT); ++i){
			addParticle(
				[flameIdx * flameWidth, 0],
				[-1 * Math.random() * big_flame_settings.INIT_X_RAND +
					2 * Math.random() * big_flame_settings.INIT_X_RAND,
					big_flame_settings.MAX_INIT_UP *frequencies[flameIdx] + Math.random() * big_flame_settings.INIT_UP_RAND
				],
			);
		}
	}
	let particle = particleSystem.head;	
	let nextParticle;
	let color = [0,0,0,0]
	let colorLerpAmount;
	let formattedColor;
	let particleRenderedSize = flameWidth * width - 1;
	for(let flameIdx = 0; flameIdx < frequencies.length; ++ flameIdx){//render static bottom row
		for(let particleX = 0; particleX < particleRenderedSize ; ++particleX){
			for(let particleY = 0; particleY < particleRenderedSize; ++particleY){
				plot(parseInt(flameIdx * width * flameWidth + particleX),
					parseInt(particleY),
					`rgba(${big_flame_settings.HOT_COLOR.join(",")})`);
			}
		}
	}
	while(particle !== null){
		if(particle.age <= big_flame_settings.MED_COLOR_AGE){ 
			colorLerpAmount = particle.age / big_flame_settings.MED_COLOR_AGE;
			for(let i = 0; i < 4 ; ++i){
				color[i] =  (1 - colorLerpAmount) * big_flame_settings.HOT_COLOR[i] + colorLerpAmount * big_flame_settings.MED_COLOR[i];
			}
		}
		else{
			colorLerpAmount = (particle.age - big_flame_settings.MED_COLOR_AGE) / (big_flame_settings.COLD_COLOR_AGE - big_flame_settings.MED_COLOR_AGE);
			colorLerpAmount = Math.min(colorLerpAmount, 1);
			for(let i = 0; i < 4 ; ++i){
				color[i] =  (1 - colorLerpAmount) * big_flame_settings.MED_COLOR[i] + colorLerpAmount * big_flame_settings.COLD_COLOR[i];
			}
		}
		color[0] = Math.floor(color[0]);
		color[1] = Math.floor(color[1]);
		color[2] = Math.floor(color[2]);
		for(let particleX = 0; particleX < particleRenderedSize ; ++particleX){
			for(let particleY = 0; particleY < particleRenderedSize; ++particleY){
				plot(parseInt(particle.position[0] * width) + particleX,
					parseInt(particle.position[1] * height) + particleY,
					`rgba(${color[0]},${color[1]},${color[2]},${color[3]})`);
			}
		}
		
		updateParticle(particle);
		nextParticle = particle.next;
		if(particle.age >= big_flame_settings.DEATH_AGE){
			killParticle(particle);			
		}
		particle = nextParticle;
	}
});