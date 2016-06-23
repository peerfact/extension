/**
 * Experimental new service which will automatically detect if posts are true or false.
 */
var PeerFactAuto = {

    checkImage: function (postid, url) {
        console.log("Auto-detecting image... URL=" + url);
        function getJson (url) {
            return fetch(url).then(function (res) {
                return res.json();
            });
        }
        function getDomInsecure (url) {
            return new Promise(function (resolve, reject) {
                chrome.runtime.sendMessage({url: url}, function (res) {
                    resolve(res.text);
                });
            }).then(function (body) {
                return toDom(body);
            });
        }
        function toDom (htmlString){
            var doc = document.implementation.createHTMLDocument("autodom");
            doc.documentElement.innerHTML = htmlString;
            return doc;
        }

        var url = "https://d10ilm3kz1e5od.cloudfront.net/" + postid + "?url=" + encodeURIComponent(url);
        return getJson(url).then(function (res) {
            console.log("Got text from image: " + res.text);
            return getDomInsecure('http://www.snopes.com/search/?q=' + encodeURIComponent(res.text.replace(/ /g, '+')));
        }).then(function (dom) {
            var anchor = dom.querySelector('#search-box .search-results .item .thumbnail');
			if (anchor != null) {
                var link = 'http://www.snopes.com' + anchor.getAttribute("href");
				return getDomInsecure(link).then(function (dom) {
                    var titleMeta = dom.querySelector('meta[property="og:title"]');
                    if (titleMeta != null) {
                        var tcontent = titleMeta.getAttribute("content");
                        if (tcontent.indexOf("TRUE") == 0) {
                            return {
                                type: "fact",
                                url: link,
                                proof: tcontent
                            };
                        } else if (tcontent.indexOf("FALSE") == 0) {
                            return {
                                type: "fiction",
                                url: link,
                                proof: tcontent
                            };
                        } else {
                            return {
                                type: null,
                                url: link,
                                proof: tcontent
                            };
                        }
                    }
                });
			} else {
                return Promise.reject('No results.');
            }
        }).catch(function () {
            console.log("Failed to auto-detect image.");
            return {
                type: "unknown"
            };
        });
    }

};
