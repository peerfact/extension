function PeerFactPost ($root, manifest) {
	this.$root = $root;
	this.manifest = manifest;
}

PeerFactPost.prototype.refresh = function () {
	if (this.hasBeenStyled()) return;	//Already been styled

	var primaryHref = PeerFactSelectors.getPrimaryHref(this.$root);
	for (var i = 0; i < this.manifest.fakenews.length; i++) {
		var host = this.manifest.fakenews[i];
		var strpos = primaryHref.host.indexOf(host);
		if (strpos != -1 && strpos == primaryHref.host.length - host.length) {
			//Found a fake news source.. style this
			this.styleIt("fakenews");

			break;
		}
	}

	//Always mark it as processed
	this.markVisited();
};

PeerFactPost.prototype.hasBeenStyled = function () {
	return this.$root.hasClass("peerfact-post");
};

PeerFactPost.prototype.markVisited = function () {
	//Primary identifier class
	this.$root.addClass("peerfact-post");
};

PeerFactPost.prototype.styleIt = function (type) {
	var self = this;

	//Main styling and add in all important element references
	this.$root.addClass("peerfact-fakenews");
};
