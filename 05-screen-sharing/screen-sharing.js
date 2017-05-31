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
				var vid = $( '<video autoplay></video>')
				vid.attr( 'src', URL.createObjectURL( stream ) );
				$('body').append( vid );
	
			},
			error => {
				console.log( error );
			}
		);
	}
	

	window.addEventListener("message", function(msg){
		if( msg.data && msg.data.sourceId ) {
			getScreen( msg.data.sourceId );
		}
	}, false);

	window.postMessage('requestScreenSourceId', '*' )
}); 