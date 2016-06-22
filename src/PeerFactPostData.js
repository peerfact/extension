function PeerFactPostData (data) {
	this.postid = data.postid;
	if (data.votes != null) this.votes = data.votes;
	else this.votes = {};
}

PeerFactPostData.prototype.getPostSummary = function () {
	var summary = { votes: 0, fact: 0, fiction: 0, misleading: 0, sponsored: 0, type: null };
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
