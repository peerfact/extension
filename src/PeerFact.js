//Scripts to inject into the page
injectJs(chrome.extension.getURL('jquery.js'));
injectJs(chrome.extension.getURL('firebase.js'));
injectJs(chrome.extension.getURL('PeerFactCommunicator.js'));
injectJs(chrome.extension.getURL('PeerFactInjected.js'));

//Settings
var firebaseDirectHost = "https://peerfact.firebaseio.com";
var firebaseCDNHost = "https://d15m3c3cf3s94d.cloudfront.net";
var authData = null;
var backendErrors = 0;

(function () {
	//Check if we are still authed
	var authRef = new Firebase(firebaseDirectHost);
	authData = authRef.getAuth();
	//authRef.unauth();

	//Events from the injected script
	PeerFactCommunicator.recv("content", function (type, data) {
		switch (type) {
			case "oauth":
				//Got oauth token credentials! -- set up firebase with credentials
				var authRef = new Firebase(firebaseDirectHost);
				authRef.authWithOAuthToken("facebook", data.authData.facebook.accessToken, function(error, _authData) {
					authData = _authData;
				});

				break;
		}
	});
	
	//Find all relavent DOM elements in a newly-inserted node
	function domNodeInserted (e) {
		//Shut off the service if we are getting too many errors
		if (backendErrors >= 10) return;

		//Find all candidates
		$(e).find(PeerFactSelectors.getRootSelector()).each(function () {
			var post = new PeerFactPost($(this));
			var postid = post.getPostId();
			if (!post.hasBeenStyled() && post.canBeStyled() && postid != null) {
				//If we are here then the post is valid has not been PeerFact-ified
				PeerFactPostData.fetch(postid).then(function (postData) {
					post.updateData(postData);
					post.styleIt();
				}).catch(function () {
					backendErrors++;
				});
			}
		});
	}
	
	//Watch for DOM changes
	new MutationObserver (function (records) {
		for (var i = 0; i < records.length; i++) {
			if (records[i].type == "childList") {
				for (var o = 0; o < records[i].addedNodes.length; o++) {
					domNodeInserted(records[i].addedNodes[o]);
				}
			}
		}
	}).observe(document.documentElement, {
		childList: true,
		subtree: true
	});
	domNodeInserted(document.documentElement);
	setInterval(function () { domNodeInserted(document.documentElement); }, 5000);	//In case we miss anything, run a check every 5 seconds

	//Decrement errors every minute in case the service gets restored
	setInterval(function () { if (backendErrors > 0) backendErrors--; }, 60*1000);
})();