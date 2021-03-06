/**
 * Check if the supplied host falls under the apex domain.
 */
function checkHost (host, apex) {
	var strpos = host.indexOf(apex);
	return strpos != -1 && strpos == host.length - apex.length;
}

function PeerFactPost ($root, manifest) {
	this.$root = $root;
	this.$insertionPoint = $root.find(manifest.postInsertSelector);
	this.manifest = manifest;
}

PeerFactPost.prototype.refresh = function () {
	var self = this;

	if (this.hasBeenStyled()) return;	//Already been styled

	var type = this.checkPost();
	if (type != null) {
		fetch('https://www.peerfact.xyz/hosts/' + type.apex + '.json').then(function (res) {
			return res.json();
		}).then(function (domainInfo) {
			self.styleIt(type, domainInfo);
		});
	}

	//Always mark it as processed
	this.markVisited();
};

/**
 * Perform a check to see if this post is fake news or not.
 */
PeerFactPost.prototype.checkPost = function () {
	var self = this;

	var anchors = this.$root.find(this.manifest.linkSelector);
	for (var i = 0; i < anchors.length; i++) {
		var url = new URL($(anchors.get(i)).attr("href"));
		if (url) {
			//Sometimes facebook wraps this value
			if (checkHost(url.host, "facebook.com") && url.searchParams.has("u")) {
				url = new URL(url.searchParams.get("u"));
			}
			function checkType (type) {
				for (var o = 0; o < self.manifest[type].length; o++) {
					var apex = self.manifest[type][o].host;
					if (checkHost(url.host, apex)) {
						//Found a fake news source.. style this
						return { apex:apex, type:type };
					}
				}

				return null;
			}
			var typesToCheck = ["fakenews", "satire"];
			for (var o = 0; o < typesToCheck.length; o++) {
				var result = checkType(typesToCheck[o]);
				if (result != null) {
					return result;
				}
			}
		}
	}

	return null;
};

PeerFactPost.prototype.hasBeenStyled = function () {
	return this.$root.hasClass("peerfact-post");
};

PeerFactPost.prototype.markVisited = function () {
	//Primary identifier class
	this.$root.addClass("peerfact-post");
};

PeerFactPost.prototype.styleIt = function (info, domainInfo) {
	var self = this;
	var boxText = "";
	var commentText = "";
	var detailsLink = "https://www.peerfact.xyz/details.html?domain=" + encodeURIComponent(info.apex);

	this.$root.addClass("peerfact-" + info.type);

	switch (info.type) {
		case "fakenews":
			boxText = "WARNING! " + domainInfo.title + " is a known fake news site.";
			commentText = domainInfo.title + " is a known fake news site. See " + detailsLink + " for details.";
		case "satire":
			boxText = "Heads up! " + domainInfo.title + " is satire. Don't take it literally. :)";
			commentText = domainInfo.title + " is satire. See " + detailsLink + " for details.";
	}

	this.$insertionPoint.prepend("<div class='peerfact-box'><div class='peerfact-description'>" + boxText + "</div><div><a class='peerfact-link-button' href='" + detailsLink + "' target='_blank'>Details</a><a class='peerfact-link-button peerfact-do-comment' href='#'>Comment this to Others</a></div></div>");
	this.$insertionPoint.find(".peerfact-do-comment").click(function (e) {
		e.preventDefault();

		var postId = self.getPostId();
		if (postId) {
			PeerFactCommunicator.send("facebook", "comment", { postid:postId, text:commentText });
		} else {
			self.$insertionPoint.find(".peerfact-box").append("<div class='peerfact-error'>An error occurred. Sorry we couldn't post for you. You can copy + paste this manually if you like: <strong>" + commentText + "</strong></div>");
		}
	});
};

PeerFactPost.prototype.getPostId = function () {
	return this.$root.find("*[name=ft_ent_identifier]").val();
};
