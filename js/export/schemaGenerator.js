/**
 * Schema Generator - Export product definitions as JSON/YAML
 */

const SchemaGenerator = {
    /**
     * Generate JSON schema
     * @param {ProductDefinition} product
     * @returns {Object}
     */
    generateJSON(product) {
        return {
            $schema: 'https://json-schema.org/draft/2020-12/schema',
            $id: `products/${product.productCode}`,
            title: product.name,
            description: product.description,
            version: product.version,
            type: 'object',
            metadata: {
                productCode: product.productCode,
                businessLine: product.businessLine,
                geography: product.geography,
                status: product.status,
                createdBy: product.createdBy,
                createdAt: product.createdAt,
                updatedBy: product.updatedBy,
                updatedAt: product.updatedAt
            },
            sections: product.sections.map(s => ({
                id: s.id,
                name: s.name,
                description: s.description,
                displayOrder: s.displayOrder
            })),
            properties: this.generateProperties(product.fields),
            required: product.fields.filter(f => f.required).map(f => f.key),
            rules: product.rules
        };
    },

    /**
     * Generate properties from fields
     * @param {Field[]} fields
     * @returns {Object}
     */
    generateProperties(fields) {
        const properties = {};

        fields.forEach(field => {
            properties[field.key] = {
                type: this.mapDataType(field.dataType),
                title: field.label,
                description: field.description,
                ...this.getFieldConstraints(field)
            };
        });

        return properties;
    },

    /**
     * Map data type to JSON schema type
     * @param {string} dataType
     * @returns {string}
     */
    mapDataType(dataType) {
        const mapping = {
            text: 'string',
            number: 'number',
            boolean: 'boolean',
            date: 'string',
            datetime: 'string',
            enum: 'string',
            multiselect: 'array',
            reference: 'string',
            file: 'string'
        };

        return mapping[dataType] || 'string';
    },

    /**
     * Get field constraints
     * @param {Field} field
     * @returns {Object}
     */
    getFieldConstraints(field) {
        const constraints = {};
        const validation = field.validation || {};

        switch (field.dataType) {
            case 'text':
                if (validation.minLength) constraints.minLength = validation.minLength;
                if (validation.maxLength) constraints.maxLength = validation.maxLength;
                if (validation.pattern) constraints.pattern = validation.pattern;
                break;

            case 'number':
                if (validation.min !== undefined) constraints.minimum = validation.min;
                if (validation.max !== undefined) constraints.maximum = validation.max;
                break;

            case 'date':
            case 'datetime':
                constraints.format = field.dataType === 'date' ? 'date' : 'date-time';
                break;
        }

        if (field.defaultValue !== null && field.defaultValue !== undefined) {
            constraints.default = field.defaultValue;
        }

        constraints.applicable = field.applicable !== undefined ? field.applicable : true;
        constraints.editable = field.editable !== undefined ? field.editable : true;
        constraints.maintenanceEditable = field.maintenanceEditable !== undefined ? field.maintenanceEditable : true;

        return constraints;
    },

    /**
     * Generate YAML schema
     * @param {ProductDefinition} product
     * @returns {string}
     */
    generateYAML(product) {
        const jsonSchema = this.generateJSON(product);
        // Simple JSON to YAML conversion
        return this.jsonToYaml(jsonSchema);
    },

    /**
     * Convert JSON to YAML (simplified)
     * @param {Object} obj
     * @param {number} indent
     * @returns {string}
     */
    jsonToYaml(obj, indent = 0) {
        const spaces = '  '.repeat(indent);
        let yaml = '';

        for (const [key, value] of Object.entries(obj)) {
            if (value === null) {
                yaml += `${spaces}${key}: null\n`;
            } else if (typeof value === 'object' && !Array.isArray(value)) {
                yaml += `${spaces}${key}:\n`;
                yaml += this.jsonToYaml(value, indent + 1);
            } else if (Array.isArray(value)) {
                yaml += `${spaces}${key}:\n`;
                value.forEach(item => {
                    if (typeof item === 'object') {
                        yaml += `${spaces}  -\n`;
                        yaml += this.jsonToYaml(item, indent + 2);
                    } else {
                        yaml += `${spaces}  - ${item}\n`;
                    }
                });
            } else if (typeof value === 'string') {
                yaml += `${spaces}${key}: "${value}"\n`;
            } else {
                yaml += `${spaces}${key}: ${value}\n`;
            }
        }

        return yaml;
    }
};

export default SchemaGenerator;
