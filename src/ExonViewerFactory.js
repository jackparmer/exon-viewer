/*
Sample Input

{
	tracks: [
		{
			exons: [[100, 200], [...], ...], // exon endpoints in natural coordinates

			traceSets: [ // track of lines above exons
				[ {x:[] , y: []}, {x:[] , y: []}, ... ], // one group of x-y points per exon
				[ {x:[] , y: []}, {x:[] , y: []}, ... ]
			],	

			features: {x:[] y:[], text:[]} // single points of interest - one per exon
											 // use {x:[null], y:[null]} to skip an exon
			
		}, {
			...
		},
		...
	],
	genomicCoordinates: false,
	layout: layout	
}

*/

const COLORSCALE = ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00","#ffff33","#a65628","#f781bf"];

const VERTICAL_PADDING = 0.2;

function getRandInt(min, max) {
	return Math.floor(Math.random()*Math.floor(max) + Math.floor(min));
}

function getRandFloat(min, max) {
	return (Math.random() * (max - min) + min).toFixed(4);
}

function splitPairs(arr) {
	var pairs = [];
	for (var i=0 ; i<arr.length ; i+=2) {
		if (arr[i+1] !== undefined) {
			pairs.push ([arr[i], arr[i+1]]);
		} 
		else {
			pairs.push ([arr[i]]);
		}
	}
	return pairs;
};

// generates fake track data for testing
function generateTracks(numTracks) {	
																								
	// Return an array of random exon positions as integers	 
	// E.g. [[100, 150], [250, 275], [380, 420], [500, 570]]	 
	function generateExons() {
		const NUM_EXONS = 20;
		let exonEndpoints = [];

		for(let i=0; i<NUM_EXONS*2; i++) {
			let j = i*100;
			exonEndpoints.push(getRandInt(j, j+100));
		}

		const sortedEndpoints = exonEndpoints.sort((a, b) => (a - b));

		return splitPairs(sortedEndpoints);
	}

	function generateTraces(exons, index, yLevel){
		let traces = [];
		const YMIN = 0.5 + yLevel + VERTICAL_PADDING;
		const YMAX = 1.0 + yLevel;
		const PTS = 5;

		console.warn('generateTraces', exons, index, yLevel);

		exons.map((ex, i) => {
			traces.push({
				x: Array.from({length: PTS}, () => getRandFloat(ex[0], ex[1])).sort(),
				y: Array.from({length: PTS}, () => getRandFloat(YMIN, YMAX)),
				marker: {size: 4, color: COLORSCALE[index]},
				legendgroup: `Sample ${yLevel}, ${index}`,
				name: `Sample ${yLevel}, ${index}`,
				showlegend: !Boolean(i)
			});
		});

		return traces;
	}


	function generateFeatures(exons, yLevel) {
		let featuresX = [];
		let featuresY = [];
		let featuresText = [];
		const Y = 0.25 + yLevel;

		exons.map((ex, i) => {
			//if (Math.random() > 0.5) {	
			if (true) {
			featuresX.push(getRandFloat(ex[0], ex[1]));
			featuresY.push(Y + VERTICAL_PADDING/2);
			featuresText.push('An interesting<br>observation here');
			} 
			else {
			featuresX.push(NaN);
			featuresY.push(NaN);
			featuresText.push(NaN);
			}
		});

		let features = {
			x: featuresX,
			y: featuresY,
			text: featuresText,
			legendgroup: 'Features',
			name: 'Show Feature',
			mode: 'markers',
			marker: {
			symbol: 'star',
			size: 6,
			line: {width: 0.5},
			color: 'red'
			}
		};

		if (yLevel !== 0) {
			features.showlegend = false;
		}
 
		return features;		
	}

	let tracks = [];

	for(let i=0; i<numTracks; i++) {
		let exons = generateExons();

		let traceSets = [];
		let numTraces = getRandInt(1,3);
		for(let j=0; j<numTraces; j++) {
			traceSets.push(generateTraces(exons, j, i));
		}

		let features = generateFeatures(exons, i);

		tracks.push({
			exons: exons,
			traceSets: traceSets,
			features: features
		});
	}

	return tracks;
}

// Utility function - get differences of array of pairs
function getDifferences(pairs) {
	let diffs = [];
	pairs.map(pair => {diffs.push(pair[1]-pair[0])});
	return diffs;
}

// get the local coordinates of a trace, relative to an exon
function getTraceLocalCoordinates(exons, traceSets) {

	let newTraceSet = [];

	traceSets.map(traces => {
		let tracesClone = JSON.parse(JSON.stringify(traces));

		traces.map((trc, i) => {
		let x0 = Number(trc['x'][0]);
		let distanceToExonStart = x0 - Number(exons[i][0]);
		let transformedX = [];

		// step through x data and subtract the first point
		trc.x.map(dx => {
			transformedX.push(Number(dx) - x0 + distanceToExonStart);
		});
		tracesClone[i].x = transformedX;
		});
		newTraceSet.push(tracesClone);
	});

	return newTraceSet;
}

function getFeatureLocalCoordinates(exons, features) {
	let newFeatures = [];
	let transformedX = [];
	let distanceToExonStart;

	features.x.map((dx, i) => {
		if (dx !== NaN) {
		transformedX.push(dx - Number(exons[i][0]));
		}
		else {
		transformedX.push(NaN);
		}
	});
	let featuresClone = JSON.parse(JSON.stringify(features));
	featuresClone.x = transformedX;

	return featuresClone;
}

/* 
* Take exon lengths and x,y data ("traces"),
* transform them genomic coordinates
*/
function stackExons(exonLengths, traceSets, features) {
	const PADDING = 100;
	let exonEndpts = [];
	let cumSum = 0;
	let newTraceSets = [];
	let newFeaturesX = [];

	// Step through exons, transform x coordinates
	// of both exon endpoints and features
	exonLengths.map((exLen, i) => {
		exonEndpts.push([cumSum, cumSum + exLen]);
		
		if (features.x[i] !== NaN) {
		newFeaturesX.push(cumSum + features.x[i]);
		}
		else {
		newFeaturesX.push(NaN);
		}
		
		cumSum = cumSum + exLen + PADDING;
	});

	let newFeatures = JSON.parse(JSON.stringify(features));
	newFeatures.x = newFeaturesX;

	// Step through trace sets, transform x coordinates
	traceSets.map((traceSet, i) => {

		let newTraceSet = [];
		cumSum = 0;

		exonLengths.map((exLen, j) => {

		let traceClone = JSON.parse(JSON.stringify(traceSet[j]));
		let transformedX = [];
		traceClone.x.map(x => {
			transformedX.push(x + cumSum);
		});
		traceClone.x = transformedX;
		newTraceSet.push(traceClone);
		cumSum = cumSum + exLen + PADDING;

		});

		newTraceSets.push(newTraceSet);
	});

	return [exonEndpts, newTraceSets, newFeatures];
}

/*
* Converts a track from natural to genomic coordinates
*/
function naturalToGenomicCoordinates(exons, traceSet, features) {
	const exonLengths = getDifferences(exons);
	const localCoordTraceSet = getTraceLocalCoordinates(exons, traceSet);
	const localCoordFeatures = getFeatureLocalCoordinates(exons, features);

	return stackExons(exonLengths, localCoordTraceSet, localCoordFeatures);
}

// returns a Plotly figure object given an object describing the tracks
function ExonViewerFactory(tracks) {

	let plotData = [];
	let shapes = [];

	if (tracks.genomicCoordinates) {
		let tracksGenomic = [];
		let xExons;
		let xTraceSets;
		let xFeatures;
		tracks.map((trc, i) => {
			[xExons, xTraceSets, xFeatures] = naturalToGenomicCoordinates(trc.exons, trc.traceSets, trc.features);
			tracksGenomic.push({exons: xExons, traceSets: xTraceSets, features: xFeatures});
		});
		tracks = null;
		tracks = tracksGenomic;
	}

	tracks.map((track, i) => {
		let exons = track.exons;
		let features = track.features;
		let traceSets = track.traceSets;

		// merge all sets of traces into a single array	
		let mergedTraceSet = [].concat.apply([], traceSets);
		plotData = plotData.concat(mergedTraceSet);
		// add feature markers	 
		plotData = plotData.concat(features);	

		exons.map(ex => {
			shapes.push({
				type: 'rect',
				xref: 'x', yref: 'y',
				x0: ex[0], x1: ex[1],
				y0: 0 + i + VERTICAL_PADDING, y1: 0.5 + i,
				line: {width: 0.5},
				fillcolor: 'rgba(55, 128, 191, 0.4)'
			});
		});			
	});

	const layout = {
		shapes: shapes,
		width: 1000,
		hovermode: 'closest',
		xaxis: {zeroline: false, showlines: false, showgrid: false,
				ticks: '', showticklabels: false},
		yaxis: {zeroline: false,	ticks: '', showgrid: false,
				showticklabels: false, fixedrange: true},
		margin: {t:0, l:0, r:0, b:0},
		height: 500
	}

	return {data: plotData, layout: layout};
}

export {generateTracks, ExonViewerFactory}
