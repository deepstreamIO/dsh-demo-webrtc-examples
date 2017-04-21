const log = msg => {
	$( '.output' ).append( '<li>' + msg + '</li>' );
};

log( 'connecting to deepstreamHub' );

const ds = deepstream( 'wss://013.deepstreamhub.com?apiKey=d02f8752-7d26-4cf0-965a-90c21536410f' ).login( null, success => {

	const userName = 'user/' + ds.getUid();
	const isInitiator = document.location.hash === '#initiator';
	const BYTES_PER_CHUNK = 1200;

	log( 'connected to deepstreamHub' );

	log( `${isInitiator ? 'initiating' : 'awaiting'} peer connection as ${userName}` );

	/**
	 * Connection
	 */
	const p2pConnection = new SimplePeer({
		initiator: isInitiator
	});

	p2pConnection.on( 'error', error => {
		log( 'error: ' + error );
	});

	p2pConnection.on( 'signal', signal => {
		signal.sdp = signal.sdp.replace( 'b=AS:30', 'b=AS:1638400' );
		ds.event.emit( 'rtc-signal', {
			sender: userName,
			signal: signal
		});
	});

	ds.event.subscribe( 'rtc-signal', msg => {
		if( msg.sender !== userName ) {
			p2pConnection.signal( msg.signal );
		}
	});

	p2pConnection.on( 'connect', () => {
		log( 'webrtc datachannel connected' );
	});

	p2pConnection.on( 'close', () => {
		log( 'webrtc datachannel closed' );
	});

	var incomingFileInfo;
	var incomingFileData;
	var bytesReceived;
	var downloadInProgress = false;

	p2pConnection.on( 'data', data => {
		if( downloadInProgress === false ) {
			startDownload( data );
		} else {
			progressDownload( data );
		}
	});

	function startDownload( data ) {
		incomingFileInfo = JSON.parse( data.toString() );
		incomingFileData = [];
		bytesReceived = 0;
		downloadInProgress = true;
		log( 'incoming file <b>' + incomingFileInfo.fileName + '</b> of ' + incomingFileInfo.fileSize + ' bytes' );
	}

	function progressDownload( data ) {
		bytesReceived += data.byteLength;
		incomingFileData.push( data );
		log( 'progress: ' +  ((bytesReceived / incomingFileInfo.fileSize ) * 100).toFixed( 2 ) + '%' );
		if( bytesReceived === incomingFileInfo.fileSize ) {
			endDownload();
		}
	}

	function endDownload() {
		downloadInProgress = false;
		var blob = new window.Blob( incomingFileData );
		var anchor = document.createElement( 'a' );
		anchor.href = URL.createObjectURL( blob );
		anchor.download = incomingFileInfo.fileName;
		anchor.textContent = 'XXXXXXX';

		if( anchor.click ) {
			anchor.click();
		} else {
			var evt = document.createEvent( 'MouseEvents' );
			evt.initMouseEvent( 'click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null );
			anchor.dispatchEvent( evt );
		}
	}

	/**
	 * File Handling
	 */
	var file;
	var currentChunk;

	var fileInput = $( 'input[type=file]' );
	var fileReader = new FileReader();

	fileReader.onload = sendNextChunk;
	fileInput.on( 'change', startUpload );

	function startUpload() {
		file = fileInput[ 0 ].files[ 0 ];
		log( 'sending ' + file.name + ' of ' + file.size + ' bytes' );
		currentChunk = 0;
		p2pConnection.send(JSON.stringify({
			fileName: file.name,
			fileSize: file.size
		}));
		readNextChunk();
	}

	function readNextChunk() {
		var start = BYTES_PER_CHUNK * currentChunk;
		var end = Math.min( file.size, start + BYTES_PER_CHUNK );
		fileReader.readAsArrayBuffer( file.slice( start, end ) );
	}

	function sendNextChunk() {
		p2pConnection.send( fileReader.result );
		currentChunk++;

		if( BYTES_PER_CHUNK * currentChunk < file.size ) {
			readNextChunk();
		}
	}
});