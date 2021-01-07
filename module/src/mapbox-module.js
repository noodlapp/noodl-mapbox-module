const Noodl = require('@noodl/noodl-sdk');

import {useRef, useEffect} from 'react';

import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css'; //import the css using webpack


//a very simple react component that tells the caller when it's <div> is mounted and unmounted
//defaults to 100% width and height, so wrap in a Group in Noodl to get control over margins, dimensions, etc
function DivComponent(props) {

	const ref = useRef(null);
	  
	useEffect(() => {
		props.onDidMount(ref.current);
		return () => props.onWillUnmount(ref.current);
	});

	const {style, ...otherProps} = props;

	return <div {...otherProps} style={{...{width: '100%', height: '100%'}, ...style}} ref={ref} />;
}

const MapboxNode = Noodl.defineReactNode({
	name: 'Mapbox Map',
	category: 'Mapbox',
	getReactComponent() {
		return DivComponent;
	},
	initialize() {

		//wait for the div to mount before we create the map instance
		this.props.onDidMount = domElement => {
			this.initializeMap(domElement);
		};

		this.props.onWillUnmount = () => {
			this.map.remove();
		}
	},
	methods: {
		initializeMap(domElement) {

			const accessToken = Noodl.getProjectSettings().mapboxAccessToken;

			if(!accessToken) {
				//present a warning in the editor
				this.sendWarning('access-token-missing', 'No access token. Please specify one in project settings and reload');
			}
			else {
				//clear any previous warnings, if any
				this.clearWarnings();
			}
			
			mapboxgl.accessToken = accessToken;

			const map = new mapboxgl.Map({
				container: domElement,
				style: this.inputs.mapboxStyle || 'mapbox://styles/mapbox/streets-v11',
				center: [this.inputs.longitude || 0, this.inputs.latitute || 0],
				zoom: this.inputs.zoom || 0,
				interactive: this.inputs.interactive
			});

			this.map = map;

			map.on('move', () => {
				this.setOutputs({
					longitude: map.getCenter().lng.toFixed(4),
					latitute: map.getCenter().lat.toFixed(4),
					zoom: map.getZoom().toFixed(2)
				})
			});

			
			this.geolocate = new mapboxgl.GeolocateControl({
				positionOptions: {
					enableHighAccuracy: true
				},
				trackUserLocation: true
			});

			map.addControl(this.geolocate);

			map.on('load', () => {
				this.sendSignalOnOutput("mapLoaded");
			});
		}
	},
	inputs: {
		//options
		mapboxStyle: {
			displayName: 'Style',
			group: 'Options',
			type: 'string',
			default: 'mapbox://styles/mapbox/streets-v11'
		},
		interactive: {displayName: 'Interactive', type: 'boolean', default: true},

		//coordinates and zoom
		longitude: {displayName: 'Longitude', type: 'number', group: 'Coordinates', default: 0},
		latitute: {displayName: 'Latitude', type: 'number', group: 'Coordinates', default: 0},
		zoom: {displayName: 'Zoom', type: 'number', group: 'Coordinates', default: 0},
	},
	signals: {
		centerOnUser: {
			displayName: 'Center on user',
			group: 'Actions',
			signal() {
				this.geolocate && this.geolocate.trigger();
			}
		}
	},
	outputs: {
		longitude: {displayName: 'Longitude', type: 'number', group: 'Coordinates'},
		latitute: {displayName: 'Latitude', type: 'number', group: 'Coordinates'},
		zoom: {displayName: 'Longitude', type: 'number', group: 'Coordinates'},
		mapLoaded: {displayName: 'Map Loaded', type: 'signal'}
	},
	outputProps: {
		onClick: {type: 'signal', displayName: 'Click'}
	}
})


Noodl.defineModule({
    reactNodes: [
    	MapboxNode
    ],
    nodes:[
	],
	settings: [{
		name: 'mapboxAccessToken',
		type: 'string',
		displayName: 'Mapbox Access Token',
		plug: 'input'
	}],
    setup() {
    	
    }
});