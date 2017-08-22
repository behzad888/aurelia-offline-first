/**
 * Represents a Firebase User
 */
export class User {

    /**
     * A unique user ID, intented as the user's unique key accross all providers
     * @type {string}
     */
    uid = null;

    /**
     * The authentication method used
     * @type {string}
     */
    provider = null;

    /**
     * The Firebase authentication token for this session
     * @type {string}
     */
    token = null;

    /**
     * The contents of the authentication token
     * @type {Object}
     */
    auth = null;

    /**
     * A timestamp, in seconds since UNIX epoch, indicated when the authentication token expires
     * @type {number}
     */
    expires = 0;

    /**
     * The user's email address
     * @type {string}
     */
    email = null;

    /**
     * Whether or not the user authenticated using a temporary password,
     * as used in password reset flows.
     * @type {boolean}
     */
    isTemporaryPassword = null;

    /**
     * The URL to the user's Gravatar profile image
     * @type {string}
     */
    profileImageUrl = null;

    /**
     * Whether or not the user is authenticated
     * @type {boolean} True is the user is authenticated, false otherwise.
     */
    get isAuthenticated() {
        return (this.token && this.email != null) || false;
    }

    /**
     * Initializes a new instance of user
     * @param userData {Object} Optional object containing data
     * to initialize this user with.
     */
    constructor(userData = null) {
        this.update(userData);
    }

    /**
     * Update the current user instance with the provided data
     * @param userData {Object} An object containing the data
     */
    update(userData) {
        userData = userData || {};
        this.uid = userData.uid || null;
        this.token = userData.refreshToken || null;
        userData.password = userData.password || {};
        this.isTemporaryPassword = userData.isTemporaryPassword || false;
        this.profileImageUrl = userData.photoURL || null;
        this.email = userData.email || null;
    }

    /**
     * Reinitializes the current user instance.
     */
    reset() {
        this.update({});
    }
}