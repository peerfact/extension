function PeerFactPost ($root, data) {
	this.$root = $root;
	this.$insertionPoint = this.$root.find(PeerFactSelectors.getInsertAfterSelector());
	if (this.$insertionPoint.length >= 2) this.$insertionPoint = $(this.$insertionPoint.get(1));
	this.domData = $root.data("ft");

	this.updateData(data);
}

PeerFactPost.prototype.updateData = function (data) {
	if (data != null) this.data = data;

	if (this.data != null && this.hasBeenStyled()) {
		//Do coloring
		this.$root.removeClass("peerfact-fact peerfact-fiction peerfact-misleading");
		var summary = this.data.getPostSummary();
		if (summary.votes > 0) {
			this.$root.addClass("peerfact-" + summary.type);
		}

		//Do collapse text update
		this._updateExpandLabel();

		//Update best detected proof
		var bestProof = this.data.getBestProof();
		if (bestProof != null) this.$bestProof.html('<p>Best Proof: <a target="_blank" href="' + PeerFactPostData.formatUrl(bestProof) + '">' + PeerFactPostData.formatUrl(bestProof) + '</a></p>');
		else this.$bestProof.empty();
	}
};

PeerFactPost.prototype._updateExpandLabel = function () {
	var summary = this.data.getPostSummary();
	var collapse = this.$peerfactRoot.hasClass("peerfact-box-details-open");
	this.$expandLabel.text("PeerFact (" + summary.fact + " fact, " + summary.misleading + " misleading, " + summary.fiction + " fiction, " + summary.votes + " vote" + (summary.votes > 1 ? "s" : "") + ") [" + (collapse ? "-" : "+") + "]");
};

PeerFactPost.prototype.hasBeenStyled = function () {
	return this.$root.hasClass("peerfact-post");
};

PeerFactPost.prototype.canBeStyled = function () {
	return this.$insertionPoint.length > 0;
};

PeerFactPost.prototype.styleIt = function () {
	var self = this;

	//Primary identifier class
	this.$root.addClass("peerfact-post");

	//Main styling and add in all important element references
	this.$insertionPoint.after('<div class="peerfact-box"><div><a href="#" class="peerfact-expand">PeerFact [+]</a></div><div class="peerfact-details"><div class="peerfact-best-proof"></div><input placeholder="Paste Proof Link (Optional.. but recommended)" class="peerfact-reason"><div class="peerfact-proof-error"></div><label class="peerfact-checkbox"><input type="checkbox" checked="checked"> Post Proof to Comments</label><div class="peerfact-btns"><a href="#" class="peerfact-btn peerfact-btn-fact" data-type="fact">Post is Factual</a><a href="#" class="peerfact-btn peerfact-btn-misleading" data-type="misleading">Post is Misleading</a><a href="#" class="peerfact-btn peerfact-btn-fiction" data-type="fiction">Post is Fictional</a></div><div class="peerfact-footer"><a href="http://www.peerfact.xyz/" target="_blank">PeerFact</a> is designed to combat the misinformation present all over social media. The service becomes stronger the more people use it, so please spread the word!<br><br>PeerFact is 3rd party software and is not associated with Facebook in any way. This is an early version so expect more features in the near future!</div></div></div>');
	this.$peerfactRoot = this.$root.find(".peerfact-box");
	this.$expandLabel = this.$root.find(".peerfact-expand");
	this.$bestProof = this.$root.find(".peerfact-best-proof");
	this.$proofUrl = this.$root.find(".peerfact-reason");
	this.$commentCheckbox = this.$root.find(".peerfact-checkbox input");
	this.$proofError = this.$root.find(".peerfact-proof-error");

	//Event listeners
	this.$expandLabel.on("click", function (e) {
		e.preventDefault();
		
		self.$peerfactRoot.toggleClass("peerfact-box-details-open");
		self._updateExpandLabel();
	});
	this.$peerfactRoot.on("click", ".peerfact-btn", function (e) {
		e.preventDefault();
		
		var val = self.$proofUrl.val();
		self.$proofUrl.val("");
		var type = $(e.currentTarget).data("type");

		if (val && !PeerFactPostData.isValidProof(val)) {
			self.$proofError.text("Proof must be a valid url.");
			return;
		} else {
			self.$proofError.text("");
		}

		if (authData != null) {
			//Already authed -- send the data
			self.data.updateMyVote(type, val);
			self.updateData();
		} else {
			//Need to authenticate
			self.data.doAuth().then(function () {
				self.data.updateMyVote(type, val);
				self.updateData();
			});
		}
		
		//Send to the injected script
		if (self.$commentCheckbox.prop("checked") && val) {
			PeerFactCommunicator.send("facebook", "comment", { postid:self.getPostId(), text:PeerFactPostData.formatUrl(val) });
		}
	});

	//Set the post data if available
	this.updateData();
};

PeerFactPost.prototype.getPostId = function () {
	return PeerFactSelectors.getPostId(this.$root);
};