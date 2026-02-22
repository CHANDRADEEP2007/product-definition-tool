/**
 * Main Application Entry Point
 */

import state from './state.js';
import Storage from './utils/storage.js';
import Auth from './auth/auth.js';
import Permissions from './auth/permissions.js';
import SampleData from './data/sampleData.js';
import ProductList from './components/ProductList.js';
import QuestionLibrary from './components/QuestionLibrary.js';

class App {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        if (this.initialized) return;

        console.log('Initializing Product Definition Tool...');

        // Load data from storage
        this.loadData();

        // Initialize authentication
        Auth.init();

        // Setup navigation
        this.setupNavigation();

        // Auto-save on state changes
        this.setupAutoSave();

        this.initialized = true;
        console.log('Application initialized successfully');
    }

    /**
     * Load data from storage
     */
    loadData() {
        const storedProducts = Storage.loadProducts();
        const storedLibrary = Storage.loadLibrary();
        const storedAudit = Storage.loadAudit();

        // If no data exists, load sample data
        if (storedProducts.length === 0 && storedLibrary.length === 0) {
            console.log('No existing data found, loading sample data...');
            const sampleData = SampleData.init();
            state.loadFromStorage(sampleData);

            // Save sample data
            Storage.saveProducts(sampleData.productDefinitions);
            Storage.saveLibrary(sampleData.questionLibrary);
        } else {
            console.log('Loading existing data from storage...');
            state.loadFromStorage({
                productDefinitions: storedProducts,
                questionLibrary: storedLibrary,
                auditLog: storedAudit
            });
        }
    }

    /**
     * Setup navigation
     */
    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');

        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.switchView(view);
            });
        });
    }

    /**
     * Switch view
     * @param {string} viewName
     */
    switchView(viewName) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeNav = document.querySelector(`[data-view="${viewName}"]`);
        if (activeNav) {
            activeNav.classList.add('active');
        }

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        const targetView = document.getElementById(`${viewName}View`);
        if (targetView) {
            targetView.classList.add('active');
        }

        // Update state
        state.setView(viewName);

        // Initialize view-specific components
        if (viewName === 'products') {
            ProductList.init();
        } else if (viewName === 'library') {
            QuestionLibrary.init();
        }
    }

    /**
     * Setup auto-save
     */
    setupAutoSave() {
        // Save products when changed
        state.on('product:saved', () => {
            const products = state.getProductDefinitions();
            Storage.saveProducts(products);
            console.log('Products auto-saved');
        });

        state.on('product:deleted', () => {
            const products = state.getProductDefinitions();
            Storage.saveProducts(products);
            console.log('Products auto-saved');
        });

        // Save library when changed
        state.on('library:saved', () => {
            const library = state.getQuestionLibrary();
            Storage.saveLibrary(library);
            console.log('Library auto-saved');
        });

        state.on('library:deleted', () => {
            const library = state.getQuestionLibrary();
            Storage.saveLibrary(library);
            console.log('Library auto-saved');
        });
    }
}

// Create and initialize app when DOM is ready
const app = new App();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

export default app;
