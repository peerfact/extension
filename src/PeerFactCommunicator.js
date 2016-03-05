/**
 * Send messages between scripts via the DOM.
 */
var PeerFactCommunicator = {

	recv: function (name, f) {
		$("body").append('<div style="display: none !important;" class="peerfact-communicator peerfact-communicator-' + name + '"></div>');
		var $buf = $(".peerfact-communicator-" + name);
		setInterval(function () {
			//Poll for incoming messages
			$buf.find("div").each(function () {
				var msg = JSON.parse($(this).text());
				f(msg.type, msg.data);
			});
			$buf.empty();
		}, 100);
	},

	send: function (name, type, data) {
		var $msg = $(document.createElement("DIV"));
		$msg.text(JSON.stringify({ type:type, data:data }));
		$(".peerfact-communicator-" + name).append($msg[0]);
	}

};