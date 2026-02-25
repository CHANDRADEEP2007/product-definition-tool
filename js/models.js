/**
 * Data Models for Product Definition Tool
 * Using JSDoc for type safety in vanilla JavaScript
 */

/**
 * @typedef {Object} ProductDefinition
 * @property {string} id - Unique identifier
 * @property {string} productCode - Product code
 * @property {string} name - Product name
 * @property {string} description - Product description
 * @property {string} businessLine - Business line/segment
 * @property {string} geography - Geographic region
 * @property {'Draft'|'In Review'|'Published'|'Deprecated'} status - Current status
 * @property {string} version - Version number (e.g., "1.0")
 * @property {string} createdBy - User who created
 * @property {string} createdAt - ISO timestamp
 * @property {string} updatedBy - User who last updated
 * @property {string} updatedAt - ISO timestamp
 * @property {Section[]} sections - Array of sections
 * @property {Field[]} fields - Array of fields
 * @property {Rule[]} rules - Array of rules
 */

/**
 * @typedef {Object} Section
 * @property {string} id - Unique identifier
 * @property {string} productDefinitionId - Parent product ID
 * @property {string|null} parentSectionId - Parent section ID (for nesting)
 * @property {string} name - Section name
 * @property {string} description - Section description
 * @property {number} displayOrder - Order in list
 */

/**
 * @typedef {Object} Field
 * @property {string} id - Unique identifier
 * @property {string} productDefinitionId - Parent product ID
 * @property {string} sectionId - Parent section ID
 * @property {string} key - Unique key within product
 * @property {string} label - Display label
 * @property {string} description - Field description
 * @property {string} helpText - Tooltip/help text
 * @property {string} placeholder - Placeholder text
 * @property {DataType} dataType - Data type
 * @property {boolean} applicable - Is conditionally applicable?
 * @property {boolean} required - Is required?
 * @property {boolean} editable - Is editable by end user?
 * @property {boolean} maintenanceEditable - Is editable during maintenance mode?
 * @property {*} defaultValue - Default value
 * @property {string|null} referenceId - Reference to library question
 * @property {number} displayOrder - Order in list
 * @property {Object} validation - Validation rules
 * @property {Object} metadata - Additional metadata
 */

/**
 * @typedef {'text'|'number'|'boolean'|'date'|'datetime'|'enum'|'multiselect'|'reference'|'file'} DataType
 */

/**
 * @typedef {Object} Option
 * @property {string} id - Unique identifier
 * @property {string} fieldId - Parent field ID
 * @property {string} code - Option code value
 * @property {string} label - Display label
 * @property {number} displayOrder - Order in list
 */

/**
 * @typedef {Object} Rule
 * @property {string} id - Unique identifier
 * @property {string} productDefinitionId - Parent product ID
 * @property {RuleTrigger} trigger - Extracted trigger constraint
 * @property {RuleAction[]} actions - Array of actions when true
 * @property {string} errorMessage - Error message for validation rules
 */

/**
 * @typedef {Object} RuleTrigger
 * @property {'user'} subject - Hardcoded to 'user'
 * @property {'selects'|'deselects'|'selects_any_except'} operator - Operator
 * @property {string} source_question_id - Field key triggering this rule
 * @property {string} option_value - The specific option code/label triggering
 */

/**
 * @typedef {Object} RuleAction
 * @property {string} target_question_id - Field targeted
 * @property {'visibility'|'required'|'editable'} property - Property to mutate
 * @property {boolean} value - True/False state for the property
 */

/**
 * @typedef {Object} QuestionLibraryItem
 * @property {string} id - Unique identifier
 * @property {string} key - Canonical key
 * @property {string} label - Canonical label
 * @property {string} description - Description
 * @property {DataType} dataType - Data type
 * @property {Object} defaultValidation - Default validation rules
 * @property {Option[]} defaultOptions - Default options (if applicable)
 * @property {'Active'|'Deprecated'} status - Status
 * @property {string[]} usedIn - Array of product IDs using this question
 * @property {string} createdBy - Creator
 * @property {string} createdAt - ISO timestamp
 */

/**
 * @typedef {Object} AuditEntry
 * @property {string} id - Unique identifier
 * @property {string} productDefinitionId - Related product ID
 * @property {string} actor - User who made change
 * @property {string} timestamp - ISO timestamp
 * @property {string} action - Action type
 * @property {string} summary - Change summary
 * @property {Object|null} diff - Detailed diff (optional)
 */

/**
 * @typedef {Object} User
 * @property {string} id - User ID
 * @property {string} username - Username
 * @property {string} name - Display name
 * @property {string} email - Email address
 * @property {'Admin'|'Editor'|'Viewer'} role - User role
 */

// Factory functions for creating model instances

export const Models = {
    /**
     * Create a new ProductDefinition
     * @param {Partial<ProductDefinition>} data
     * @returns {ProductDefinition}
     */
    createProductDefinition(data = {}) {
        const now = new Date().toISOString();
        return {
            id: data.id || generateId(),
            productCode: data.productCode || '',
            name: data.name || '',
            description: data.description || '',
            businessLine: data.businessLine || '',
            geography: data.geography || '',
            status: data.status || 'Draft',
            version: data.version || '1.0',
            createdBy: data.createdBy || '',
            createdAt: data.createdAt || now,
            updatedBy: data.updatedBy || '',
            updatedAt: data.updatedAt || now,
            sections: data.sections || [],
            fields: data.fields || [],
            rules: data.rules || []
        };
    },

    /**
     * Create a new Section
     * @param {Partial<Section>} data
     * @returns {Section}
     */
    createSection(data = {}) {
        return {
            id: data.id || generateId(),
            productDefinitionId: data.productDefinitionId || '',
            parentSectionId: data.parentSectionId || null,
            name: data.name || 'New Section',
            description: data.description || '',
            displayOrder: data.displayOrder || 0
        };
    },

    /**
     * Create a new Field
     * @param {Partial<Field>} data
     * @returns {Field}
     */
    createField(data = {}) {
        return {
            id: data.id || generateId(),
            productDefinitionId: data.productDefinitionId || '',
            sectionId: data.sectionId || '',
            key: data.key || generateKey(data.label || 'field'),
            label: data.label || 'New Field',
            description: data.description || '',
            helpText: data.helpText || '',
            placeholder: data.placeholder || '',
            dataType: data.dataType || 'text',
            applicable: data.applicable !== undefined ? data.applicable : true,
            required: data.required || false,
            editable: data.editable !== undefined ? data.editable : true,
            maintenanceEditable: data.maintenanceEditable !== undefined ? data.maintenanceEditable : true,
            defaultValue: data.defaultValue || null,
            referenceId: data.referenceId || null,
            displayOrder: data.displayOrder || 0,
            validation: data.validation || {},
            options: data.options || [],
            multiSelect: data.multiSelect || false,
            metadata: data.metadata || {}
        };
    },

    /**
     * Create a new Option
     * @param {Partial<Option>} data
     * @returns {Option}
     */
    createOption(data = {}) {
        return {
            id: data.id || generateId(),
            fieldId: data.fieldId || '',
            code: data.code || '',
            label: data.label || '',
            displayOrder: data.displayOrder || 0
        };
    },

    /**
     * Create a new Rule
     * @param {Partial<Rule>} data
     * @returns {Rule}
     */
    createRule(data = {}) {
        return {
            id: data.id || generateId(),
            productDefinitionId: data.productDefinitionId || '',
            trigger: data.trigger || { subject: 'user', operator: 'selects', source_question_id: '', option_value: '' },
            actions: data.actions || [],
            errorMessage: data.errorMessage || ''
        };
    },


    /**
     * Create a new Question Library Item
     * @param {Partial<QuestionLibraryItem>} data
     * @returns {QuestionLibraryItem}
     */
    createQuestionLibraryItem(data = {}) {
        const now = new Date().toISOString();
        return {
            id: data.id || generateId(),
            key: data.key || generateKey(data.label || 'question'),
            label: data.label || '',
            description: data.description || '',
            dataType: data.dataType || 'text',
            defaultValidation: data.defaultValidation || {},
            defaultOptions: data.defaultOptions || [],
            status: data.status || 'Active',
            usedIn: data.usedIn || [],
            createdBy: data.createdBy || '',
            createdAt: data.createdAt || now
        };
    },

    /**
     * Create a new Audit Entry
     * @param {Partial<AuditEntry>} data
     * @returns {AuditEntry}
     */
    createAuditEntry(data = {}) {
        return {
            id: data.id || generateId(),
            productDefinitionId: data.productDefinitionId || '',
            actor: data.actor || '',
            timestamp: data.timestamp || new Date().toISOString(),
            action: data.action || '',
            summary: data.summary || '',
            diff: data.diff || null
        };
    }
};

/**
 * Generate a unique ID
 * @returns {string}
 */
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a key from a label
 * @param {string} label
 * @returns {string}
 */
function generateKey(label) {
    return label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
}

// Validation operators
export const OPERATORS = {
    EQUALS: 'equals',
    NOT_EQUALS: 'not_equals',
    GREATER_THAN: 'greater_than',
    LESS_THAN: 'less_than',
    GREATER_OR_EQUAL: 'greater_or_equal',
    LESS_OR_EQUAL: 'less_or_equal',
    IN_LIST: 'in_list',
    NOT_IN_LIST: 'not_in_list',
    IS_EMPTY: 'is_empty',
    IS_NOT_EMPTY: 'is_not_empty',
    CONTAINS: 'contains',
    NOT_CONTAINS: 'not_contains'
};

// Data types configuration
export const DATA_TYPES = {
    TEXT: 'text',
    NUMBER: 'number',
    BOOLEAN: 'boolean',
    DATE: 'date',
    DATETIME: 'datetime',
    ENUM: 'enum',
    MULTISELECT: 'multiselect',
    REFERENCE: 'reference',
    FILE: 'file'
};

export default Models;
