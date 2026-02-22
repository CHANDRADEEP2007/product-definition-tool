/**
 * Options Editor Component
 * Provides a better UI for managing option lists
 */

const OptionsEditor = {
    /**
     * Show options editor dialog
     * @param {Array} existingOptions - Existing options if editing
     * @returns {Promise<Array|null>} Array of options or null if canceled
     */
    async edit(existingOptions = []) {
        return new Promise((resolve) => {
            const modal = this.createEditorModal(existingOptions, resolve);
            document.body.appendChild(modal);
        });
    },

    /**
     * Create the editor modal
     * @param {Array} existingOptions
     * @param {Function} resolve
     * @returns {HTMLElement}
     */
    createEditorModal(existingOptions, resolve) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'optionsEditorModal';

        const options = [...existingOptions];

        const renderOptions = () => {
            const list = modal.querySelector('.options-list');
            if (!list) return;

            list.innerHTML = '';

            if (options.length === 0) {
                list.innerHTML = '<p style="color: var(--color-text-tertiary); text-align: center; padding: 20px;">No options yet. Click "Add Option" to start.</p>';
                return;
            }

            options.forEach((option, index) => {
                const item = document.createElement('div');
                item.className = 'option-item';
                item.innerHTML = `
                    <input type="text" class="option-input" value="${this.escapeHtml(option)}" data-index="${index}">
                    <button class="btn-icon btn-danger" data-action="delete" data-index="${index}" title="Delete option">🗑️</button>
                `;
                list.appendChild(item);

                // Handle input changes
                const input = item.querySelector('.option-input');
                input.addEventListener('input', (e) => {
                    options[index] = e.target.value.trim();
                });

                // Handle delete
                const deleteBtn = item.querySelector('[data-action="delete"]');
                deleteBtn.addEventListener('click', () => {
                    options.splice(index, 1);
                    renderOptions();
                });
            });
        };

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>Edit Options</h3>
                    <button class="modal-close" data-action="close">×</button>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom: 16px; color: var(--color-text-secondary);">
                        Add and manage options for this field. Each option will appear as a choice in the form.
                    </p>
                    <div class="options-list" style="max-height: 400px; overflow-y: auto; margin-bottom: 16px;"></div>
                    <button class="btn btn-secondary" data-action="add">+ Add Option</button>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-action="cancel">Cancel</button>
                    <button class="btn btn-primary" data-action="save">Save Options</button>
                </div>
            </div>
        `;

        // Initial render
        setTimeout(() => renderOptions(), 10);

        // Add option button
        modal.querySelector('[data-action="add"]').addEventListener('click', () => {
            options.push('');
            renderOptions();
            // Focus the new input
            setTimeout(() => {
                const inputs = modal.querySelectorAll('.option-input');
                if (inputs.length > 0) {
                    inputs[inputs.length - 1].focus();
                }
            }, 10);
        });

        // Cancel button
        modal.querySelector('[data-action="cancel"]').addEventListener('click', () => {
            this.close();
            resolve(null);
        });

        // Close button
        modal.querySelector('[data-action="close"]').addEventListener('click', () => {
            this.close();
            resolve(null);
        });

        // Save button
        modal.querySelector('[data-action="save"]').addEventListener('click', () => {
            const validOptions = options.filter(opt => opt.trim().length > 0);
            if (validOptions.length === 0) {
                alert('Please add at least one option.');
                return;
            }
            this.close();
            resolve(validOptions);
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.querySelector('[data-action="cancel"]').click();
            }
        });

        // Escape key to close
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                modal.querySelector('[data-action="cancel"]').click();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        return modal;
    },

    /**
     * Close the editor modal
     */
    close() {
        const modal = document.getElementById('optionsEditorModal');
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

export default OptionsEditor;
