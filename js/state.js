/**
 * Centralized State Management
 */

import Models from './models.js';

class State {
    constructor() {
        this.data = {
            currentUser: null,
            productDefinitions: [],
            questionLibrary: [],
            auditLog: [],
            currentView: 'products', // products, designer, library
            currentProductId: null,
            selectedElementId: null,
            selectedElementType: null, // section, field
            ui: {
                isDragging: false,
                dragType: null,
                dragData: null
            }
        };

        this.listeners = new Map();
    }

    /**
     * Get current state
     * @param {string} path - Dot-notation path (e.g., 'currentUser.name')
     * @returns {*}
     */
    get(path) {
        if (!path) return this.data;

        return path.split('.').reduce((obj, key) => {
            return obj?.[key];
        }, this.data);
    }

    /**
     * Set state value
     * @param {string} path - Dot-notation path
     * @param {*} value - Value to set
     */
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();

        const target = keys.reduce((obj, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, this.data);

        target[lastKey] = value;
        this.emit('change', { path, value });
        this.emit(`change:${path}`, value);
    }

    /**
     * Subscribe to state changes
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);

        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    }

    /**
     * Emit event to listeners
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => callback(data));
        }
    }

    // User Management

    /**
     * Set current user
     * @param {User} user
     */
    setCurrentUser(user) {
        this.set('currentUser', user);
    }

    /**
     * Get current user
     * @returns {User|null}
     */
    getCurrentUser() {
        return this.get('currentUser');
    }

    /**
     * Logout current user
     */
    logout() {
        this.set('currentUser', null);
    }

    // Product Definitions Management

    /**
     * Get all product definitions
     * @returns {ProductDefinition[]}
     */
    getProductDefinitions() {
        return this.get('productDefinitions') || [];
    }

    /**
     * Get product definition by ID
     * @param {string} id
     * @returns {ProductDefinition|undefined}
     */
    getProductDefinition(id) {
        return this.getProductDefinitions().find(p => p.id === id);
    }

    /**
     * Add or update product definition
     * @param {ProductDefinition} product
     */
    saveProductDefinition(product) {
        const products = this.getProductDefinitions();
        const index = products.findIndex(p => p.id === product.id);

        if (index >= 0) {
            products[index] = product;
        } else {
            products.push(product);
        }

        this.set('productDefinitions', products);
        this.emit('product:saved', product);
    }

    /**
         * Delete product definition
         * @param {string} id
         */
    deleteProductDefinition(id) {
        const products = this.getProductDefinitions();
        const filtered = products.filter(p => p.id !== id);
        this.set('productDefinitions', filtered);
        this.emit('product:deleted', id);
    }

    /**
     * Get current product being edited
     * @returns {ProductDefinition|null}
     */
    getCurrentProduct() {
        const id = this.get('currentProductId');
        return id ? this.getProductDefinition(id) : null;
    }

    /**
     * Set current product
     * @param {string} id
     */
    setCurrentProduct(id) {
        this.set('currentProductId', id);
    }

    // Question Library Management

    /**
     * Get all question library items
     * @returns {QuestionLibraryItem[]}
     */
    getQuestionLibrary() {
        return this.get('questionLibrary') || [];
    }

    /**
     * Get question library item by ID
     * @param {string} id
     * @returns {QuestionLibraryItem|undefined}
     */
    getQuestionLibraryItem(id) {
        return this.getQuestionLibrary().find(q => q.id === id);
    }

    /**
     * Save question library item
     * @param {QuestionLibraryItem} question
     */
    saveQuestionLibraryItem(question) {
        const questions = this.getQuestionLibrary();
        const index = questions.findIndex(q => q.id === question.id);

        if (index >= 0) {
            questions[index] = question;
        } else {
            questions.push(question);
        }

        this.set('questionLibrary', questions);
        this.emit('library:saved', question);
    }

    /**
     * Delete question library item
     * @param {string} id
     */
    deleteQuestionLibraryItem(id) {
        const questions = this.getQuestionLibrary();
        const filtered = questions.filter(q => q.id !== id);
        this.set('questionLibrary', filtered);
        this.emit('library:deleted', id);
    }

    // View Management

    /**
     * Set current view
     * @param {string} view
     */
    setView(view) {
        this.set('currentView', view);
    }

    /**
     * Get current view
     * @returns {string}
     */
    getView() {
        return this.get('currentView');
    }

    // Selection Management

    /**
     * Set selected element
     * @param {string} elementId
     * @param {string} elementType
     */
    setSelectedElement(elementId, elementType) {
        this.set('selectedElementId', elementId);
        this.set('selectedElementType', elementType);
        this.emit('selection:changed', { elementId, elementType });
    }

    /**
     * Clear selection
     */
    clearSelection() {
        this.set('selectedElementId', null);
        this.set('selectedElementType', null);
        this.emit('selection:cleared');
    }

    // Audit Log

    /**
     * Add audit entry
     * @param {AuditEntry} entry
     */
    addAuditEntry(entry) {
        const log = this.get('auditLog') || [];
        log.push(entry);
        this.set('auditLog', log);
    }

    /**
     * Get audit entries for product
     * @param {string} productId
     * @returns {AuditEntry[]}
     */
    getAuditEntries(productId) {
        const log = this.get('auditLog') || [];
        return log.filter(entry => entry.productDefinitionId === productId);
    }

    // Persistence

    /**
     * Load state from storage
     * @param {Object} data
     */
    loadFromStorage(data) {
        if (data.productDefinitions) {
            this.set('productDefinitions', data.productDefinitions);
        }
        if (data.questionLibrary) {
            this.set('questionLibrary', data.questionLibrary);
        }
        if (data.auditLog) {
            this.set('auditLog', data.auditLog);
        }
    }

    /**
     * Get data for persistence
     * @returns {Object}
     */
    getDataForStorage() {
        return {
            productDefinitions: this.get('productDefinitions'),
            questionLibrary: this.get('questionLibrary'),
            auditLog: this.get('auditLog')
        };
    }
}

// Create singleton instance
const state = new State();

export default state;
