/**
 * Do user authentication.
 */

var __pfAuthToken = null;
chrome.storage.sync.get('__pfAuthToken', function (items) {
    if (items.__pfAuthToken == null) {
        __pfAuthToken = ((Math.random()*1e3)|0).toString() + "73198" + ((Math.random()*1e3)|0).toString();
        chrome.storage.sync.set({ '__pfAuthToken': __pfAuthToken });
    } else {
        __pfAuthToken = items.__pfAuthToken;
    }
});

var PeerFactAuth = {

    isAuth: function () {
        return true;
    },

    getAuthToken: function () {
        return { uid:__pfAuthToken };
    },

    doAuth: function () {
        return Promise.resolve({ uid:__pfAuthToken });
        /*return new Promise (function (resolve, reject) {
    		window.open("https://www.facebook.com/robots.txt", 'oauth','height=600,width=450');

    		//Instruct the page to poll for oauth success
    		PeerFactCommunicator.send("facebook", "oauth", {});

    		//Start polling for authentication every second, give up after 2 minutes
    		var tries = 0;
    		var intId = setInterval(function () {
    			if (authData != null) {
    				clearInterval(intId);
    				resolve();
    			} else {
    				tries++;

    				if (tries >= 120) {
    					clearInterval(intId);
    					reject("Auth timed out.");
    				}
    			}
    		}, 1000);
    	});*/
    }

};
