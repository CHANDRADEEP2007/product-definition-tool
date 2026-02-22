/**
 * Authentication Module
 */

import Storage from '../utils/storage.js';
import state from '../state.js';
import ProductList from '../components/ProductList.js';

// Demo users
const DEMO_USERS = [
    {
        id: 'user-admin',
        username: 'admin',
        password: 'admin123',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'Admin'
    },
    {
        id: 'user-editor',
        username: 'editor',
        password: 'editor123',
        name: 'Editor User',
        email: 'editor@example.com',
        role: 'Editor'
    },
    {
        id: 'user-viewer',
        username: 'viewer',
        password: 'viewer123',
        name: 'Viewer User',
        email: 'viewer@example.com',
        role: 'Viewer'
    }
];

const Auth = {
    /**
     * Initialize authentication
     */
    init() {
        // Check if user is already logged in
        const savedUser = Storage.loadUser();
        if (savedUser) {
            state.setCurrentUser(savedUser);
            this.showApp();
            this.updateUserDisplay();
            // Initialize ProductList for already logged in user
            ProductList.init();
        } else {
            this.showLogin();
        }

        // Setup login form
        this.setupLoginForm();

        // Setup logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    },

    /**
     * Setup login form handler
     */
    setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) return;

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            const result = this.login(username, password);

            if (result.success) {
                this.hideLogin();
                this.showApp();
                this.updateUserDisplay();
                // Initialize ProductList after successful login
                ProductList.init();
            } else {
                alert(result.message);
            }
        });
    },

    /**
     * Login user
     * @param {string} username
     * @param {string} password
     * @returns {{ success: boolean, message: string, user?: User }}
     */
    login(username, password) {
        const user = DEMO_USERS.find(u =>
            u.username === username && u.password === password
        );

        if (!user) {
            return {
                success: false,
                message: 'Invalid username or password'
            };
        }

        // Create user session (without password)
        const userSession = {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            role: user.role
        };

        // Save to state and storage
        state.setCurrentUser(userSession);
        Storage.saveUser(userSession);

        return {
            success: true,
            message: 'Login successful',
            user: userSession
        };
    },

    /**
     * Logout current user
     */
    logout() {
        state.logout();
        Storage.removeUser();
        this.hideApp();
        this.showLogin();

        // Clear form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.reset();
        }
    },

    /**
     * Show login modal
     */
    showLogin() {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.classList.add('active');
        }
    },

    /**
     * Hide login modal
     */
    hideLogin() {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.classList.remove('active');
        }
    },

    /**
     * Show main app
     */
    showApp() {
        const app = document.getElementById('app');
        if (app) {
            app.classList.remove('hidden');
        }
    },

    /**
     * Hide main app
     */
    hideApp() {
        const app = document.getElementById('app');
        if (app) {
            app.classList.add('hidden');
        }
    },

    /**
     * Update user display
     */
    updateUserDisplay() {
        const userDisplay = document.getElementById('userDisplay');
        const user = state.getCurrentUser();

        if (userDisplay && user) {
            userDisplay.textContent = `${user.name} (${user.role})`;
        }
    },

    /**
     * Get current user
     * @returns {User|null}
     */
    getCurrentUser() {
        return state.getCurrentUser();
    },

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return state.getCurrentUser() !== null;
    }
};

export default Auth;
