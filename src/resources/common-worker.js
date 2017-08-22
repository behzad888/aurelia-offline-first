var WEB_WORKERS = {};
var HAS_SHARED_WORKER = typeof SharedWorker !== 'undefined';
var HAS_WEB_WORKER = typeof Worker !== 'undefined';
// NOTE(cdata): see http://www.2ality.com/2014/05/current-script.html
var currentScript = document._currentScript || document.currentScript ||
    (function () {
        var scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
    })();
var WORKER_SCOPE_URL = './dist/'
export class CommonWorker {
    constructor(workerUrl) {
        if (HAS_SHARED_WORKER) {
            return new SharedWorker(workerUrl);
        } else if (HAS_WEB_WORKER) {
            if (!WEB_WORKERS.hasOwnProperty(workerUrl)) {
                WEB_WORKERS[workerUrl] =
                    new Worker(WORKER_SCOPE_URL + '?' + workerUrl);
            }
        } else {
            console.error('This browser does not support SharedWorker or' +
                'WebWorker, but at least one of those two features is required for' +
                'CommonWorker to do its thing.');
        }
        this.channel = new MessageChannel();
        this.webWorker = WEB_WORKERS[workerUrl];
        if (this.webWorker) {
            this.webWorker.postMessage({
                type: 'common-worker-connect'
            }, [this.channel.port2]);
        }
    }

    get port() {
        return this.channel.port1;
    }

    addEventListener() {
        if (this.webWorker) {
            return this.webWorker.addEventListener.apply(this.webWorker, arguments);
        }
    }

    removeEventListener() {
        if (this.webWorker) {
            return this.webWorker
                .removeEventListener.apply(this.webWorker, arguments);
        }
    }
}