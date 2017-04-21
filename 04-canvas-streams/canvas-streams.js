var localStream;
var ds;
var isInitialized = false;
var localVideo = $( '.local video' )[ 0 ];
var inputCtx = $( '.input-canvas canvas' )[ 0 ].getContext( '2d' );
var outputCtx = $( '.output-canvas canvas' )[ 0 ].getContext( '2d' );
var width = 300;
var height = 225;

navigator.getUserMedia(
	{ video: true, audio: true },
	stream => {
		localStream = stream;
		$( '.local video' ).attr( 'src', URL.createObjectURL( stream ) );
		drawToCanvas();
		init();
	},
	error => {
		alert( 'error while accessing usermedia ' + error.toString() );
	}
);

function drawToCanvas() {
	// draw video to input canvas
	inputCtx.drawImage( localVideo, 0, 0, width, height );

	// get pixel data from input canvas
	var pixelData = inputCtx.getImageData( 0, 0, width, height );

	var avg, i;

	// simple greyscale transformation
	for( i = 0; i < pixelData.data.length; i += 4 ) {
		avg = ( pixelData.data[ i ] + pixelData.data[ i + 1 ] + pixelData.data[ i + 2 ] ) / 3;
		pixelData.data[ i ] = avg;
		pixelData.data[ i + 1 ] = avg;
		pixelData.data[ i + 2 ] = avg;
	}

	outputCtx.putImageData( pixelData, 0, 0 );
	requestAnimationFrame( drawToCanvas );
}

ds = deepstream( 'wss://013.deepstreamhub.com?apiKey=d02f8752-7d26-4cf0-965a-90c21536410f' );

ds.login( null, init );

function init() {
	if( !localStream || ds.getConnectionState() !== 'OPEN' || isInitialized ) {
		return;
	}

	isInitialized = true;

	const userName = 'user/' + ds.getUid();

	const p2pConnection = new SimplePeer({
		initiator: document.location.hash === '#initiator',
		stream: $( '.output-canvas canvas' )[ 0 ].captureStream()
	});

	p2pConnection.on( 'signal', signal => {
		ds.event.emit( 'rtc-signal-03', {
			sender: userName,
			signal: signal
		});
	});

	ds.event.subscribe( 'rtc-signal-03', msg => {
		if( msg.sender !== userName ) {
			p2pConnection.signal( msg.signal );
		}
	});

	p2pConnection.on( 'stream', remoteStream => {
		$( '.remote video' ).attr( 'src', URL.createObjectURL( remoteStream ) );
	});
}