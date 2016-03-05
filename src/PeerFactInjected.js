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
				case "oauth":
					//An oauth window is open -- keep checking for valid login
					//Start polling for authentication every second, give up after 2 minutes
					var tries = 0;
					var intId = setInterval(function () {
						var authData = null;
						try {
							authData = JSON.parse(window.localStorage.getItem("firebase:session::peerfact"));
						} catch (e) {}
						if (authData != null) {
							clearInterval(intId);

							PeerFactCommunicator.send("content", "oauth", { authData:authData });
						} else {
							tries++;

							if (tries >= 120) {
								clearInterval(intId);
								reject("Auth timed out.");
							}
						}
					}, 1000);

					break;
			}
		});

		if (window.location.pathname == "/robots.txt") {
			var authRef = new Firebase("https://peerfact.firebaseio.com");
			var authData = authRef.getAuth();
			if (authData == null) {
				authRef.authWithOAuthRedirect("facebook", function (error, authData) {
					document.documentElement.innerHTML = "You are authenticated. Close this window.";
				});
			} else {
				document.documentElement.innerHTML = "You are authenticated. Close this window.";
			}
		}
	}

	scriptsReady(init);
})();