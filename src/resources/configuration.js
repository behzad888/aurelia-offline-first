// import { AppIndexedDBMirrorClient } from './app-indexeddb-mirror-client';
/**
 * The default configuration
 */
export class ConfigurationDefaults {

}

ConfigurationDefaults._defaults = {
  name: 'practicalaurelia',
  config: {
    apiKey: 'AIzaSyAx02B4a0nbMvQxsvliyMmIjlWKqfIm58M',
    authDomain: "practicalaurelia.firebaseio.com",
    databaseURL: "https://practicalaurelia.firebaseio.com"
  },
  // appStorage: {
  //   key: 'todos',
  //   session: '',
  //   workerUrl: 'dist/resources/app-indexeddb-mirror-worker.js',
  //   client: {
  //     type: AppIndexedDBMirrorClient,
  //     computed: '__computeClient(workerUrl)',
  //     observer: '__clientChanged'
  //   },
  //   persistedData: true,
  //   observers: [
  //     '__updatePersistedData(client, key, session, online)',
  //     '__updatePersistedData(data.*)',
  //   ]
  // }
};

ConfigurationDefaults.defaults = function () {
  let defaults = {};
  Object.assign(defaults, ConfigurationDefaults._defaults);
  return defaults;
};

/**
 * Configuration class used by the plugin
 */
export class Configuration {

  /**
   * Initializes a new instance of the Configuration class
   * @param {Object} innerConfig - The optional initial configuration values. If not provided will initialize using the defaults.
   */
  constructor(innerConfig) {
    this.innerConfig = innerConfig;
    this.values = this.innerConfig ? {} : ConfigurationDefaults.defaults();  
  }

  /**
   * Gets the value of a configuration option by its identifier
   * @param {string} identifier - The configuration option identifier
   * @returns {any} - The value of the configuration option
   * @throws {Error} - When configuration option is not found
   */
  getValue(identifier) {
    if (this.values.hasOwnProperty(identifier) !== null && this.values[identifier] !== undefined) {
      return this.values[identifier];
    }
    if (this.innerConfig !== null) {
      return this.innerConfig.getValue(identifier);
    }
    throw new Error('Config not found: ' + identifier);
  }

  /**
   * Sets the value of a configuration option
   * @param {string} identifier - The key used to store the configuration option value
   * @param {any} value - The value of the configuration option
   * @returns {Configuration} - The current configuration instance (Fluent API)
   */
  setValue(identifier, value) {
    this.values[identifier] = value;
    return this; // fluent API
  }

  getFirebaseUrl() {
    return this.getValue('config').databaseURL;
  }
}