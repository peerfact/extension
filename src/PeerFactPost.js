function PeerFactPost ($root, data) {
	this.$root = $root;
	this.$insertionPoint = this.$root.find(PeerFactSelectors.getInsertAfterSelector());
	if (this.$insertionPoint.length >= 2) this.$insertionPoint = $(this.$insertionPoint.get(1));
	this.domData = $root.data("ft");

	this.updateData(data);
}

PeerFactPost.prototype.updateData = function (data) {
	var self = this;
	if (data != null) this.data = data;

	if (this.data != null && this.hasBeenStyled()) {
		//Do coloring
		PeerFactTypes.forEach(function (type) {
			self.$root.removeClass("peerfact-" + type.name);
		});
		var summary = this.data.getPostSummary();
		if (summary.votes > 0) {
			this.$root.addClass("peerfact-" + summary.type);
		} else if (this.data.auto != null) {
			this.$root.addClass("peerfact-" + this.data.auto.type);
		}

		//Do collapse text update
		this._updateExpandLabel();

		//Update best detected proof
		var bestProof = this.data.getBestProof();
		if (bestProof != null) this.$bestProof.html('<p>Best Proof: <a target="_blank" href="' + PeerFactPostData.formatUrl(bestProof, summary.type) + '">' + PeerFactPostData.formatUrl(bestProof, summary.type) + '</a></p>');
		else this.$bestProof.empty();

		if (this.data.auto != null) {
			this.$autoDetect.hide();
			this.$autoDetectResult.html('<a href="' + this.data.auto.url + '" target="_blank">' + this.data.auto.proof + '</a>' + '<br><br><a href="#" class="peerfact-auto-share">Share this Result</a>');
			this.$autoDetectResult.find(".peerfact-auto-share").on('click', function (e) {
				e.preventDefault();

				//Update on the server
				if (self.data.auto.type != null) {
					self.data.updateMyVote(self.data.auto.type, self.data.auto.url).then(function () {
						self.updateData();
					});
				}

				PeerFactCommunicator.send("facebook", "comment", { postid:self.getPostId(), text:self.data.auto.proof + " " + PeerFactPostData.formatUrl(self.data.auto.url, self.data.auto.type) });
			});
		}
	}
};

PeerFactPost.prototype._updateExpandLabel = function () {
	var summary = this.data.getPostSummary();
	var collapse = this.$peerfactRoot.hasClass("peerfact-box-details-open");
	var brackets = PeerFactTypes
		.filter(function (type) { return summary[type.name] !== 0; })
		.map(function (type) { return summary[type.name] + " " + type.label; })
		.join(", ");
	brackets = (brackets != "" ? (brackets + ", ") : "") + summary.votes + " vote" + (summary.votes !== 1 ? "s" : "");
	if (this.data.auto != null) {
		//No votes, but we have an auto-detect
		if (summary.votes === 0) brackets = "automatically detected as " + this.data.auto.type;
		else brackets += ", automatically detected as " + this.data.auto.type;
	}
	this.$expandLabel.text("PeerFact (" + brackets + ") [" + (collapse ? "-" : "+") + "]");
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
	var btns = PeerFactTypes.map(function (type) { return '<a href="#" class="peerfact-btn peerfact-' + type.name + '" data-type="' + type.name + '">' + type.label + '</a>'; }).join("");
	var descs = PeerFactTypes.map(function (type) { return '<b>' + type.label + '</b> ' + type.description; }).join("<br/><br/>");
	this.$insertionPoint.after('<div class="peerfact-box"><div><a href="#" class="peerfact-expand">PeerFact [+]</a></div><div class="peerfact-details"><div class="peerfact-best-proof"></div><div class="peerfact-auto"><p><b>PeerFact Auto (Experimental)</b></p><p>Automatically detect whether the post is fact or fiction.</p><a href="#" class="peerfact-auto-btn">Auto-detect</a><div class="peerfact-auto-result"></div></div><p><b>PeerFact Voting</b></p><input placeholder="Paste Proof Link (Optional.. but recommended)" class="peerfact-reason"><div class="peerfact-proof-error"></div><label class="peerfact-checkbox"><input type="checkbox" checked="checked"> Post Proof to Comments</label><div class="peerfact-btns">' + btns + '</div><div class="peerfact-footer"><a href="http://www.peerfact.xyz/" target="_blank">PeerFact</a> is designed to combat the misinformation present all over social media. The service becomes stronger the more people use it, so please spread the word!<br><br><b>Types of Content</b><br><br>' + descs + '<br><br>PeerFact is 3rd party software and is not associated with Facebook in any way. This is an early version so expect more features in the near future!</div></div></div>');
	this.$peerfactRoot = this.$root.find(".peerfact-box");
	this.$expandLabel = this.$root.find(".peerfact-expand");
	this.$bestProof = this.$root.find(".peerfact-best-proof");
	this.$proofUrl = this.$root.find(".peerfact-reason");
	this.$commentCheckbox = this.$root.find(".peerfact-checkbox input");
	this.$proofError = this.$root.find(".peerfact-proof-error");
	this.$autoDetect = this.$root.find(".peerfact-auto-btn");
	this.$autoDetectResult = this.$root.find(".peerfact-auto-result");

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

		//Update on the server
		self.data.updateMyVote(type, val).then(function () {
			self.updateData();
		});

		//Send to the injected script
		if (self.$commentCheckbox.prop("checked") && val) {
			var commentText = "";
			switch (type) {
				case "fact": commentText = "This is correct. Proof: "; break;
				case "misleading": commentText = "This post is misleading. Link to explanation: "; break;
				case "fiction": commentText = "This post is false. Proof: "; break;
				case "sponsored": commentText = "This is sponsored content. Proof: "; break;
				case "questionable": commentText = "This post is questionable. Proof: "; break;
			}

			PeerFactCommunicator.send("facebook", "comment", { postid:self.getPostId(), text:commentText + PeerFactPostData.formatUrl(val, type) });
		}
	});
	this.$autoDetect.on("click", function (e) {
		//If this is a auto-detect candidate post and there are no human results then check it using automatic checker
		var imageUrl = PeerFactSelectors.getAutoDetectImage(self.$root);
		if (imageUrl != null && self.data.auto == null) {
			self.data.checkAuto(imageUrl).then(function () {
				self.updateData();
			});
		}
	});

	//Set the post data if available
	this.updateData();
};

PeerFactPost.prototype.getPostId = function () {
	return PeerFactSelectors.getPostId(this.$root);
};
