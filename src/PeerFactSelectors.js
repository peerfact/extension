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

	getPostType: function ($root) {
		//TODO may want to target different postids based on the type of post
		//IE if someone posts a status we target that status, but if someone reshares a popular post we should use the original postid
	},

	/**
	 * Will return null if we can't find a valid postid.
	 */
	getPostId: function ($root) {
		//First check if this post is a reference to another post or not
		var isReference = $root.find(".userContentWrapper").length >= 2;
		if (isReference) {
			var potentialId = $root.find("input[name='ft_ent_identifier']").val();
			if (potentialId != null) {
				return potentialId;
			}
		}

		//Check for media shares
		var anchors = $root.find("a");
		for (var i = 0; i < anchors.length; i++) {
			var href = $(anchors.get(i)).attr("href");
			if (href) {
				var regexs = [
					/\/videos\/([0-9]+)\//,
					/\/photos\/[^\/]+\/([0-9]+)\//
				];
				for (var o = 0; o < regexs.length; o++) {
					var matches = href.match(regexs[o]);
					if (matches != null) {
						return matches[1];
					}
				}
			}
		};

		//Next check for common id params
		var possiblePostidKeys = [
			//"top_level_post_id",
			"qid",
			"tl_objid"
		];
		var data = $root.data("ft");
		for (var i = 0; i < possiblePostidKeys.length; i++) {
			if (data[possiblePostidKeys[i]] != null) return data[possiblePostidKeys[i]]; 
		}

		return null;
	}

};