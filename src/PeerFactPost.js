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
		this.$root.removeClass("peerfact-fact peerfact-fiction peerfact-misleading peerfact-sponsored");
		var summary = this.data.getPostSummary();
		if (summary.votes > 0) {
			this.$root.addClass("peerfact-" + summary.type);
		}

		//Do collapse text update
		this._updateExpandLabel();

		//Update best detected proof
		var bestProof = this.data.getBestProof();
		if (bestProof != null) this.$bestProof.html('<p>Best Proof: <a target="_blank" href="' + PeerFactPostData.formatUrl(bestProof, summary.type) + '">' + PeerFactPostData.formatUrl(bestProof, summary.type) + '</a></p>');
		else this.$bestProof.empty();
	}
};

PeerFactPost.prototype._updateExpandLabel = function () {
	var summary = this.data.getPostSummary();
	var collapse = this.$peerfactRoot.hasClass("peerfact-box-details-open");
	this.$expandLabel.text("PeerFact (" + summary.fact + " fact, " + summary.misleading + " misleading, " + summary.fiction + " fiction, " + summary.sponsored + " sponsored, " + summary.votes + " vote" + (summary.votes > 1 ? "s" : "") + ") [" + (collapse ? "-" : "+") + "]");
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
	this.$insertionPoint.after('<div class="peerfact-box"><div><a href="#" class="peerfact-expand">PeerFact [+]</a></div><div class="peerfact-details"><div class="peerfact-best-proof"></div><input placeholder="Paste Proof Link (Optional.. but recommended)" class="peerfact-reason"><div class="peerfact-proof-error"></div><label class="peerfact-checkbox"><input type="checkbox" checked="checked"> Post Proof to Comments</label><div class="peerfact-btns"><a href="#" class="peerfact-btn peerfact-btn-fact" data-type="fact">Factual</a><a href="#" class="peerfact-btn peerfact-btn-misleading" data-type="misleading">Misleading</a><a href="#" class="peerfact-btn peerfact-btn-fiction" data-type="fiction">Fictional</a><a href="#" class="peerfact-btn peerfact-btn-sponsored" data-type="sponsored">Sponsored Content</a></div><div class="peerfact-footer"><a href="http://www.peerfact.xyz/" target="_blank">PeerFact</a> is designed to combat the misinformation present all over social media. The service becomes stronger the more people use it, so please spread the word!<br><br><b>Types of Content</b><br><br><b>Fact</b> The post is factual. All information is completely correct.<br><br><b>Misleading</b> The post is technically correct, but is inferring something that is not factual. For example, nitpicking a dataset to prove some larger issue.<br><br><b>Fiction</b> The post is false.<br><br><b>Sponsored Content</b> The post is content that has been paid for by a company to promote a product or service.<br><br>PeerFact is 3rd party software and is not associated with Facebook in any way. This is an early version so expect more features in the near future!</div></div></div>');
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
			self.data.updateMyVote(type, val).then(function () {
				self.updateData();
			});
		} else {
			//Need to authenticate
			console.log("Not authenticated. Popping up an auth window...");
			self.data.doAuth().then(function () {
				return self.data.updateMyVote(type, val);
			}).then(function () {
				self.updateData();
			});
		}
		
		//Send to the injected script
		if (self.$commentCheckbox.prop("checked") && val) {
			var commentText = "";
			switch (type) {
				case "fact": commentText = "Post marked as FACT by PeerFact. Link to proof: "; break;
				case "misleading": commentText = "Post marked as MISLEADING by PeerFact. Link to explanation: "; break;
				case "fiction": commentText = "Post marked as FICTION by PeerFact. Link to proof: "; break;
			}

			PeerFactCommunicator.send("facebook", "comment", { postid:self.getPostId(), text:commentText + PeerFactPostData.formatUrl(val, type) });
		}
	});

	//Set the post data if available
	this.updateData();
};

PeerFactPost.prototype.getPostId = function () {
	return PeerFactSelectors.getPostId(this.$root);
};