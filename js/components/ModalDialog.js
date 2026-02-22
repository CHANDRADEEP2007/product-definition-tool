/**
 * Modal Dialog Component
 * Provides modern modal dialogs to replace native browser prompts
 */

const ModalDialog = {
    /**
     * Show an input dialog (replaces prompt)
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message
     * @param {string} defaultValue - Default input value
     * @param {Object} options - Additional options
     * @returns {Promise<string|null>} User input or null if canceled
     */
    async input(title, message, defaultValue = '', options = {}) {
        return new Promise((resolve) => {
            const modal = this.createModal({
                title,
                content: `
                    <p>${this.escapeHtml(message)}</p>
                    <div class="form-group">
                        <input type="${options.type || 'text'}" 
                               id="modalInput" 
                               class="modal-input" 
                               value="${this.escapeHtml(defaultValue)}"
                               placeholder="${this.escapeHtml(options.placeholder || '')}"
                               ${options.required ? 'required' : ''}>
                    </div>
                `,
                buttons: [
                    {
                        text: 'Cancel',
                        className: 'btn btn-secondary',
                        onClick: () => {
                            this.close();
                            resolve(null);
                        }
                    },
                    {
                        text: options.confirmText || 'OK',
                        className: 'btn btn-primary',
                        onClick: () => {
                            const input = document.getElementById('modalInput');
                            const value = input.value.trim();
                            if (options.required && !value) {
                                input.focus();
                                return;
                            }
                            this.close();
                            resolve(value || null);
                        }
                    }
                ]
            });

            // Focus input and handle Enter key
            const input = modal.querySelector('#modalInput');
            if (input) {
                setTimeout(() => input.focus(), 100);
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        const value = input.value.trim();
                        if (!options.required || value) {
                            this.close();
                            resolve(value || null);
                        }
                    }
                });
            }
        });
    },

    /**
     * Show a confirmation dialog (replaces confirm)
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message
     * @param {Object} options - Additional options
     * @returns {Promise<boolean>} True if confirmed, false if canceled
     */
    async confirm(title, message, options = {}) {
        return new Promise((resolve) => {
            this.createModal({
                title,
                content: `<p>${this.escapeHtml(message)}</p>`,
                buttons: [
                    {
                        text: options.cancelText || 'Cancel',
                        className: 'btn btn-secondary',
                        onClick: () => {
                            this.close();
                            resolve(false);
                        }
                    },
                    {
                        text: options.confirmText || 'OK',
                        className: `btn ${options.danger ? 'btn-danger' : 'btn-primary'}`,
                        onClick: () => {
                            this.close();
                            resolve(true);
                        }
                    }
                ]
            });
        });
    },

    /**
     * Show a custom form dialog
     * @param {string} title - Dialog title
     * @param {Array} fields - Array of field definitions
     * @param {Object} options - Additional options
     * @returns {Promise<Object|null>} Form data or null if canceled
     */
    async form(title, fields, options = {}) {
        return new Promise((resolve) => {
            const formContent = fields.map((field, index) => {
                const fieldId = `modalField${index}`;
                let inputHtml = '';

                switch (field.type) {
                    case 'text':
                    case 'number':
                    case 'email':
                        inputHtml = `<input type="${field.type}" 
                                           id="${fieldId}" 
                                           name="${field.name}"
                                           class="modal-input" 
                                           value="${this.escapeHtml(field.defaultValue || '')}"
                                           placeholder="${this.escapeHtml(field.placeholder || '')}"
                                           ${field.required ? 'required' : ''}>`;
                        break;
                    case 'textarea':
                        inputHtml = `<textarea id="${fieldId}" 
                                              name="${field.name}"
                                              class="modal-input" 
                                              placeholder="${this.escapeHtml(field.placeholder || '')}"
                                              ${field.required ? 'required' : ''}>${this.escapeHtml(field.defaultValue || '')}</textarea>`;
                        break;
                    case 'select':
                        const optionsHtml = (field.options || []).map(opt =>
                            `<option value="${this.escapeHtml(opt.value)}" ${opt.value === field.defaultValue ? 'selected' : ''}>
                                ${this.escapeHtml(opt.label)}
                            </option>`
                        ).join('');
                        inputHtml = `<select id="${fieldId}" 
                                            name="${field.name}"
                                            class="modal-input"
                                            ${field.required ? 'required' : ''}>
                                        ${optionsHtml}
                                    </select>`;
                        break;
                    case 'checkbox':
                        inputHtml = `<label class="checkbox-label">
                                        <input type="checkbox" 
                                               id="${fieldId}" 
                                               name="${field.name}"
                                               ${field.defaultValue ? 'checked' : ''}>
                                        ${this.escapeHtml(field.checkboxLabel || '')}
                                    </label>`;
                        break;
                }

                return `
                    <div class="form-group">
                        ${field.type !== 'checkbox' ? `<label for="${fieldId}">${this.escapeHtml(field.label)}${field.required ? ' <span class="required">*</span>' : ''}</label>` : ''}
                        ${inputHtml}
                        ${field.help ? `<small class="form-help">${this.escapeHtml(field.help)}</small>` : ''}
                    </div>
                `;
            }).join('');

            const modal = this.createModal({
                title,
                content: `<form id="modalForm" class="modal-form">${formContent}</form>`,
                buttons: [
                    {
                        text: 'Cancel',
                        className: 'btn btn-secondary',
                        onClick: () => {
                            this.close();
                            resolve(null);
                        }
                    },
                    {
                        text: options.confirmText || 'Submit',
                        className: 'btn btn-primary',
                        onClick: () => {
                            const form = document.getElementById('modalForm');
                            if (!form.checkValidity()) {
                                form.reportValidity();
                                return;
                            }

                            const formData = {};
                            fields.forEach((field, index) => {
                                const input = document.getElementById(`modalField${index}`);
                                if (field.type === 'checkbox') {
                                    formData[field.name] = input.checked;
                                } else {
                                    formData[field.name] = input.value;
                                }
                            });

                            this.close();
                            resolve(formData);
                        }
                    }
                ]
            });
        });
    },

    /**
     * Create and show a modal
     * @param {Object} config - Modal configuration
     * @returns {HTMLElement} Modal element
     */
    createModal(config) {
        // Remove any existing modals
        this.close();

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'activeModal';

        const buttonsHtml = config.buttons.map(btn =>
            `<button class="${btn.className}" data-action="${btn.text}">${btn.text}</button>`
        ).join('');

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${this.escapeHtml(config.title)}</h3>
                    <button class="modal-close" data-action="close">×</button>
                </div>
                <div class="modal-body">
                    ${config.content}
                </div>
                <div class="modal-footer">
                    ${buttonsHtml}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        config.buttons.forEach(btn => {
            const btnEl = modal.querySelector(`[data-action="${btn.text}"]`);
            if (btnEl) {
                btnEl.addEventListener('click', btn.onClick);
            }
        });

        // Close button
        const closeBtn = modal.querySelector('[data-action="close"]');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                const cancelBtn = config.buttons.find(b => b.text === 'Cancel');
                if (cancelBtn) {
                    cancelBtn.onClick();
                } else {
                    this.close();
                }
            });
        }

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                const cancelBtn = config.buttons.find(b => b.text === 'Cancel');
                if (cancelBtn) {
                    cancelBtn.onClick();
                }
            }
        });

        // Escape key to close
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                const cancelBtn = config.buttons.find(b => b.text === 'Cancel');
                if (cancelBtn) {
                    cancelBtn.onClick();
                }
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        return modal;
    },

    /**
     * Close the active modal
     */
    close() {
        const modal = document.getElementById('activeModal');
        if (modal) {
            modal.remove();
        }
    },

    /**
     * Escape HTML to prevent XSS
     * @param {string} text
     * @returns {string}
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

export default ModalDialog;
