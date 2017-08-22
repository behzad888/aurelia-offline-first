export function commonWorkerScope() {
    var workerScript = self.location.search.slice(1);

    if (!workerScript) {
        return;
    }
    self.addEventListener('message', function (event) {
        var data = event.data;

        if (data && data.type === 'common-worker-connect') {
            var EventConstructor =
                self.CustomEvent ||
                self.Event ||
                // NOTE(cdata): Have mercy on my soul..
                event.__proto__.__proto__.constructor;
            var connectEvent = new EventConstructor('connect');

            connectEvent.ports = event.ports;
            self.dispatchEvent(connectEvent);
        }
    }.bind(this));

    self.importScripts([workerScript]);
}
