/**
 * Preview Component
 * Shows a preview of how the product form will appear to end users
 */

import Helpers from '../utils/helpers.js';

const Preview = {
    currentProduct: null,
    previewMode: 'setup', // 'setup' | 'maintenance'

    /**
     * Render the form preview inline within a given container
     * @param {ProductDefinition} product
     * @param {HTMLElement} container
     */
    renderInline(product, container) {
        if (!container) return;

        this.currentProduct = product;
        container.innerHTML = `
            <div class="preview-header">
                <div class="preview-mode-toggle">
                    <label class="toggle-label ${this.previewMode === 'setup' ? 'active' : ''}">
                        <input type="radio" name="preview-mode" value="setup" ${this.previewMode === 'setup' ? 'checked' : ''} onchange="window.PreviewApp.toggleMode('setup')">
                        Setup Mode
                    </label>
                    <label class="toggle-label ${this.previewMode === 'maintenance' ? 'active' : ''}">
                        <input type="radio" name="preview-mode" value="maintenance" ${this.previewMode === 'maintenance' ? 'checked' : ''} onchange="window.PreviewApp.toggleMode('maintenance')">
                        Maintenance Mode
                    </label>
                </div>
            </div>
            <div class="preview-container">
                ${this.renderFormPreview()}
            </div>
        `;

        // Expose toggle globally for the radio buttons
        window.PreviewApp = window.PreviewApp || {};
        window.PreviewApp.toggleMode = (mode) => {
            this.previewMode = mode;
            this.renderInline(this.currentProduct, document.getElementById('builderList'));
        };
    },

    /**
     * Render the form preview
     * @returns {string}
     */
    renderFormPreview() {
        if (!this.currentProduct.fields || this.currentProduct.fields.length === 0) {
            return `
                <div class="preview-empty">
                    <p>No fields have been added to this product yet.</p>
                    <p>Go back to Step 2 to add fields to see a preview.</p>
                </div>
            `;
        }

        let html = '<form class="preview-form">';

        if (!this.currentProduct.sections || this.currentProduct.sections.length === 0) {
            // No sections defined, just render all fields in a single block
            const filteredFields = this.currentProduct.fields.filter(f =>
                this.previewMode === 'setup' || f.maintenanceEditable
            );

            html += `
                <div class="preview-section">
                    ${filteredFields.map(field => this.renderField(field)).join('')}
                </div>
            `;
        } else {
            // Render by sections if they exist
            this.currentProduct.sections.forEach(section => {
                const fields = this.currentProduct.fields.filter(f => f.sectionId === section.id && (this.previewMode === 'setup' || f.maintenanceEditable));
                if (fields.length === 0) return;

                html += `
                    <div class="preview-section">
                        <h4 class="preview-section-title">${Helpers.escapeHtml(section.name)}</h4>
                        ${fields.map(field => this.renderField(field)).join('')}
                    </div>
                `;
            });
        }

        html += '</form>';
        return html;
    },

    /**
     * Render a single field
     * @param {Field} field
     * @returns {string}
     */
    renderField(field) {
        const requiredMark = field.required ? '<span class="required-mark">*</span>' : '';
        const description = field.description ? `<small class="field-help">${Helpers.escapeHtml(field.description)}</small>` : '';

        let inputHtml = '';

        switch (field.dataType) {
            case 'text':
                inputHtml = `<input type="text" class="preview-input" placeholder="Enter ${Helpers.escapeHtml(field.label)}" ${field.required ? 'required' : ''} ${field.readOnly ? 'readonly' : ''}>`;
                break;

            case 'date':
                inputHtml = `<input type="date" class="preview-input" ${field.required ? 'required' : ''} ${field.readOnly ? 'readonly' : ''}>`;
                break;

            case 'optionlist':
                console.log('Rendering option list field:', field);
                if (field.multiSelect) {
                    // Multi-select checkboxes
                    inputHtml = '<div class="preview-checkbox-group">';
                    (field.options || []).forEach(option => {
                        inputHtml += `
                            <label class="preview-checkbox-label">
                                <input type="checkbox" ${field.readOnly ? 'disabled' : ''}>
                                ${Helpers.escapeHtml(option)}
                            </label>
                        `;
                    });
                    inputHtml += '</div>';
                } else {
                    // Single select dropdown
                    inputHtml = `
                        <select class="preview-input" ${field.required ? 'required' : ''} ${field.readOnly ? 'disabled' : ''}>
                            <option value="">Select ${Helpers.escapeHtml(field.label)}</option>
                            ${(field.options || []).map(opt =>
                        `<option value="${Helpers.escapeHtml(opt)}">${Helpers.escapeHtml(opt)}</option>`
                    ).join('')}
                        </select>
                    `;
                }
                break;

            default:
                inputHtml = `<input type="text" class="preview-input" placeholder="Enter ${Helpers.escapeHtml(field.label)}">`;
        }

        return `
            <div class="preview-field-group">
                <label class="preview-label">
                    ${Helpers.escapeHtml(field.label)}${requiredMark}
                </label>
                ${inputHtml}
                ${description}
            </div>
        `;
    }
};

export default Preview;
