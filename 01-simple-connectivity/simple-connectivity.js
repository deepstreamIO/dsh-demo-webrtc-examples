const log = msg => {
	$( '.output' ).append( '<li>' + msg + '</li>' );
};

log( 'connecting to deepstreamHub' );

const dshUrl = 'wss://013.deepstreamhub.com?apiKey=d02f8752-7d26-4cf0-965a-90c21536410f';

/*
 * Establish a connection to deepstreamHub
 */
const ds = deepstream( dshUrl ).login( null, success => {

	/*
	 * We'll create a random username that only exists for the duration
	 * of this session. It's only used to make sure we're not processing
	 * our own events
	 */
	const userName = 'user/' + ds.getUid();

	/*
	 * WebSocket connections have to be awaited by one side and initiated by the other.
	 * To keep things simple we check if this window's url ends in '#initiator'
	 */
	const isInitiator = document.location.hash === '#initiator';

	log( 'connected to deepstreamHub' );

	log( `${isInitiator ? 'initiating' : 'awaiting'} peer connection as ${userName}` );

	/*
	 * Let's open a peer connection with the minimal amout of configuration
	 */
	const p2pConnection = new SimplePeer({
		initiator: isInitiator
	});

	p2pConnection.on( 'error', error => {
		log( 'error: ' + error );
	});

	/*
	 * This event will be emitted when our peer connection wants to
	 * send a signal to the other side
	 */
	p2pConnection.on( 'signal', signal => {

		/*
		 * We'll use deepstreamHub's publish/subscribe mechanism to
		 * send session establishment data back and forth between the peers
		 */
		ds.event.emit( 'rtc-signal', {
			sender: userName,
			signal: signal
		});
	});

	/*
	 * When receiving a signal check its
	 * from the remote peer
	 */
	ds.event.subscribe( 'rtc-signal', msg => {
		if( msg.sender !== userName ) {
			p2pConnection.signal( msg.signal );
		}
	});

	/*
	 * We'll send a message to the other side as soon as
	 * the connection is established
	 */
	p2pConnection.on( 'connect', () => {
		log( 'webrtc datachannel connected' );
		p2pConnection.send( 'Hello from user ' + userName );
	});

	p2pConnection.on( 'close', () => {
		log( 'webrtc datachannel closed' );
	});

	p2pConnection.on( 'data', data => {
		log( 'received data <b>' + data + '</b>' );
	});
});
