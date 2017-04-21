const ds = deepstream( 'wss://013.deepstreamhub.com?apiKey=d02f8752-7d26-4cf0-965a-90c21536410f' ).login();
const localUserName = ds.getUid();
const users = ds.record.getList( 'users' );
const connections = {};
const input = $('input');

$('form').on('submit', () => {
	var val = input.val();
	for( var username in connections ) {
		connections[ username ].send( val );
	}
	input.val('').focus();
});

ds.event.subscribe( `rtc-signal/${localUserName}`, msg => {
	if( connections[ msg.user ] ) {
		connections[ msg.user ].processSignal( msg.signal );
	}
});

users.addEntry( localUserName );

users.subscribe( userNames => {
	userNames.forEach( userName => {
		if( connections[ userName ] ) return;
		if( userName === localUserName ) return;
		connections[ userName ] = new Connection( userName );
	})

	for( var userName in connections ) {
		if( userNames.indexOf( userName ) === -1 ) {
			connections[ userName ].destroy();
		}
	}
});

const log = msg => {
	$( '.output' ).append( '<li>' + msg + '</li>' );
};

log( 'connecting to deepstreamHub' );
log( `this is user ${localUserName}` );

class Connection{
	constructor( remoteUserName ) {
		log( `Opening connection to ${remoteUserName}` );

		this._remoteUserName = remoteUserName;
		this._isConnected = false;
		this._p2pConnection = new SimplePeer({
			initiator: localUserName > remoteUserName,
			trickle: false
		});
		this._p2pConnection.on( 'signal', this._onOutgoingSignal.bind( this ) );
		this._p2pConnection.on( 'error', this._onError.bind( this ) );
		this._p2pConnection.on( 'connect', this._onConnect.bind( this ) );
		this._p2pConnection.on( 'close', this._onClose.bind( this ) );
		this._p2pConnection.on( 'data', this._onData.bind( this ) );
		setTimeout( this._checkConnected.bind( this ), 7000 );
	}

	processSignal( signal ) {
		this._p2pConnection.signal( signal );
	}

	send( msg ) {
		this._p2pConnection.send(msg);
	}

	destroy() {
		this._p2pConnection.destroy();
	}

	_onOutgoingSignal( signal ) {
		ds.event.emit( `rtc-signal/${this._remoteUserName}` , {
			user: localUserName,
			signal: signal 
		});
	}

	_onConnect() {
		this._isConnected = true;
		log( 'connected to ' + this._remoteUserName );
	}

	_onClose() {
		log( `connection to ${this._remoteUserName} closed` );
		delete connections[ this._remoteUserName ];
		users.removeEntry( this._remoteUserName );
	}

	_checkConnected() {
		if( !this._isConnected ) {
			this.destroy();
		}
	}

	_onData( data ) {
		log( `received message from ${this._remoteUserName}: <b>${data.toString()}</b>` );
	}

	_onError( error ) {
		log( `an error occured ${error.toString()}` );
	}
}