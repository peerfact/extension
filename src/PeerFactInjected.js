if (window.location.pathname == "/robots.txt") document.documentElement.innerHTML = "Authenticating...";

function scriptsReady (func) {
	//Need all scripts to be available
	var readyInt = setInterval(function () {
		if (window.PeerFactCommunicator != null && window.$ != null) {
			clearInterval(readyInt);
			func();
		}
	}, 100);
}

(function () {
	function init () {
		PeerFactCommunicator.recv("facebook", function (type, data) {
			switch (type) {
				case "comment":
					require('UFIUserActions').addComment(data.postid, data.text, data.text, {
						source: 21
					});

					break;
			}
		});
	}

	scriptsReady(init);
})();
