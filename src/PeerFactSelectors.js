/**
 * These are used to find and inject PeerFact into the page. Likely these will change over time as Facebook
 * gets updates. Make them as FLEXIBLE as possible to minimize breakage.
 *
 * TODO load selectors from firebase to allow for quick updates.
 */
var PeerFactSelectors = {

	/**
	 * The main selector to find a post to inject in to.
	 */
	getRootSelector: function () {
		return "*[data-ft]";
	},

	/**
	 * Where to inject the PeerFact box?
	 */
	getInsertAfterSelector: function () {
		return ".userContentWrapper > *:first-child";
	},

	/**
	 * Return a URL object that represents the main point of this post.
	 * Returns null if no valid url is found.
	 */
	getPrimaryHref: function ($root) {
		//Check for media shares
		var anchors = $root.find("a");
		for (var i = 0; i < anchors.length; i++) {
			var href = $(anchors.get(i)).attr("href");
			if (href) {
				return new URL(href);
			}
		}

		return null;
	}

};
