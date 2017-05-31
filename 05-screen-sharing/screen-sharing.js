$(function(){
	// var addonUrl = 'https://chrome.google.com/webstore/detail/ajhifddimkapgcifgcodmmfdlknahffk';

	// $('#install-addon').click(function(){
	// 	chrome.webstore.install( addonUrl, function(){
	// 		console.log( 'addon installed' );
	// 	}, function(){
	// 		console.log( 'addon failed' );
	// 	});
	// });
	// 
	// 
	navigator.getUserMedia({ video: true, audio: true },
		stream => {
			$( '.local video' ).attr( 'src', URL.createObjectURL( stream ) );
		},
		error => {
			console.log( 'error while accessing usermedia', error.toString() );
		}
	);

	window.addEventListener("message", function(msg){
	console.log( 'received message', arguments );
}, false);

window.postMessage('get-sourceId', '*' )
});


screen_constraints.mandatory.chromeMediaSourceId

 var screen_constraints = {
    mandatory: {
        chromeMediaSource: DetectRTC.screen.chromeMediaSource,
        maxWidth: screen.width > 1920 ? screen.width : 1920,
        maxHeight: screen.height > 1080 ? screen.height : 1080,
        chromeMediaSourceId: sourceId
        // minAspectRatio: 1.77
    },
    optional: [{ // non-official Google-only optional constraints
        googTemporalLayeredScreencast: true
    }, {
        googLeakyBucket: true
    }]
};