import { Configuration } from './configuration';

export { Configuration } from './configuration';
export { ReactiveCollection } from './collection';
export { User } from './user';
export { Auth } from './auth';
export { AppIndexedDBMirror } from './app-indeseddb-mirror';


export function configure(aurelia, configCallback) {
    let config = new Configuration(Configuration.defaults);

    if (configCallback !== undefined && typeof configCallback === 'function') {
        configCallback(config);
    }
    aurelia.instance(Configuration, config);
}