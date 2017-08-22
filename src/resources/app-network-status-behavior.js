var networkStatusSubscribers = [];
function notifySubscribers() {
    for (var i = 0; i < networkStatusSubscribers.length; ++i) {
        networkStatusSubscribers[i].refreshNetworkStatus();
    }
}
window.addEventListener('online', notifySubscribers);
window.addEventListener('offline', notifySubscribers);

export class AppNetworkStatusBehavior {
    online = {
        type: Boolean,
        readOnly: true,
        notify: true,
        value: function () {
            return window.navigator.onLine;
        }
    }
    attached() {
        networkStatusSubscribers.push(this);
        this.refreshNetworkStatus();
    }
    detached() {
        var index = networkStatusSubscribers.indexOf(this);
        if (index < 0) {
            return;
        }
        networkStatusSubscribers.splice(index, 1);
    }

    refreshNetworkStatus() {
        this._setOnline(window.navigator.onLine);
    }
}
