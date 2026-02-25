/**
 * Designer Component - Main Canvas
 */

import state from '../state.js';
import Models from '../models.js';
import Helpers from '../utils/helpers.js';
import Permissions from '../auth/permissions.js';
import ModalDialog from './ModalDialog.js';
import OptionsEditor from './OptionsEditor.js';
import RuleBuilder from './RuleBuilder.js';
import Preview from './Preview.js';

const Designer = {
    currentProduct: null,
    currentStep: 2, // 1=General, 2=Setup, 3=Maintenance, 4=Preview, 5=Review

    /**
     * Initialize designer
     */
    init() {
        const productId = state.get('currentProductId');
        if (!productId) {
            console.error('No product selected');
            return;
        }

        this.currentProduct = state.getProductDefinition(productId);
        if (!this.currentProduct) {
            console.error('Product not found');
            return;
        }

        console.log('Designer initialized for product:', this.currentProduct.name);

        this.setupEventListeners();
        this.setupDragAndDrop();
        this.render();
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Back button
        const backBtn = document.getElementById('backToListBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.backToList());
        }

        // Save button (Top)
        const saveBtn = document.getElementById('saveProductBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.save());
            Permissions.toggleElement(saveBtn, 'product:edit');
        }

        // Save button (Bottom)
        const saveAndContinueBtn = document.getElementById('saveAndContinueBtn');
        if (saveAndContinueBtn) {
            saveAndContinueBtn.addEventListener('click', () => {
                this.save();
                // Visual feedback
                const originalText = saveAndContinueBtn.innerHTML;
                saveAndContinueBtn.innerHTML = '✅ Saved';
                setTimeout(() => {
                    saveAndContinueBtn.innerHTML = originalText;
                }, 2000);
            });
            Permissions.toggleElement(saveAndContinueBtn, 'product:edit');
        }

        // Preview button
        const previewBtn = document.getElementById('previewBtn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                Preview.show(this.currentProduct);
            });
        }

        // Export button
        const exportBtn = document.getElementById('exportProductBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportSchema());
        }

        // Stepper Navigation
        const nextStepBtn = document.getElementById('nextStepBtn');
        if (nextStepBtn) {
            nextStepBtn.addEventListener('click', () => {
                if (this.currentStep < 5) {
                    this.goToStep(this.currentStep + 1);
                }
            });
        }

        // Add a previous step button if it exists and wire it up
        const prevStepBtn = document.getElementById('prevStepBtn');
        if (!prevStepBtn) {
            // Find the button that just says "PREVIOUS"
            const btns = Array.from(document.querySelectorAll('.designer-bottom-bar .btn'));
            const pBtn = btns.find(b => b.textContent.trim() === 'PREVIOUS');
            if (pBtn) {
                pBtn.id = 'prevStepBtn';
                pBtn.addEventListener('click', () => {
                    if (this.currentStep > 1) {
                        this.goToStep(this.currentStep - 1);
                    }
                });
            }
        }
    },

    /**
     * Setup drag and drop for the Builder List
     */
    setupDragAndDrop() {
        console.log('Setting up drag and drop for builder list...');

        const toolItems = document.querySelectorAll('.tool-item');
        const builderList = document.getElementById('builderList');

        toolItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.dataset.type);
                e.dataTransfer.effectAllowed = 'copy';
                state.set('ui.isDragging', true);
                state.set('ui.draggedType', item.dataset.type);
            });

            item.addEventListener('dragend', () => {
                state.set('ui.isDragging', false);
            });
        });

        if (builderList) {
            builderList.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                builderList.classList.add('drag-over');
            });

            builderList.addEventListener('dragleave', (e) => {
                builderList.classList.remove('drag-over');
            });

            builderList.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                builderList.classList.remove('drag-over');

                let type = e.dataTransfer.getData('text/plain') || state.get('ui.draggedType');

                if (type) {
                    this.handleDrop(type);
                }
            });
        }
    },

    /**
     * Handle drop event
     * @param {string} type
     */
    async handleDrop(type) {
        if (!Permissions.can('product:edit')) {
            await ModalDialog.confirm(
                'Permission Denied',
                'You do not have permission to edit this product.'
            );
            return;
        }

        if (type === 'section') {
            await this.addSection();
        } else if (type.startsWith('field-')) {
            const dataType = type.replace('field-', '');
            await this.addField(dataType);
        }
    },

    /**
     * Get field type icon mapping
     * @param {string} dataType 
     * @returns {string} HTML content
     */
    getTypeIcon(dataType) {
        const types = {
            'text': '<span class="tool-icon">T</span>',
            'number': '<span class="tool-icon">123</span>',
            'optionlist': '<span class="tool-icon">☷</span>',
            'date': '<span class="tool-icon">📅</span>',
            'section': '<span class="tool-icon">📁</span>'
        };
        return types[dataType] || '<span class="tool-icon">⚬</span>';
    },

    /**
     * Add section
     */
    async addSection() {
        const name = await ModalDialog.input(
            'New Section',
            'Enter section name:',
            '',
            { required: true, placeholder: 'e.g. Personal Information' }
        );
        if (!name) return;

        const section = Models.createSection({
            productDefinitionId: this.currentProduct.id,
            name,
            displayOrder: this.currentProduct.sections.length
        });

        this.currentProduct.sections.push(section);
        this.save();
        this.render();
    },

    /**
     * Add field
     * @param {string} dataType
     */
    async addField(dataType) {
        // For now, add to first section or create one
        let sectionId = null;
        if (this.currentProduct.sections.length === 0) {
            const section = Models.createSection({
                productDefinitionId: this.currentProduct.id,
                name: 'General',
                displayOrder: 0
            });
            this.currentProduct.sections.push(section);
            sectionId = section.id;
        } else {
            sectionId = this.currentProduct.sections[0].id;
        }

        const label = await ModalDialog.input(
            'New Field',
            'Enter field label:',
            '',
            { required: true, placeholder: 'e.g. Full Name' }
        );
        if (!label) return;

        let fieldConfig = {
            productDefinitionId: this.currentProduct.id,
            sectionId,
            label,
            dataType,
            displayOrder: this.currentProduct.fields.length,
            applicable: true,
            required: false,
            editable: true
        };

        // Handle Text field type
        if (dataType === 'text') {
            const formData = await ModalDialog.form('Text Field Configuration', [
                {
                    name: 'inputType',
                    label: 'Input Type',
                    type: 'select',
                    required: true,
                    defaultValue: 'alphanumeric',
                    options: [
                        { value: 'alpha', label: 'Letters only (Alpha)' },
                        { value: 'numeric', label: 'Numbers only (Numeric)' },
                        { value: 'alphanumeric', label: 'Letters and numbers (Alphanumeric)' }
                    ]
                }
            ]);

            if (!formData) return;

            fieldConfig.validation = {
                inputType: formData.inputType
            };
        }

        // Handle Option List field type
        if (dataType === 'optionlist') {
            const formData = await ModalDialog.form('Option List Configuration', [
                {
                    name: 'multiSelect',
                    label: 'Selection Type',
                    type: 'select',
                    required: true,
                    defaultValue: 'false',
                    options: [
                        { value: 'false', label: 'Single select' },
                        { value: 'true', label: 'Multi-select' }
                    ]
                }
            ]);

            if (!formData) return;

            fieldConfig.multiSelect = (formData.multiSelect === 'true');

            // Use the OptionsEditor to get the options
            const options = await OptionsEditor.edit([]);
            if (!options || options.length === 0) {
                await ModalDialog.confirm(
                    'No Options',
                    'At least one option is required for an option list field.'
                );
                return;
            }

            fieldConfig.options = options;
        }

        console.log('Creating field with config:', fieldConfig);
        const field = Models.createField(fieldConfig);

        this.currentProduct.fields.push(field);
        this.save();
        this.render();
    },

    /**
     * Save product
     */
    async save() {
        if (!Permissions.can('product:edit')) {
            return;
        }

        const user = state.getCurrentUser();
        this.currentProduct.updatedBy = user?.username || 'unknown';
        this.currentProduct.updatedAt = new Date().toISOString();

        state.saveProductDefinition(this.currentProduct);
        console.log('Product saved successfully');
    },

    /**
     * Export schema
     */
    async exportSchema() {
        const { default: SchemaGenerator } = await import('../export/schemaGenerator.js');
        const schema = SchemaGenerator.generateJSON(this.currentProduct);
        const json = JSON.stringify(schema, null, 2);

        Helpers.downloadFile(
            json,
            `${this.currentProduct.productCode}_schema.json`,
            'application/json'
        );
    },

    /**
     * Back to list
     */
    backToList() {
        state.setView('products');
        state.setCurrentProduct(null);

        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        document.getElementById('productsView')?.classList.add('active');
    },

    /**
     * Navigate to a specific step
     * @param {number} step 
     */
    goToStep(step) {
        if (step < 1 || step > 5) return;

        // Mark previous steps as completed
        document.querySelectorAll('.stepper-header .step').forEach(el => {
            const stepNum = parseInt(el.dataset.step);
            el.classList.remove('active', 'completed');

            if (stepNum < step) {
                el.classList.add('completed');
            } else if (stepNum === step) {
                el.classList.add('active');
            }
        });

        // Update step content
        this.currentStep = step;

        // Enable/disable previous button
        const prevBtn = document.getElementById('prevStepBtn');
        if (prevBtn) {
            if (this.currentStep <= 1) { // Prev button disabled only on step 1
                prevBtn.setAttribute('disabled', 'true');
            } else {
                prevBtn.removeAttribute('disabled');
            }
        }

        this.render();
    },

    /**
     * Render designer
     */
    render() {
        const titleEl = document.getElementById('designerProductName');
        const statusEl = document.getElementById('designerProductStatus');

        if (titleEl) titleEl.textContent = this.currentProduct.name;
        if (statusEl) {
            const statusClass = `badge-${this.currentProduct.status.toLowerCase().replace(' ', '')}`;
            statusEl.className = `badge ${statusClass}`;
            statusEl.textContent = this.currentProduct.status;
        }

        // Branching logic for different steps
        if (this.currentStep === 2) {
            this.renderSetupQuestions();
        } else if (this.currentStep === 3) {
            this.renderMaintenanceQuestions();
        } else if (this.currentStep === 4) {
            this.renderPreviewQuestions();
        } else {
            // Default fallback
            this.renderSetupQuestions();
        }
    },

    /**
     * Render Setup Questions (Step 2)
     */
    renderSetupQuestions() {
        // Show Component Library Sidebar
        document.querySelector('.designer-sidebar.left').style.display = 'block';

        // Update Center Panel Header Title/Subtitle
        document.querySelector('.setup-questions-header h3').textContent = `Setup Questions (${this.currentProduct.fields.length})`;
        document.querySelector('.setup-questions-header p.subtitle').textContent = 'Add a new setup question. Drag to reorder. Select an existing question to edit details.';

        const headerActions = document.querySelector('.header-actions');
        if (headerActions) headerActions.style.display = 'flex';

        const headerRight = document.querySelector('.setup-header-right');
        if (headerRight) headerRight.style.display = 'flex';

        // Restore Standard Footer Actions
        this.restoreStandardFooterActions();

        // Update Column Headers
        const headerList = document.querySelector('.builder-list-header');
        headerList.style.display = 'flex'; // Ensure it's visible
        headerList.innerHTML = `
            <span class="col-name">Field Name</span>
            <span class="col-toggle">Applicable</span>
            <span class="col-toggle">Required</span>
            <span class="col-toggle">Editable</span>
        `;

        this.renderBuilderList('setup');
    },

    /**
     * Render Maintenance Questions (Step 3)
     */
    renderMaintenanceQuestions() {
        // Hide Component Library Sidebar
        document.querySelector('.designer-sidebar.left').style.display = 'none';

        // Update Center Panel Header Title/Subtitle
        document.querySelector('.setup-questions-header h3').textContent = `Maintenance Questions (${this.currentProduct.fields.length})`;
        document.querySelector('.setup-questions-header p.subtitle').textContent = 'Configure which fields Ops Admins can edit after the product is active.';

        const headerActions = document.querySelector('.header-actions');
        if (headerActions) headerActions.style.display = 'flex';

        const headerRight = document.querySelector('.setup-header-right');
        if (headerRight) headerRight.style.display = 'flex';

        // Restore Standard Footer Actions
        this.restoreStandardFooterActions();

        // Update Column Headers
        const headerList = document.querySelector('.builder-list-header');
        headerList.style.display = 'flex'; // Ensure it's visible
        headerList.innerHTML = `
            <span class="col-name">Field Name</span>
            <span class="col-toggle" style="flex: 3; justify-content: flex-end;">Maintenance Editable</span>
        `;

        this.renderBuilderList('maintenance');
    },

    /**
     * Render Preview Questions (Step 4)
     */
    renderPreviewQuestions() {
        // Hide Component Library Sidebar
        const sidebar = document.querySelector('.designer-sidebar.left');
        if (sidebar) sidebar.style.display = 'none';

        // Update Center Panel Header Title/Subtitle
        const headerTitle = document.querySelector('.setup-questions-header h3');
        const headerSubtitle = document.querySelector('.setup-questions-header p.subtitle');
        if (headerTitle) headerTitle.textContent = `Preview (Step 4)`;
        if (headerSubtitle) headerSubtitle.textContent = 'This is how your final product form will appear to the end user.';

        const headerActions = document.querySelector('.header-actions');
        if (headerActions) headerActions.style.display = 'none';

        const headerRight = document.querySelector('.setup-header-right');
        if (headerRight) headerRight.style.display = 'none';

        // Update Footer for Preview Mode
        const bottomBarRight = document.querySelector('.bottom-bar-right');
        if (bottomBarRight) {
            bottomBarRight.innerHTML = `
                <button class="btn btn-secondary" onclick="document.getElementById('prevStepBtn').click()">PREVIOUS</button>
                <button class="btn btn-secondary" id="previewValidateBtn">Validate Only</button>
                <button class="btn btn-primary" id="previewSubmitBtn">Submit Simulation</button>
                <button class="btn btn-primary" style="display: none;" id="btnGoToReview" onclick="document.getElementById('nextStepBtn').click()">NEXT</button>
            `;

            document.getElementById('previewValidateBtn').addEventListener('click', () => {
                const form = document.querySelector('.preview-form');
                if (form) {
                    if (form.reportValidity()) {
                        alert('Form configuration is fully valid!');
                    }
                }
            });

            document.getElementById('previewSubmitBtn').addEventListener('click', async () => {
                const form = document.querySelector('.preview-form');
                if (form) {
                    if (form.reportValidity()) {
                        const { default: SchemaGenerator } = await import('../export/schemaGenerator.js');
                        const schema = SchemaGenerator.generateJSON(this.currentProduct);

                        // Fake a submission success and allow moving to step 5
                        alert('Simulation Success! Generated JSON payload printed to console.');
                        console.log('SIMULATED SUBMISSION LOAD:', schema);

                        document.getElementById('previewValidateBtn').style.display = 'none';
                        document.getElementById('previewSubmitBtn').style.display = 'none';
                        document.getElementById('btnGoToReview').style.display = 'inline-flex';
                    }
                }
            });
        }

        // Hide columns header
        const headerList = document.querySelector('.builder-list-header');
        if (headerList) headerList.style.display = 'none';

        const builderList = document.getElementById('builderList');
        if (!builderList) return;

        // Remove empty state and list layout
        Helpers.clearElement(builderList);

        // Inject preview
        Preview.renderInline(this.currentProduct, builderList);
    },

    /**
     * Restore standard footer actions
     */
    restoreStandardFooterActions() {
        const bottomBarRight = document.querySelector('.bottom-bar-right');
        if (bottomBarRight && !bottomBarRight.querySelector('#saveProductBtn')) {
            bottomBarRight.innerHTML = `
                <button id="saveProductBtn" class="btn btn-secondary">SAVE</button>
                <button class="btn btn-secondary" id="prevStepBtn">PREVIOUS</button>
                <button id="nextStepBtn" class="btn btn-primary">NEXT</button>
            `;

            // Re-bind standard events
            document.getElementById('saveProductBtn').addEventListener('click', () => this.save());
            document.getElementById('nextStepBtn').addEventListener('click', () => this.goToStep(this.currentStep + 1));
            document.getElementById('prevStepBtn').addEventListener('click', () => this.goToStep(this.currentStep - 1));

            if (this.currentStep <= 1) {
                document.getElementById('prevStepBtn').setAttribute('disabled', 'true');
            }
        }
    },

    /**
     * Render builder list content
     * @param {string} mode 'setup' or 'maintenance'
     */
    renderBuilderList(mode = 'setup') {
        const builderList = document.getElementById('builderList');
        if (!builderList) return;

        Helpers.clearElement(builderList);

        if (this.currentProduct.fields.length === 0 && this.currentProduct.sections.length === 0) {
            builderList.innerHTML = `
                <div class="builder-empty">
                    <p>Drag elements from the Component Library to start defining the workflow</p>
                </div>
            `;
            return;
        }

        // Render fields
        this.currentProduct.fields.forEach(field => {
            const rowEl = this.createBuilderRowElement(field, mode);
            builderList.appendChild(rowEl);
        });
    },

    /**
     * Create builder row element
     * @param {Field} field
     * @param {string} mode
     * @returns {HTMLElement}
     */
    createBuilderRowElement(field, mode = 'setup') {
        const wrapperEl = document.createElement('div');
        wrapperEl.className = 'builder-row-wrapper';

        const rowEl = document.createElement('div');
        rowEl.className = 'builder-row';
        rowEl.dataset.fieldId = field.id;

        // Ensure new properties exist (migration fallback)
        if (field.applicable === undefined) field.applicable = true;
        if (field.required === undefined) field.required = false;
        if (field.editable === undefined) field.editable = true;

        // Replace icons based on dataType if desired, using a mapping function or inline.
        // For now, keeping the text-based type.

        if (mode === 'maintenance') {
            if (field.maintenanceEditable === undefined) field.maintenanceEditable = true;
            rowEl.innerHTML = `
                <div class="row-info">
                    <span class="row-handle" style="visibility: hidden;">::</span>
                    <div class="row-type-icon">${this.getTypeIcon(field.dataType)}</div>
                    <div class="row-label">${Helpers.escapeHtml(field.label)}</div>
                </div>
                
                <div class="row-checkboxes" style="flex: 3; justify-content: flex-end; padding-right: var(--space-lg);">
                    <label class="row-checkbox">
                        <input type="checkbox" class="toggle-maintenance" data-id="${field.id}" ${field.maintenanceEditable ? 'checked' : ''}>
                        Editable
                    </label>
                </div>

                <div class="row-actions">
                    <span class="row-expand-icon" title="Expand Details">›</span>
                </div>
            `;
        } else {
            rowEl.innerHTML = `
                <div class="row-info">
                    <span class="row-handle">::</span>
                    <div class="row-type-icon">${this.getTypeIcon(field.dataType)}</div>
                    <div class="row-label">${Helpers.escapeHtml(field.label)}</div>
                </div>
                
                <div class="row-checkboxes">
                    <label class="row-checkbox">
                        <input type="checkbox" class="toggle-applicable" data-id="${field.id}" ${field.applicable ? 'checked' : ''}>
                        Applicable
                    </label>
                </div>
                
                <div class="row-checkboxes">
                    <label class="row-checkbox">
                        <input type="checkbox" class="toggle-required" data-id="${field.id}" ${field.required ? 'checked' : ''}>
                        Required
                    </label>
                </div>

                <div class="row-checkboxes">
                    <label class="row-checkbox">
                        <input type="checkbox" class="toggle-editable" data-id="${field.id}" ${field.editable ? 'checked' : ''}>
                        Editable
                    </label>
                </div>

                <div class="row-actions">
                    <span class="row-expand-icon" title="Expand Details">›</span>
                </div>
            `;
        }

        wrapperEl.appendChild(rowEl);

        // Click to select row
        rowEl.addEventListener('click', (e) => {
            // Prevent selection if clicking a toggle
            if (e.target.tagName !== 'INPUT' && !e.target.classList.contains('ui-toggle-slider') && !e.target.classList.contains('row-expand-icon')) {
                this.selectField(field);
            }
        });

        // Expand toggle
        const expandIcon = rowEl.querySelector('.row-expand-icon');
        if (expandIcon) {
            expandIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close all other expanded rows for a cleaner UX
                document.querySelectorAll('.builder-row-wrapper.is-expanded').forEach(w => {
                    if (w !== wrapperEl) w.classList.remove('is-expanded');
                });

                const isExpanded = wrapperEl.classList.toggle('is-expanded');
                if (isExpanded) {
                    let panelEl = wrapperEl.querySelector('.expanded-panel');
                    if (!panelEl) {
                        panelEl = this.renderExpandedPanel(field, wrapperEl);
                        wrapperEl.appendChild(panelEl);
                    }
                    this.selectField(field);
                }
            });
        }

        // Add event listeners for toggles
        const appToggle = rowEl.querySelector('.toggle-applicable');
        if (appToggle) {
            appToggle.addEventListener('change', (e) => {
                field.applicable = e.target.checked;
                this.save();
            });
        }

        const reqToggle = rowEl.querySelector('.toggle-required');
        if (reqToggle) {
            reqToggle.addEventListener('change', (e) => {
                field.required = e.target.checked;
                this.save();
            });
        }

        const edtToggle = rowEl.querySelector('.toggle-editable');
        if (edtToggle) {
            edtToggle.addEventListener('change', (e) => {
                field.editable = e.target.checked;
                this.save();
            });
        }

        const maintToggle = rowEl.querySelector('.toggle-maintenance');
        if (maintToggle) {
            maintToggle.addEventListener('change', (e) => {
                field.maintenanceEditable = e.target.checked;
                this.save();
            });
        }

        return wrapperEl;
    },

    /**
     * Render the expanded panel containing tabs
     * @param {Field} field 
     * @param {HTMLElement} wrapperEl
     * @returns {HTMLElement} 
     */
    renderExpandedPanel(field, wrapperEl) {
        const panelEl = document.createElement('div');
        panelEl.className = 'expanded-panel';

        const canEdit = Permissions.can('product:edit');

        // Create Tabs structure
        panelEl.innerHTML = `
            <div class="panel-tabs-header">
                <button class="panel-tab-btn active" data-tab="question-${field.id}">Question</button>
                ${field.dataType === 'optionlist' ? `<button class="panel-tab-btn" data-tab="rules-${field.id}">Rules (${(field.rules || []).length})</button>` : ''}
            </div>
            <div class="panel-tab-content active" id="tab-question-${field.id}">
                <div class="expanded-form-grid">
                    <div class="config-section">
                        <h5>Basic Information</h5>
                        <div class="form-group">
                            <label>Question Name (Required)</label>
                            <input type="text" class="exp-prop-label" value="${Helpers.escapeHtml(field.label)}" ${!canEdit ? 'disabled' : ''}>
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <input type="text" class="exp-prop-description" value="${Helpers.escapeHtml(field.description || '')}" ${!canEdit ? 'disabled' : ''}>
                        </div>
                        <div class="form-group">
                            <label>Key</label>
                            <input type="text" class="exp-prop-key" value="${field.key}" ${!canEdit ? 'disabled' : ''}>
                        </div>
                    </div>
                    <div class="config-section">
                        <h5>Settings & Attributes</h5>
                        <div class="form-group">
                            <label>Type (Required)</label>
                            <select class="exp-prop-type" disabled>
                                <option value="text" ${field.dataType === 'text' ? 'selected' : ''}>Text Input</option>
                                <option value="number" ${field.dataType === 'number' ? 'selected' : ''}>Number</option>
                                <option value="optionlist" ${field.dataType === 'optionlist' ? 'selected' : ''}>Multiple Choice</option>
                                <option value="date" ${field.dataType === 'date' ? 'selected' : ''}>Date</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Middle Office Attributes</label>
                            <div class="inline-checkbox-group">
                                <label class="row-checkbox">
                                    <input type="checkbox" class="exp-prop-app" ${field.applicable ? 'checked' : ''} ${!canEdit ? 'disabled' : ''}>
                                    Applicable
                                </label>
                                <label class="row-checkbox">
                                    <input type="checkbox" class="exp-prop-req" ${field.required ? 'checked' : ''} ${!canEdit ? 'disabled' : ''}>
                                    Required
                                </label>
                                <label class="row-checkbox">
                                    <input type="checkbox" class="exp-prop-edt" ${field.editable ? 'checked' : ''} ${!canEdit ? 'disabled' : ''}>
                                    Editable
                                </label>
                            </div>
                        </div>
                        ${field.dataType === 'optionlist' ? `
                        <div class="form-group options-actions">
                            <label>Options</label>
                            <button class="btn btn-secondary btn-sm exp-btn-options" ${!canEdit ? 'disabled' : ''}>Edit Options (${(field.options || []).length})</button>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            ${field.dataType === 'optionlist' ? `
            <div class="panel-tab-content" id="tab-rules-${field.id}">
                <!-- Rules Builder will be mounted here -->
            </div>
            ` : ''}
        `;

        // Wire Tab Switching
        const tabBtns = panelEl.querySelectorAll('.panel-tab-btn');
        const tabContents = panelEl.querySelectorAll('.panel-tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                btn.classList.add('active');
                const targetId = btn.dataset.tab;
                panelEl.querySelector('#tab-' + targetId).classList.add('active');
            });
        });

        // Initialize RuleBuilder in Rules Tab ONLY if it exists (OptionList)
        const rulesTab = panelEl.querySelector(`#tab-rules-${field.id}`);
        if (rulesTab) {
            RuleBuilder.render(rulesTab, field, this.currentProduct, () => {
                // Update rule count in tab header
                const ruleBtn = panelEl.querySelector(`[data-tab="rules-${field.id}"]`);
                if (ruleBtn) {
                    ruleBtn.textContent = `Rules (${(field.rules || []).length})`;
                }
                this.save();
            });
        }

        // Wire Form Input Events
        if (canEdit) {
            const syncLabel = panelEl.querySelector('.exp-prop-label');
            syncLabel.addEventListener('change', (e) => {
                field.label = e.target.value;
                const rowLabel = wrapperEl.querySelector('.row-label');
                if (rowLabel) rowLabel.textContent = field.label; // update visually inline
                this.save();
            });

            const syncDesc = panelEl.querySelector('.exp-prop-description');
            syncDesc.addEventListener('change', (e) => {
                field.description = e.target.value;
                this.save();
            });

            const syncKey = panelEl.querySelector('.exp-prop-key');
            syncKey.addEventListener('change', (e) => {
                field.key = e.target.value;
                this.save();
            });

            const syncApp = panelEl.querySelector('.exp-prop-app');
            syncApp.addEventListener('change', (e) => {
                field.applicable = e.target.checked;
                const rowApp = wrapperEl.querySelector('.toggle-applicable');
                if (rowApp) rowApp.checked = e.target.checked;
                this.save();
            });

            const syncReq = panelEl.querySelector('.exp-prop-req');
            syncReq.addEventListener('change', (e) => {
                field.required = e.target.checked;
                const rowReq = wrapperEl.querySelector('.toggle-required');
                if (rowReq) rowReq.checked = e.target.checked;
                this.save();
            });

            const syncEdt = panelEl.querySelector('.exp-prop-edt');
            syncEdt.addEventListener('change', (e) => {
                field.editable = e.target.checked;
                const rowEdt = wrapperEl.querySelector('.toggle-editable');
                if (rowEdt) rowEdt.checked = e.target.checked;
                this.save();
            });

            const btnOptions = panelEl.querySelector('.exp-btn-options');
            if (btnOptions) {
                btnOptions.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const options = await OptionsEditor.edit(field.options || []);
                    if (options && options.length > 0) {
                        field.options = options;
                        btnOptions.textContent = `Edit Options (${options.length})`;
                        this.save();
                    }
                });
            }
        }

        return panelEl;
    },

    /**
     * Select field row
     * @param {Field} field
     */
    selectField(field) {
        document.querySelectorAll('.builder-row.selected').forEach(el => {
            el.classList.remove('selected');
        });

        const rowEl = document.querySelector(`.builder-row[data-field-id="${field.id}"]`);
        if (rowEl) {
            rowEl.classList.add('selected');
        }

        state.setSelectedElement(field.id, 'field');
        this.showFieldProperties(field);
    },

    /**
     * Show field properties
     * @param {Field} field
     */
    showFieldProperties(field) {
        const panel = document.getElementById('propertiesPanel');
        if (!panel) return;

        Helpers.clearElement(panel);

        const canEdit = Permissions.can('product:edit');

        let validationFieldsHtml = '';
        if (field.dataType === 'text' && field.validation?.inputType === 'numeric') {
            validationFieldsHtml = `
                <div class="form-group">
                    <label>Min Value</label>
                    <input type="number" id="prop-val-min" value="${field.validation?.min !== undefined ? field.validation.min : ''}" ${!canEdit ? 'disabled' : ''}>
                </div>
                <div class="form-group">
                    <label>Max Value</label>
                    <input type="number" id="prop-val-max" value="${field.validation?.max !== undefined ? field.validation.max : ''}" ${!canEdit ? 'disabled' : ''}>
                </div>
            `;
        } else if (field.dataType === 'date') {
            validationFieldsHtml = `
                <div class="form-group">
                    <label>Minimum Date</label>
                    <input type="date" id="prop-val-min-date" value="${field.validation?.min_date || ''}" ${!canEdit ? 'disabled' : ''}>
                </div>
                <div class="form-group">
                    <label>Maximum Date</label>
                    <input type="date" id="prop-val-max-date" value="${field.validation?.max_date || ''}" ${!canEdit ? 'disabled' : ''}>
                </div>
            `;
        }

        panel.innerHTML = `
            <div class="property-group">
                <h4>Field Properties</h4>
                <div class="form-group">
                    <label>Label</label>
                    <input type="text" id="prop-label" value="${Helpers.escapeHtml(field.label)}" ${!canEdit ? 'disabled' : ''}>
                </div>
                <div class="form-group">
                    <label>Key</label>
                    <input type="text" id="prop-key" value="${field.key}" ${!canEdit ? 'disabled' : ''}>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="prop-description" ${!canEdit ? 'disabled' : ''}>${field.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="prop-required" ${field.required ? 'checked' : ''} ${!canEdit ? 'disabled' : ''}>
                        Required
                    </label>
                </div>
                ${validationFieldsHtml}
                ${canEdit ? `
                    <button class="btn btn-primary btn-sm" id="saveFieldBtn">Save Changes</button>
                    <button class="btn btn-danger btn-sm" id="deleteFieldBtn">Delete Field</button>
                ` : ''}
            </div>
        `;

        if (canEdit) {
            panel.querySelector('#saveFieldBtn')?.addEventListener('click', () => {
                field.label = document.getElementById('prop-label').value;
                field.key = document.getElementById('prop-key').value;
                field.description = document.getElementById('prop-description').value;
                field.required = document.getElementById('prop-required').checked;

                // Handle conditional validation bounds
                if (field.dataType === 'text' && field.validation?.inputType === 'numeric') {
                    const minInput = document.getElementById('prop-val-min');
                    const maxInput = document.getElementById('prop-val-max');
                    if (minInput && minInput.value) {
                        field.validation.min = Number(minInput.value);
                    } else if (field.validation) {
                        delete field.validation.min;
                    }
                    if (maxInput && maxInput.value) {
                        field.validation.max = Number(maxInput.value);
                    } else if (field.validation) {
                        delete field.validation.max;
                    }
                }

                if (field.dataType === 'date') {
                    const minDate = document.getElementById('prop-val-min-date');
                    const maxDate = document.getElementById('prop-val-max-date');
                    if (!field.validation) field.validation = {};
                    if (minDate && minDate.value) {
                        field.validation.min_date = minDate.value;
                    } else {
                        delete field.validation.min_date;
                    }
                    if (maxDate && maxDate.value) {
                        field.validation.max_date = maxDate.value;
                    } else {
                        delete field.validation.max_date;
                    }
                }

                this.save();
                this.render();
            });

            panel.querySelector('#deleteFieldBtn')?.addEventListener('click', async () => {
                const confirmed = await ModalDialog.confirm(
                    'Delete Field',
                    `Are you sure you want to delete field "${field.label}"?`,
                    { danger: true, confirmText: 'Delete' }
                );
                if (confirmed) {
                    this.deleteField(field.id);
                }
            });
        }

        // Render Rule Builder
        const ruleContainer = document.createElement('div');
        ruleContainer.id = 'ruleBuilderContainer';
        panel.appendChild(ruleContainer);

        RuleBuilder.render(ruleContainer, field, () => {
            this.save();
        });
    },

    /**
     * Delete section
     * @param {string} sectionId
     */
    deleteSection(sectionId) {
        this.currentProduct.sections = this.currentProduct.sections.filter(s => s.id !== sectionId);
        // Also delete fields in this section
        this.currentProduct.fields = this.currentProduct.fields.filter(f => f.sectionId !== sectionId);
        this.save();
        this.render();
    },

    /**
     * Delete field
     * @param {string} fieldId
     */
    deleteField(fieldId) {
        this.currentProduct.fields = this.currentProduct.fields.filter(f => f.id !== fieldId);
        this.save();
        this.render();

        const panel = document.getElementById('propertiesPanel');
        if (panel) {
            panel.innerHTML = '<p class="properties-empty">Select an element to view properties</p>';
        }
    }
};

export default Designer;
