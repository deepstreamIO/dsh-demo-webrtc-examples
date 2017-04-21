var localStream, ds, isInitialized = false;

navigator.getUserMedia(
	{ video: true, audio: true },
	stream => {
		localStream = stream;
		$( '.local video' ).attr( 'src', URL.createObjectURL( stream ) );
		init();
	},
	error => {
		alert( 'error while accessing usermedia ' + error.toString() );
	}
);

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
		stream: localStream
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

