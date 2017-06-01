$(function(){

	function getScreen( sourceId ) {
		var constraints = {
			mandatory: {
				chromeMediaSource: 'desktop',
				maxWidth: screen.width > 1920 ? screen.width : 1920,
				maxHeight: screen.height > 1080 ? screen.height : 1080,
				chromeMediaSourceId: sourceId
			},
			optional: [
				{ googTemporalLayeredScreencast: true }
			]
		};
		navigator.getUserMedia({video:constraints},
			stream => {
				$('video#local').attr( 'src', URL.createObjectURL( stream ) );
			},
			error => {
				console.log( error );
			}
		);
	}

	window.addEventListener("message", function(msg){
		if( !msg.data ) {
			return;
		} else if ( msg.data.sourceId ) {
			getScreen( msg.data.sourceId );
		} else if( msg.data.addonInstalled ) {
			$( '#addon-not-found' ).hide();
			$( '#share-my-screen' ).removeAttr( 'disabled' );
		}
	}, false);

	if( document.location.host !== 'deepstreamhub.com' ) {
		$( '#domain-warning' ).show();
	} else {
		$( '#domain-warning' ).hide();
		window.postMessage( 'check-addon-installed', '*' )
	}

	$( '#share-my-screen' ).click(function(){
		window.postMessage('requestScreenSourceId', '*' );
	})
});