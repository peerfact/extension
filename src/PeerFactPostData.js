var PeerFactTypes = [
	{
		name:'fact',
		label: 'Fact',
		description: 'The post is factual. All information is completely correct.'
	},
	{
		name:'misleading',
		label: 'Misleading',
		description: 'The post is technically correct, but is inferring something that is not factual. For example, nitpicking a dataset to prove some larger issue.'
	},
	{
		name:'fiction',
		label: 'Fiction',
		description: 'The post is false.'
	},
	{
		name:'sponsored',
		label: 'Sponsored Content',
		description: 'The post is content that has been paid for by a company to promote a product or service.'
	},
	{
		name:'questionable',
		label: 'Questionable',
		description: 'The post has questionable content, but you don\'t have enough information to say one way or another.'
	}
];

function PeerFactPostData (data) {
	this.postid = data.postid;
	if (data.votes != null) this.votes = data.votes;
	else this.votes = {};
}

PeerFactPostData.prototype.getPostSummary = function () {
	var summary = { votes: 0, type: null };
	PeerFactTypes.forEach(function (type) {
		summary[type.name] = 0;
	});
	for (var i in this.votes) {
		var vote = this.votes[i];

		summary.votes++;
		summary[vote.type]++;

		if (summary.type == null || (vote.type != summary.type && summary[vote.type] > summary[summary.type])) {
			summary.type = vote.type;
		}
	}
	return summary;
};

/**
 * Find the URL that appears the most.
 */
PeerFactPostData.prototype.getBestProof = function () {
	var proofs = {};
	var leadingType = this.getPostSummary().type;
	for (var i in this.votes) {
		if (this.votes[i].proof) {
			var url = new URL(this.votes[i].proof);
			var href = "http://" + url.hostname + url.pathname;
			if (this.votes[i].type === leadingType) {
				var count = proofs[href] || 0;
				proofs[href] = count + 1;
			}
		}
	}
	var proofMax = null;
	for (var i in proofs) {
		if (proofMax == null || proofs[proofMax] < proofs[i]) proofMax = i;
	}
	return proofMax;
};

PeerFactPostData.prototype.updateMyVote = function (type, proof) {
	var self = this;
	function doVote () {
		var authData = PeerFactAuth.getAuthToken();
		var newVote = {
			type: type,
			proof: proof,
			uid: authData.uid
		};
		var ref = new Firebase(firebaseDirectHost + '/posts/' + self.postid + '/votes/' + authData.uid);
		return new Promise(function (resolve, reject) {
			ref.set(newVote, function (error) {
				if (error) {
					reject(error);
				} else {
					self.votes[authData.uid] = newVote;
					resolve();
				}
			});
		});
	}
	if (PeerFactAuth.isAuth()) {
		//Already authed -- send the data
		return doVote();
	} else {
		//Need to authenticate
		console.log("Not authenticated. Popping up an auth window...");
		PeerFactAuth.doAuth().then(function () {
			return doVote();
		});
	}
};

/**
 * Check if this post can be auto-classified.
 */
PeerFactPostData.prototype.checkAuto = function (imageUrl) {
	var self = this;
	return PeerFactAuto.checkImage(this.postid, imageUrl).then(function (data) {
		self.auto = data;
	});
}

/**
 * Fetch PeerFact data from a postid. This is a common request. Do lots of caching behind a CDN because this is a very common request.
 */
PeerFactPostData.fetch = function (postid) {
	return new Promise (function (resolve, reject) {
		$.ajax({
			url: firebaseCDNHost + "/posts/" + postid + "/votes.json",
			data: null,
			success: function (data) {
				resolve(new PeerFactPostData({ postid:postid, votes:data }));
			},
			error: function (jqXHR, textStatus, errorThrown) {
				reject(textStatus);
			},
			dataType: "json"
		});
	});
};

/**
 * Make a PeerFact URL.
 */
PeerFactPostData.formatUrl = function (url, type) {
	if (type == null) type = "proof";
	return "http://www.peerfact.xyz/" + type + ".html?url=" + encodeURIComponent(url);
};

/**
 * Is the provided proof valid?
 */
PeerFactPostData.isValidProof = function (url) {
	try {
		new URL(url);
		return true;
	} catch (e) {
		return false;
	}
};
