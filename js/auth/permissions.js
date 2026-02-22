/**
 * Permission System
 */

import state from '../state.js';

// Role-based permissions matrix
const PERMISSIONS = {
    Admin: {
        // Product permissions
        'product:create': true,
        'product:edit': true,
        'product:delete': true,
        'product:view': true,
        'product:publish': true,

        // Library permissions
        'library:create': true,
        'library:edit': true,
        'library:delete': true,
        'library:view': true,

        // Other permissions
        'export:schema': true,
        'version:create': true,
        'version:view': true
    },

    Editor: {
        // Product permissions
        'product:create': true,
        'product:edit': true,
        'product:delete': false,
        'product:view': true,
        'product:publish': false,

        // Library permissions
        'library:create': false,
        'library:edit': false,
        'library:delete': false,
        'library:view': true,

        // Other permissions
        'export:schema': true,
        'version:create': true,
        'version:view': true
    },

    Viewer: {
        // Product permissions
        'product:create': false,
        'product:edit': false,
        'product:delete': false,
        'product:view': true,
        'product:publish': false,

        // Library permissions
        'library:create': false,
        'library:edit': false,
        'library:delete': false,
        'library:view': true,

        // Other permissions
        'export:schema': true,
        'version:create': false,
        'version:view': true
    }
};

const Permissions = {
    /**
     * Check if current user has permission
     * @param {string} permission
     * @returns {boolean}
     */
    can(permission) {
        const user = state.getCurrentUser();
        if (!user) return false;

        const rolePermissions = PERMISSIONS[user.role];
        if (!rolePermissions) return false;

        return rolePermissions[permission] === true;
    },

    /**
     * Check if current user has any of the specified permissions
     * @param {...string} permissions
     * @returns {boolean}
     */
    canAny(...permissions) {
        return permissions.some(permission => this.can(permission));
    },

    /**
     * Check if current user has all of the specified permissions
     * @param {...string} permissions
     * @returns {boolean}
     */
    canAll(...permissions) {
        return permissions.every(permission => this.can(permission));
    },

    /**
     * Get all permissions for current user
     * @returns {Object}
     */
    getPermissions() {
        const user = state.getCurrentUser();
        if (!user) return {};

        return PERMISSIONS[user.role] || {};
    },

    /**
     * Require permission (throws if not authorized)
     * @param {string} permission
     * @throws {Error}
     */
    require(permission) {
        if (!this.can(permission)) {
            const user = state.getCurrentUser();
            const role = user ? user.role : 'anonymous';
            throw new Error(`Permission denied: ${permission} (role: ${role})`);
        }
    },

    /**
     * Show/hide element based on permission
     * @param {HTMLElement} element
     * @param {string} permission
     */
    toggleElement(element, permission) {
        if (!element) return;

        if (this.can(permission)) {
            element.classList.remove('hidden');
            element.removeAttribute('disabled');
        } else {
            element.classList.add('hidden');
            element.setAttribute('disabled', 'disabled');
        }
    },

    /**
     * Apply permissions to multiple elements
     * @param {Object} elementPermissions - Map of element ID to permission
     */
    applyToElements(elementPermissions) {
        Object.entries(elementPermissions).forEach(([elementId, permission]) => {
            const element = document.getElementById(elementId);
            this.toggleElement(element, permission);
        });
    }
};

export default Permissions;
