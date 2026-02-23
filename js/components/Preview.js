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

        // Attach listeners for dynamic rules evaluation
        setTimeout(() => this.attachRuleListeners(), 0);
    },

    /**
     * Attach rule event listeners to the preview form inputs
     */
    attachRuleListeners() {
        const form = document.querySelector('.preview-form');
        if (!form) return;

        form.addEventListener('change', (e) => {
            this.evaluateRules();
        });

        // Initial Evaluation
        this.evaluateRules();
    },

    /**
     * Evaluate all rules and apply effects
     */
    evaluateRules() {
        // Collect current form data
        const formData = {};
        this.currentProduct.fields.forEach(f => {
            const input = document.getElementById(`preview-field-${f.id}`);
            if (!input) return;

            if (input.type === 'checkbox') {
                // If grouped checkboxes
                const wrapper = input.closest('.preview-checkbox-group');
                if (wrapper) {
                    const checked = Array.from(wrapper.querySelectorAll('input:checked')).map(cb => cb.value);
                    formData[f.key] = checked.length === 1 ? checked[0] : checked;
                } else {
                    formData[f.key] = input.checked;
                }
            } else if (input.tagName === 'SELECT') {
                formData[f.key] = input.value;
            } else {
                formData[f.key] = input.value;
            }
        });

        // Evaluate rules
        this.currentProduct.fields.forEach(field => {
            if (!field.rules || field.rules.length === 0) return;

            field.rules.forEach(rule => {
                const condition = rule.condition;
                const sourceValue = formData[condition.fieldKey];
                let isMatch = false;

                // Evaluate condition
                if (sourceValue !== undefined) {
                    const targetValue = condition.value;
                    if (condition.operator === 'equals') {
                        // Check if sourceValue is array (multiselect) or scalar
                        if (Array.isArray(sourceValue)) {
                            isMatch = sourceValue.includes(targetValue);
                        } else {
                            isMatch = (sourceValue === targetValue);
                        }
                    } else if (condition.operator === 'not_equals') {
                        if (Array.isArray(sourceValue)) {
                            isMatch = !sourceValue.includes(targetValue);
                        } else {
                            isMatch = (sourceValue !== targetValue);
                        }
                    } else if (condition.operator === 'contains') {
                        isMatch = sourceValue && typeof sourceValue === 'string' && sourceValue.includes(targetValue);
                    }
                }

                // Apply Action If Matched
                if (isMatch && rule.targetFieldKey) {
                    this.applyRuleAction(rule.targetFieldKey, rule.action);
                } else if (!isMatch && rule.targetFieldKey) {
                    this.reverseRuleAction(rule.targetFieldKey, rule.action);
                }
            });
        });
    },

    /**
     * Apply the rule action to the target field
     */
    applyRuleAction(targetFieldKey, action) {
        const targetField = this.currentProduct.fields.find(f => f.key === targetFieldKey);
        if (!targetField) return;

        const wrapper = document.getElementById(`preview-wrapper-${targetField.id}`);
        const input = document.getElementById(`preview-field-${targetField.id}`);
        const label = wrapper?.querySelector('.preview-label');

        if (!wrapper || !input) return;

        switch (action) {
            case 'show':
                wrapper.style.display = 'block';
                break;
            case 'hide':
                wrapper.style.display = 'none';
                // Also clear value conceptually if hidden, though JS visually handles it.
                break;
            case 'setRequired':
                input.required = true;
                if (label && !label.querySelector('.required-mark')) {
                    label.innerHTML += '<span class="required-mark">*</span>';
                }
                break;
            case 'setNotRequired':
                input.required = false;
                if (label) {
                    const mark = label.querySelector('.required-mark');
                    if (mark) mark.remove();
                }
                break;
            case 'setEditable':
                input.disabled = false;
                input.readOnly = false;
                break;
            case 'setNotEditable':
                input.disabled = true;
                input.readOnly = true;
                break;
        }
    },

    /**
     * Reverse rule action if condition is false
     */
    reverseRuleAction(targetFieldKey, action) {
        // Map forward actions to their natural revert actions
        const reverseMap = {
            'show': 'hide',
            'hide': 'show',
            'setRequired': 'setNotRequired',
            'setNotRequired': 'setRequired',
            'setEditable': 'setNotEditable',
            'setNotEditable': 'setEditable'
        };
        const revertAction = reverseMap[action];
        if (revertAction) {
            this.applyRuleAction(targetFieldKey, revertAction);
        }
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
                if (field.validation?.inputType === 'numeric') {
                    const minAttr = field.validation?.min !== undefined ? `min="${field.validation.min}"` : '';
                    const maxAttr = field.validation?.max !== undefined ? `max="${field.validation.max}"` : '';
                    inputHtml = `<input type="number" id="preview-field-${field.id}" class="preview-input" placeholder="Enter ${Helpers.escapeHtml(field.label)}" ${field.required ? 'required' : ''} ${field.readOnly ? 'readonly' : ''} ${minAttr} ${maxAttr}>`;
                } else {
                    inputHtml = `<input type="text" id="preview-field-${field.id}" class="preview-input" placeholder="Enter ${Helpers.escapeHtml(field.label)}" ${field.required ? 'required' : ''} ${field.readOnly ? 'readonly' : ''}>`;
                }
                break;

            case 'date':
                const minDateAttr = field.validation?.min_date ? `min="${field.validation.min_date}"` : '';
                const maxDateAttr = field.validation?.max_date ? `max="${field.validation.max_date}"` : '';
                inputHtml = `<input type="date" id="preview-field-${field.id}" class="preview-input" ${field.required ? 'required' : ''} ${field.readOnly ? 'readonly' : ''} ${minDateAttr} ${maxDateAttr}>`;
                break;

            case 'optionlist':
                if (field.multiSelect) {
                    // Multi-select checkboxes
                    inputHtml = `<div class="preview-checkbox-group" id="preview-field-${field.id}">`;
                    (field.options || []).forEach(option => {
                        inputHtml += `
                            <label class="preview-checkbox-label">
                                <input type="checkbox" value="${Helpers.escapeHtml(option.code || option)}" ${field.readOnly ? 'disabled' : ''}>
                                ${Helpers.escapeHtml(option.label || option)}
                            </label>
                        `;
                    });
                    inputHtml += '</div>';
                } else {
                    // Single select dropdown
                    inputHtml = `
                        <select id="preview-field-${field.id}" class="preview-input" ${field.required ? 'required' : ''} ${field.readOnly ? 'disabled' : ''}>
                            <option value="">Select ${Helpers.escapeHtml(field.label)}</option>
                            ${(field.options || []).map(opt =>
                        `<option value="${Helpers.escapeHtml(opt.code || opt)}">${Helpers.escapeHtml(opt.label || opt)}</option>`
                    ).join('')}
                        </select>
                    `;
                }
                break;

            default:
                inputHtml = `<input type="text" id="preview-field-${field.id}" class="preview-input" placeholder="Enter ${Helpers.escapeHtml(field.label)}">`;
        }

        return `
            <div class="preview-field-group" id="preview-wrapper-${field.id}">
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
