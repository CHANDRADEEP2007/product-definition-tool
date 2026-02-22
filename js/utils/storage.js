/**
 * Local Storage Utilities
 */

const STORAGE_KEYS = {
    PRODUCTS: 'pdt_products',
    LIBRARY: 'pdt_library',
    AUDIT: 'pdt_audit',
    USER: 'pdt_user'
};

const Storage = {
    /**
     * Save data to local storage
     * @param {string} key
     * @param {*} data
     */
    save(key, data) {
        try {
            const serialized = JSON.stringify(data);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            console.error('Storage save error:', error);
            return false;
        }
    },

    /**
     * Load data from local storage
     * @param {string} key
     * @param {*} defaultValue
     * @returns {*}
     */
    load(key, defaultValue = null) {
        try {
            const serialized = localStorage.getItem(key);
            return serialized ? JSON.parse(serialized) : defaultValue;
        } catch (error) {
            console.error('Storage load error:', error);
            return defaultValue;
        }
    },

    /**
     * Remove item from storage
     * @param {string} key
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    },

    /**
     * Clear all storage
     */
    clear() {
        try {
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    },

    /**
     * Save product definitions
     * @param {ProductDefinition[]} products
     */
    saveProducts(products) {
        return this.save(STORAGE_KEYS.PRODUCTS, products);
    },

    /**
     * Load product definitions
     * @returns {ProductDefinition[]}
     */
    loadProducts() {
        return this.load(STORAGE_KEYS.PRODUCTS, []);
    },

    /**
     * Save question library
     * @param {QuestionLibraryItem[]} library
     */
    saveLibrary(library) {
        return this.save(STORAGE_KEYS.LIBRARY, library);
    },

    /**
     * Load question library
     * @returns {QuestionLibraryItem[]}
     */
    loadLibrary() {
        return this.load(STORAGE_KEYS.LIBRARY, []);
    },

    /**
     * Save audit log
     * @param {AuditEntry[]} log
     */
    saveAudit(log) {
        return this.save(STORAGE_KEYS.AUDIT, log);
    },

    /**
     * Load audit log
     * @returns {AuditEntry[]}
     */
    loadAudit() {
        return this.load(STORAGE_KEYS.AUDIT, []);
    },

    /**
     * Save current user
     * @param {User} user
     */
    saveUser(user) {
        return this.save(STORAGE_KEYS.USER, user);
    },

    /**
     * Load current user
     * @returns {User|null}
     */
    loadUser() {
        return this.load(STORAGE_KEYS.USER, null);
    },

    /**
     * Remove current user
     */
    removeUser() {
        return this.remove(STORAGE_KEYS.USER);
    },

    /**
     * Get storage usage info
     * @returns {Object}
     */
    getUsageInfo() {
        let totalSize = 0;
        const sizes = {};

        Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
            const data = localStorage.getItem(key);
            const size = data ? new Blob([data]).size : 0;
            sizes[name] = size;
            totalSize += size;
        });

        return {
            total: totalSize,
            totalKB: (totalSize / 1024).toFixed(2),
            breakdown: sizes
        };
    }
};

export default Storage;
export { STORAGE_KEYS };
