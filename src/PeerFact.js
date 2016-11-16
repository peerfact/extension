//Scripts to inject into the page
injectJs(chrome.extension.getURL('jquery.js'));
injectJs(chrome.extension.getURL('PeerFactCommunicator.js'));
injectJs(chrome.extension.getURL('PeerFactInjected.js'));

function init (manifest) {
	//Find all relavent DOM elements in a newly-inserted node
	function domNodeInserted (e) {
		//Find all candidates
		$(e).find(manifest.postSelector).each(function () {
			var post = new PeerFactPost($(this), manifest);
			post.refresh();
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
}

//First fetch the root info
fetch('https://www.peerfact.xyz/hosts.json').then(function (res) {
	return res.json();
}).then(init);
