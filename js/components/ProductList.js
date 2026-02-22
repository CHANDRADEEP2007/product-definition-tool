/**
 * Product List Component
 */

import state from '../state.js';
import Models from '../models.js';
import Permissions from '../auth/permissions.js';
import Helpers from '../utils/helpers.js';
import ModalDialog from './ModalDialog.js';

const ProductList = {
    /**
     * Initialize product list view
     */
    init() {
        console.log('ProductList.init() called');
        this.setupEventListeners();
        this.render();
        console.log('ProductList initialized, event listeners attached');
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        console.log('Setting up ProductList event listeners...');

        // Create product button
        const createBtn = document.getElementById('createProductBtn');
        console.log('Create button found:', createBtn);
        if (createBtn) {
            // Remove any existing listeners by cloning
            const newCreateBtn = createBtn.cloneNode(true);
            createBtn.parentNode.replaceChild(newCreateBtn, createBtn);

            newCreateBtn.addEventListener('click', () => {
                console.log('Create product button clicked!');
                this.createProduct();
            });
            console.log('Create button listener attached');
            Permissions.toggleElement(newCreateBtn, 'product:create');
        }

        // Search
        const searchInput = document.getElementById('productSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Status filter
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => this.handleFilter(e.target.value));
        }
    },

    /**
     * Handle search
     */
    handleSearch(term) {
        this.render();
    },

    /**
     * Handle filter
     */
    handleFilter(status) {
        this.render();
    },

    /**
     * Create new product
     */
    async createProduct() {
        console.log('createProduct() called');

        if (!Permissions.can('product:create')) {
            await ModalDialog.confirm(
                'Permission Denied',
                'You do not have permission to create products.'
            );
            return;
        }

        const name = await ModalDialog.input(
            'New Product',
            'Enter product name:',
            '',
            { required: true, placeholder: 'e.g. Customer Profile' }
        );
        if (!name) return;

        const code = await ModalDialog.input(
            'Product Code',
            'Enter product code:',
            '',
            { required: true, placeholder: 'e.g. CUST_PROFILE' }
        );
        if (!code) return;

        const user = state.getCurrentUser();

        const product = Models.createProductDefinition({
            name,
            productCode: code,
            createdBy: user?.username || 'unknown',
            updatedBy: user?.username || 'unknown'
        });

        state.saveProductDefinition(product);
        this.openDesigner(product.id);
    },

    /**
     * Open designer for product
     * @param {string} productId
     */
    async openDesigner(productId) {
        state.setCurrentProduct(productId);
        state.setView('designer');
        this.showView('designer');

        // Import and initialize designer
        const Designer = (await import('./Designer.js')).default;
        Designer.init();
    },

    /**
     * Show specific view
     * @param {string} viewName
     */
    showView(viewName) {
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        const targetView = document.getElementById(`${viewName}View`);
        if (targetView) {
            targetView.classList.add('active');
        }
    },

    /**
     * Render product list
     */
    render() {
        const container = document.getElementById('productList');
        if (!container) return;

        let products = state.getProductDefinitions();

        // Apply filters
        const searchTerm = document.getElementById('productSearch')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';

        if (searchTerm) {
            products = products.filter(p =>
                p.name.toLowerCase().includes(searchTerm) ||
                p.productCode.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm)
            );
        }

        if (statusFilter) {
            products = products.filter(p => p.status === statusFilter);
        }

        // Clear and render
        Helpers.clearElement(container);

        if (products.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <p>No products found</p>
                </div>
            `;
            return;
        }

        products.forEach(product => {
            const card = this.createProductCard(product);
            container.appendChild(card);
        });
    },

    /**
     * Create product card element
     * @param {ProductDefinition} product
     * @returns {HTMLElement}
     */
    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';

        const statusClass = `badge-${product.status.toLowerCase().replace(' ', '')}`;

        card.innerHTML = `
            <div class="product-card-header">
                <h3 class="product-card-title">${Helpers.escapeHtml(product.name)}</h3>
                <span class="badge ${statusClass}">${product.status}</span>
            </div>
            <div class="product-card-meta">
                <div><strong>Code:</strong> ${Helpers.escapeHtml(product.productCode)}</div>
                <div><strong>Version:</strong> ${product.version}</div>
                ${product.businessLine ? `<div><strong>Line:</strong> ${Helpers.escapeHtml(product.businessLine)}</div>` : ''}
            </div>
            ${product.description ? `<p class="product-card-description">${Helpers.escapeHtml(product.description)}</p>` : ''}
            <div class="product-card-footer">
                <small>Updated ${Helpers.formatRelativeTime(product.updatedAt)}</small>
                <div class="product-card-actions">
                    <button class="btn btn-sm btn-primary" data-action="edit">Edit</button>
                    ${Permissions.can('product:delete') ? '<button class="btn btn-sm btn-danger" data-action="delete">Delete</button>' : ''}
                </div>
            </div>
        `;

        // Add event listeners
        card.querySelector('[data-action="edit"]')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openDesigner(product.id);
        });

        card.querySelector('[data-action="delete"]')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteProduct(product.id);
        });

        card.addEventListener('click', () => {
            this.openDesigner(product.id);
        });

        return card;
    },

    /**
     * Delete product
     * @param {string} productId
     */
    async deleteProduct(productId) {
        if (!Permissions.can('product:delete')) {
            await ModalDialog.confirm(
                'Permission Denied',
                'You do not have permission to delete products.'
            );
            return;
        }

        const product = state.getProductDefinition(productId);
        if (!product) return;

        const confirmed = await ModalDialog.confirm(
            'Delete Product',
            `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
            { danger: true, confirmText: 'Delete' }
        );

        if (confirmed) {
            state.deleteProductDefinition(productId);
        }
    }
};

export default ProductList;
