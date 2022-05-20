// Import the leaflet package
const { marker } = require('leaflet');
const { bounds } = require('leaflet');
var L = require('leaflet');
var LRM = require('leaflet-routing-machine');
var OVP = require('overpass.js');
var $ = require("jquery");
var osmtogeojson = require("osmtogeojson");

var isochroneLayer = null;
var isochronePolygon = null;
var polyString = "";
var resultsLayerGroup;
var resultLayer = null;

//set up markers and path
var coordA;
var coordB;
var routeStart;
var routeDest;

var startMarker;
var destMarker;
var path;
/* let pathDrawn = { a: false };
let routeDrawn = { a: false }; */

// var markerArray = new Array();
var pathArray = new Array();
var isSelectingStart = false;
var isSelectingDest = false;
var isStartSelected = false;
var isDestSelected = false;
var isochroneDrawn = false;

const radioButtons = document.querySelectorAll('input[name="radio"]');

var greenIcon = new L.Icon({
	iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
	shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41]
});

var redIcon = new L.Icon({
	iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
	shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41]
});

var orangeIcon = new L.Icon({
	iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
	shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41]
});

var iconList = [greenIcon, redIcon];



startMarker = new L.marker(coordA, { icon: greenIcon });
destMarker = new L.marker(coordB, { icon: redIcon })




// Creates a leaflet map binded to an html <div> with id "map"
// setView will set the initial map view to the location at coordinates
// 13 represents the initial zoom level with higher values being more zoomed in
var initialCoord = [55.86, -4.25];
var map = L.map('map').setView(initialCoord, 13);

// Adds the basemap tiles to your web map
// Additional providers are available at: https://leaflet-extras.github.io/leaflet-providers/preview/

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoicndhbGwwMTA1IiwiYSI6ImNqa3I2ZDQ4NzNmdmMzcXBqZ21hdnYzcWEifQ.QgejQortYMSdX-leJ3SMWw', {
	attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
	maxZoom: 18,
	id: 'mapbox/streets-v11',
	tileSize: 512,
	zoomOffset: -1,
	accessToken: 'your.mapbox.access.token'
}).addTo(map);


/* markerArray[0].addTo(map);
markerArray[1].addTo(map); */

var lat, lng;





map.addEventListener('mousemove', function (ev) {
	lat = ev.latlng.lat;
	lng = ev.latlng.lng;
});

var i = 1;
var j = 0;
var k = 0;
var distMarker = new L.marker();
var route = null;

var startButton = document.getElementById("startButton");
var destButton = document.getElementById("destButton");
var calcRouteButton = document.getElementById("calcRoute");
var clearAllButton = document.getElementById("clearAll");

/* var pathDisp = document.getElementById("pathDisp");
var routeDisp = document.getElementById("routeDisp"); */


/* let pathProxy = new Proxy(pathDrawn, {
	set(target, name, value) {
		var pathText = "pathDrawn: " + value;
		pathDisp.innerText = pathText;
		console.log("set path" + name + " to " + value);
		target[name] = value;
	}
});

let routeProxy = new Proxy(routeDrawn, {
	set(target, name, value) {
		var routeText = "routeDrawn: " + value;
		routeDisp.innerText = routeText;
		console.log("set route" + name + " to " + value);
		target[name] = value;
	}
});
 */


startButton.onclick = function () { startButtonClicked() };
destButton.onclick = function () { destButtonClicked() };
calcRouteButton.onclick = function () { calcRoute(map) };
clearAllButton.onclick = function () { clearAll() };

/**
 * 
 */
document.getElementById("map").addEventListener("click", function (event) {

	// Prevent the browser's context menu from appearing
	event.preventDefault();
	if (k == 0) { k = 1; } else { k = 0; }




	pointSelected();


	//if start and dest points exist
	if (coordA != null && coordB != null) {

		calcRouteButton.classList.add("show");

		//draw direct path
		if (pathProxy.a) {
			map.removeLayer(path);
			pathProxy.a = false;
		}

		path = new L.Polyline([coordA, coordB], { color: 'green', dashArray: "5 6" });

		//check if start or destination has changed from route drawn
		if ([coordA, coordB] != [routeStart, routeDest]) {
			path.addTo(map);
			pathProxy.a = true;




			//find midpoint
			midpoint = [(coordA[0] + coordB[0]) / 2, (coordA[1] + coordB[1]) / 2];
			console.log("midpoint: " + midpoint);

			//log distance to console
			distNum = distance(coordA[0], coordB[0], coordA[1], coordB[1])
			console.log(distNum + "km");

			//Add distance to map
			map.removeLayer(distMarker);
			distMarker = new L.marker(midpoint, { opacity: 0.01 }); //opacity may be set to zero
			distMarker.bindTooltip(distNum + "km", { permanent: true, className: "my-label", offset: [-10, 25] });
			distMarker.keepInView = true;

			distMarker.addTo(map);
		}
	}

	return false; // To disable default popup.
});


/**
 * 
 * @param {*} lat1 
 * @param {*} lat2 
 * @param {*} lon1 
 * @param {*} lon2 
 * @returns 
 */
function distance(lat1,
	lat2, lon1, lon2) {

	// The math module contains a function
	// named toRadians which converts from
	// degrees to radians.
	lon1 = lon1 * Math.PI / 180;
	lon2 = lon2 * Math.PI / 180;
	lat1 = lat1 * Math.PI / 180;
	lat2 = lat2 * Math.PI / 180;

	// Haversine formula
	let dlon = lon2 - lon1;
	let dlat = lat2 - lat1;
	let a = Math.pow(Math.sin(dlat / 2), 2)
		+ Math.cos(lat1) * Math.cos(lat2)
		* Math.pow(Math.sin(dlon / 2), 2);

	let c = 2 * Math.asin(Math.sqrt(a));

	// Radius of earth in kilometers. Use 3956
	// for miles
	let r = 6371;

	// calculate the result
	dist = (c * r);

	return dist.toFixed(2);
}



/**
 * 
 * @param {*} pointA 
 * @param {*} pointB 
 * @param {*} map 
 * @returns 
 */
function routing(pointA, pointB, map) {

	routeStart = pointA;
	routeDest = pointB;

	routeProxy.a = true;
	map.removeLayer(path);
	pathProxy.a = false;
	map.removeLayer(distMarker);


	var routeProfile = "mapbox/" + getProfile();

	const options = { profile: routeProfile };
	return L.Routing.control({
		waypoints: [
			L.latLng(pointA[0], pointA[1]),
			L.latLng(pointB[0], pointB[1])
		],
		router: L.Routing.mapbox('pk.eyJ1IjoicndhbGwwMTA1IiwiYSI6ImNsMzh6cHJhcjAydmwzaW13eXJsdW0wN3gifQ.EYWkQn4XuUEu3K_mkqd_aA', options),


	});

}

/**
 * 
 */
function removeRoutingControl() {
	if (route != null) {
		map.removeControl(route);
		route = null;
	}
};

//change cursor if selecting start/dest
/**
 * 
 */
function changeCursor() {
	if (isSelectingStart || isSelectingDest) {
		document.getElementById("map").style.cursor = "crosshair";
	} else {
		document.getElementById("map").style.cursor = "grab";
	}
}
/**
 * 
 */
function startButtonClicked() {
	isSelectingDest = false;
	if (!isSelectingStart) {
		isSelectingStart = true;
	} else {
		isSelectingStart = false;
	}
	changeCursor();
}
/**
 * 
 */
function destButtonClicked() {
	isSelectingStart = false;
	if (!isSelectingDest) {
		isSelectingDest = true;
	} else {
		isSelectingDest = false;
	}
	changeCursor();
}
/**
 * 
 */
function pointSelected() {
	if (isSelectingStart) {
		startSelected();
	} else if (isSelectingDest) {
		destSelected();
	}
}
/**
 * 
 */
function startSelected() {
	if (isSelectingStart) {
		isSelectingStart = false;
		isStartSelected = true;
		changeCursor();
		if (startMarker != null) {
			map.removeLayer(startMarker);
		}
		startMarker = new L.marker([lat, lng], { icon: iconList[0] });
		map.addLayer(startMarker);
		coordA = [lat, lng];
	}

}

/**
 * 
 */
function destSelected() {
	if (isSelectingDest) {
		isSelectingDest = false;
		isDestSelected = true;
		changeCursor();
		if (destMarker != null) {
			map.removeLayer(destMarker);
		}
		destMarker = new L.marker([lat, lng], { icon: iconList[1] });
		coordB = [lat, lng];
		map.addLayer(destMarker)
	}

}

//calculate a route
/**
 * 
 * @param {*} map 
 */
function calcRoute(map) {
	if (route != null) {
		removeRoutingControl();
	}
	route = routing(coordA, coordB, map);

	route.addTo(map);
}

//clear markers, route, and path
/**
 * 
 */
function clearAll() {
	console.log("clearing all");
	if (route != null) {
		removeRoutingControl();

	}


	map.removeLayer(startMarker);
	map.removeLayer(destMarker);
	calcRouteButton.classList.remove("show");

	if (pathProxy.a) {
		console.log("path drawn");
		map.removeLayer(path);
		pathProxy.a = false;


		map.removeLayer(distMarker);
	}
	if (isochroneLayer != null){
		map.removeLayer(isochroneLayer);
		isochroneLayer = null;
		isochroneDrawn = false;
		$("#searchButton").removeClass("show");
	}

	if (resultLayer != null) {
		map.removeLayer(resultLayer);
		resultLayer = null;
	}

	coordA = null;
	coordB = null;
	routeProxy.a = false;


}



//

/**
 * build string of coords for
 */
function buildPoly() {
	polyString = "";
	console.log(isochronePolygon);
	
	for (let coord of isochronePolygon) {
		polyString = polyString + coord[1] + " " + coord[0] + " ";
	  }
	  return polyString.trim();
}


/**
 * 
 * @param {*} map 
 * @param {*} overpassQuery 
 * @returns URL for GET
 */
function buildOverpassApiUrl(overpassQuery) {
	var polyString = buildPoly();

	var nwrQuery = 'nwr[' + overpassQuery + '](poly:"' + polyString + '");';

	var query = '?data=[out:xml][timeout:15];(' + nwrQuery + ');out body geom;';
	var baseUrl = 'http://overpass-api.de/api/interpreter';
	var resultUrl = baseUrl + query;

	return resultUrl;


}


/**
 * 
 * @param {*} filter 
 * @returns Query for POST
 */
function buildOverpassQuery(filter) {
	var polyString = buildPoly();

	var nwrQuery = 'nwr[' + filter + '](poly:"' + polyString + '");';
	var query = '[out:xml][timeout:15];(' + nwrQuery + ');out body geom;';
	return query;
}

/**
 * 
 * @returns 
 */
function buildOverpassFilter() {
	var key = $("#keyBox").val().trim();
	var tag = $("#tagBox").val().trim();
	if (tag == "" ) {
		return key;
	} else {
		var overpassQuery = '"'+key+'"="'+tag+'"';
		return overpassQuery;
	}
	return "";
}

/**
 * Overpass API request 
 */
$("#searchButton").on("click", function () {
	search();
});

var keyBox = $("#keyBox");
var tagBox = $("#tagBox");


/**
 * Seearch when enter pressed while typing in either search box
 */
keyBox.on("keypress", function (e) {
	if (e.key == "Enter") {	
	  search();
	}
  });

tagBox.on("keypress", function (e) {
	if (e.key == "Enter") {	
	  search();
	}
  });


function search() {
	if (isochroneDrawn) {
	var testFilter = buildOverpassFilter();
	console.log("testFilter: " + testFilter);

	var overpassApiUrl = buildOverpassApiUrl(testFilter);
	var postQuery = buildOverpassQuery(testFilter);

	var baseUrl = 'http://overpass-api.de/api/interpreter';
	$.post(baseUrl, postQuery, function(data) {
		parseOverpassData(data);
	});
	} else {
		console.error("Isochrone Not Drawn");
	}
}



function parseOverpassData(osmDataAsXml) {
	
		var resultAsGeojson = osmtogeojson(osmDataAsXml);

		var geojsonMarkerOptions = {

			icon: greenIcon
		};

		if (resultLayer != null) {
			map.removeLayer(resultLayer);
		}
		resultLayer = L.geoJson(resultAsGeojson, {
			pointToLayer: function (feature, latlng) {
				return L.marker(latlng, { icon: orangeIcon });
			},
			style: function (feature) {
				return { color: "ff0000" };
			},
			filter: function (feature, layer) {
				var isPolygon = (feature.geometry) && (feature.geometry.type !== undefined) && (feature.geometry.type === "Polygon");
				if (isPolygon) {
					feature.geometry.type = "Point";
					var polygonCenter = L.latLngBounds(feature.geometry.coordinates[0]).getCenter();
					feature.geometry.coordinates = [polygonCenter.lat, polygonCenter.lng];
				}
				return true;
			},
			onEachFeature: function (feature, layer) {
				var popupContent = "";
				console.log("feature properties type: " + feature.properties.name);
				popupContent = popupContent + feature.properties.name;
				var objectUrl = "http://overpass-api.de/api/interpreter?data=[out:json];" + feature.properties.type + "%28" + feature.properties.id + "%29;out;";
				layer.bindPopup(popupContent);


			}
		}).addTo(map);


	
}


var polyTest = { "features": [{ "properties": { "fill": "#bf4040", "fillOpacity": 1, "fillColor": "#bf4040", "contour": 400, "opacity": 1, "metric": "distance" }, "geometry": { "coordinates": [[[55.832625, -4.336639], [55.831354, -4.336911], [55.831479, -4.339765], [55.830914, -4.339911], [55.831294, -4.340242], [55.831625, -4.340258], [55.831933, -4.339219], [55.832729, -4.339014], [55.833048, -4.338333], [55.833625, -4.338119], [55.834374, -4.338162], [55.834625, -4.339002], [55.83555, -4.338911], [55.834796, -4.33874], [55.834701, -4.337835], [55.833108, -4.337428], [55.832625, -4.336639]]], "type": "Polygon" }, "type": "Feature" }], "type": "FeatureCollection" }

/**
 *  Gets isochrone on button clicked
 */
$("#getIsochrone").on("click", function () {

	/**
	 * create url request
	 */
	var baseUrl = "https://api.mapbox.com/isochrone/v1/mapbox/";

	var profile = getProfile();
	var time = parseFloat($("#timeBox").val().trim());
	time = Math.round(time);
	$("#timeBox").val(time);
	var contours = "contours_minutes=" + time;
	var polygons = "polygons=true";
	var denoiseVal = 0;
	var generaliseVal = 0;
	if (time >=16) {
		denoiseVal = 1;
		generaliseVal = 1;
	}
	var denoise = "denoise=" + denoiseVal;
	var generalise = "generalize="+ generaliseVal;
	var accessToken = "pk.eyJ1IjoicndhbGwwMTA1IiwiYSI6ImNqa3I2ZDQ4NzNmdmMzcXBqZ21hdnYzcWEifQ.QgejQortYMSdX-leJ3SMWw";
	var accessTokenString = "access_token=" + accessToken;

	var isoRequest = baseUrl + profile + "/" + coordA[1].toFixed(3) + "%2C" + coordA[0].toFixed(3) + "?" + contours + "&" + polygons + "&" + denoise + "&" + generalise + "&" + accessTokenString;
	console.log("isoRequest: " + isoRequest)

	/**
	 * gets isochrone geoJSON data from mapbox.com
	 * 
	 * https://api.mapbox.com/isochrone/v1/mapbox/driving/-117.17282,32.71204?contours_minutes=15&polygons=true&access_token
	 *=pk.eyJ1IjoicndhbGwwMTA1IiwiYSI6ImNqa3I2ZDQ4NzNmdmMzcXBqZ21hdnYzcWEifQ.QgejQortYMSdX-leJ3SMWw
	 */
	$.get(isoRequest, function (isochroneJSON) {
		if (isochroneLayer != null) {
			map.removeLayer(isochroneLayer);
		}


		isochroneLayer = L.geoJSON(isochroneJSON, {

			onEachFeature: function(feature, layer) {
				isochronePolygon = feature.geometry.coordinates[0];
				console.log("isochronePolygon");
				console.log(isochronePolygon);
			}
		}).addTo(map);
		isochroneDrawn = true;
		$("#searchButton").addClass("show");

	});
});

/*

*/
/**
 * 	Checks selected navigation profile from radio buttons
 * @returns {string} selected navigation profile ("walking", "cycling", or "driving")
 */


function getProfile() {
	var selectedProfile
	for (const radioButton of radioButtons) {
		if (radioButton.checked) {
			selectedProfile = radioButton.value;
			console.log("Profile: " + selectedProfile);
			return selectedProfile;
		}
	}
}

$("#getUrbanityButton").on("click", function() {
	urbanityRequest();
})

function urbanityRequest() {

isochroneRequest();

}

function calculateWalkability(data) {

}


function isochroneRequest() {

	//create query
	var isoQuery = createUrbanityIsochroneQuery();
	console.log("Urbanity isoQuery: ");
	console.log(isoQuery);

	$.get(isoQuery, function (isochroneJSON) {
		if (isochroneLayer != null) {
			map.removeLayer(isochroneLayer);
		}


		isochroneLayer = L.geoJSON(isochroneJSON, {

			onEachFeature: function(feature, layer) {
				isochronePolygon = feature.geometry.coordinates[0];
				console.log("isochronePolygon");
				console.log(isochronePolygon);
			}
		}).addTo(map);
	});



}
/**
 * 
 * @returns {String[]} isoQuery: 4 isochrone query strings to be sent to mapbox
 */
function createUrbanityIsochroneQuery() {
		/**
	 * create url request
	 */
		 var baseUrl = "https://api.mapbox.com/isochrone/v1/mapbox/";

		 var profile = "walking";
		var contoursVals = [5,10,15,20];
		 var contours = "contours_minutes=5,10,15,20";
		 var polygons = "polygons=true";
		 var colours = 'contours_colors=';
		 var denoiseVal = 0.5;
		 var generaliseVal = 0.5;

		 var denoise = "denoise=" + denoiseVal;
		 var generalise = "generalize="+ generaliseVal;
		 var accessToken = "pk.eyJ1IjoicndhbGwwMTA1IiwiYSI6ImNqa3I2ZDQ4NzNmdmMzcXBqZ21hdnYzcWEifQ.QgejQortYMSdX-leJ3SMWw";
		 var accessTokenString = "access_token=" + accessToken;

		 var isoRequest;
		 //for (let i=0; i<5; i++) {
		 isoRequest = baseUrl + profile + "/" + coordA[1].toFixed(3) + "%2C" + coordA[0].toFixed(3) + "?" + contours + "&" + polygons + "&" + denoise + "&" + generalise + "&" + accessTokenString;
		 //}

		 return isoRequest;
}