/**
 * Validation Utilities
 */

import { OPERATORS } from '../models.js';

const Validation = {
    /**
     * Validate field value based on data type and validation rules
     * @param {*} value - Value to validate
     * @param {Field} field - Field definition
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validateField(value, field) {
        const errors = [];

        // Required check
        if (field.required && this.isEmpty(value)) {
            errors.push(`${field.label} is required`);
            return { valid: false, errors };
        }

        // Skip other validations if empty and not required
        if (this.isEmpty(value)) {
            return { valid: true, errors: [] };
        }

        // Type-specific validation
        const validation = field.validation || {};

        switch (field.dataType) {
            case 'text':
                this.validateText(value, validation, field.label, errors);
                break;
            case 'number':
                this.validateNumber(value, validation, field.label, errors);
                break;
            case 'date':
            case 'datetime':
                this.validateDate(value, validation, field.label, errors);
                break;
            case 'enum':
                this.validateEnum(value, field.options, field.label, errors);
                break;
            case 'multiselect':
                this.validateMultiselect(value, field.options, field.label, errors);
                break;
        }

        return {
            valid: errors.length === 0,
            errors
        };
    },

    /**
     * Validate text field
     */
    validateText(value, validation, label, errors) {
        const strValue = String(value);

        if (validation.minLength && strValue.length < validation.minLength) {
            errors.push(`${label} must be at least ${validation.minLength} characters`);
        }

        if (validation.maxLength && strValue.length > validation.maxLength) {
            errors.push(`${label} must be no more than ${validation.maxLength} characters`);
        }

        if (validation.pattern) {
            const regex = new RegExp(validation.pattern);
            if (!regex.test(strValue)) {
                errors.push(`${label} format is invalid`);
            }
        }
    },

    /**
     * Validate number field
     */
    validateNumber(value, validation, label, errors) {
        const numValue = Number(value);

        if (isNaN(numValue)) {
            errors.push(`${label} must be a valid number`);
            return;
        }

        if (validation.min !== undefined && numValue < validation.min) {
            errors.push(`${label} must be at least ${validation.min}`);
        }

        if (validation.max !== undefined && numValue > validation.max) {
            errors.push(`${label} must be no more than ${validation.max}`);
        }

        if (validation.decimals === 0 && !Number.isInteger(numValue)) {
            errors.push(`${label} must be a whole number`);
        }
    },

    /**
     * Validate date field
     */
    validateDate(value, validation, label, errors) {
        const date = new Date(value);

        if (isNaN(date.getTime())) {
            errors.push(`${label} must be a valid date`);
            return;
        }

        if (validation.minDate) {
            const minDate = new Date(validation.minDate);
            if (date < minDate) {
                errors.push(`${label} must be after ${minDate.toLocaleDateString()}`);
            }
        }

        if (validation.maxDate) {
            const maxDate = new Date(validation.maxDate);
            if (date > maxDate) {
                errors.push(`${label} must be before ${maxDate.toLocaleDateString()}`);
            }
        }
    },

    /**
     * Validate enum field
     */
    validateEnum(value, options, label, errors) {
        if (!options || options.length === 0) return;

        const validValues = options.map(opt => opt.code);
        if (!validValues.includes(value)) {
            errors.push(`${label} must be one of the allowed values`);
        }
    },

    /**
     * Validate multiselect field
     */
    validateMultiselect(value, options, label, errors) {
        if (!Array.isArray(value)) {
            errors.push(`${label} must be an array`);
            return;
        }

        if (!options || options.length === 0) return;

        const validValues = options.map(opt => opt.code);
        const invalidValues = value.filter(v => !validValues.includes(v));

        if (invalidValues.length > 0) {
            errors.push(`${label} contains invalid values`);
        }
    },

    /**
     * Check if value is empty
     */
    isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string' && value.trim() === '') return true;
        if (Array.isArray(value) && value.length === 0) return true;
        return false;
    },

    /**
     * Validate product definition
     * @param {ProductDefinition} product
     * @returns {{ valid: boolean, errors: Object }}
     */
    validateProductDefinition(product) {
        const errors = {};

        // Basic metadata validation
        if (!product.name || product.name.trim() === '') {
            errors.name = 'Product name is required';
        }

        if (!product.productCode || product.productCode.trim() === '') {
            errors.productCode = 'Product code is required';
        }

        // Check for duplicate field keys
        const fieldKeys = new Map();
        product.fields.forEach((field, index) => {
            if (fieldKeys.has(field.key)) {
                errors[`field_${field.id}`] = `Duplicate field key: ${field.key}`;
            } else {
                fieldKeys.set(field.key, field);
            }
        });

        // Validate rules reference existing fields
        product.rules.forEach(rule => {
            rule.conditions.forEach(condition => {
                const field = product.fields.find(f => f.id === condition.fieldId);
                if (!field) {
                    errors[`rule_${rule.id}`] = 'Rule references non-existent field';
                }
            });

            if (rule.targetType === 'field') {
                const targetField = product.fields.find(f => f.id === rule.targetId);
                if (!targetField) {
                    errors[`rule_${rule.id}_target`] = 'Rule target field not found';
                }
            } else if (rule.targetType === 'section') {
                const targetSection = product.sections.find(s => s.id === rule.targetId);
                if (!targetSection) {
                    errors[`rule_${rule.id}_target`] = 'Rule target section not found';
                }
            }
        });

        return {
            valid: Object.keys(errors).length === 0,
            errors
        };
    },

    /**
     * Validate unique key within product
     * @param {string} key
     * @param {string} excludeFieldId
     * @param {Field[]} fields
     * @returns {boolean}
     */
    isKeyUnique(key, excludeFieldId, fields) {
        return !fields.some(f => f.key === key && f.id !== excludeFieldId);
    },

    /**
     * Sanitize key
     * @param {string} key
     * @returns {string}
     */
    sanitizeKey(key) {
        return key
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_')
            .replace(/^_+|_+$/g, '')
            .replace(/_+/g, '_');
    }
};

export default Validation;
