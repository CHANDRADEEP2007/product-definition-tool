/**
 * Sample Data for Demo/Testing
 */

import Models from '../models.js';

const SampleData = {
    /**
     * Get sample product definitions
     * @returns {ProductDefinition[]}
     */
    getSampleProducts() {
        const product1 = Models.createProductDefinition({
            productCode: 'PROD-001',
            name: 'Personal Loan',
            description: 'Consumer personal loan product',
            businessLine: 'Retail Banking',
            geography: 'North America',
            status: 'Published',
            createdBy: 'user-admin',
            updatedBy: 'user-admin'
        });

        // Add sections
        const generalSection = Models.createSection({
            productDefinitionId: product1.id,
            name: 'General Information',
            description: 'Basic loan details',
            displayOrder: 0
        });

        const pricingSection = Models.createSection({
            productDefinitionId: product1.id,
            name: 'Pricing',
            description: 'Interest rates and fees',
            displayOrder: 1
        });

        product1.sections = [generalSection, pricingSection];

        // Add fields
        product1.fields = [
            Models.createField({
                productDefinitionId: product1.id,
                sectionId: generalSection.id,
                key: 'loan_amount',
                label: 'Loan Amount',
                description: 'Requested loan amount',
                dataType: 'number',
                required: true,
                displayOrder: 0,
                validation: { min: 1000, max: 50000 }
            }),
            Models.createField({
                productDefinitionId: product1.id,
                sectionId: generalSection.id,
                key: 'loan_purpose',
                label: 'Loan Purpose',
                description: 'Purpose of the loan',
                dataType: 'enum',
                required: true,
                displayOrder: 1
            }),
            Models.createField({
                productDefinitionId: product1.id,
                sectionId: pricingSection.id,
                key: 'interest_rate_type',
                label: 'Interest Rate Type',
                description: 'Fixed or variable rate',
                dataType: 'enum',
                required: true,
                displayOrder: 0
            }),
            Models.createField({
                productDefinitionId: product1.id,
                sectionId: pricingSection.id,
                key: 'interest_rate',
                label: 'Interest Rate',
                description: 'Annual percentage rate',
                dataType: 'number',
                required: true,
                displayOrder: 1,
                validation: { min: 0, max: 100, decimals: 2 }
            })
        ];

        // Add a draft product
        const product2 = Models.createProductDefinition({
            productCode: 'PROD-002',
            name: 'Business Credit Card',
            description: 'Corporate credit card product',
            businessLine: 'Commercial Banking',
            geography: 'Global',
            status: 'Draft',
            createdBy: 'user-editor',
            updatedBy: 'user-editor'
        });

        return [product1, product2];
    },

    /**
     * Get sample question library items
     * @returns {QuestionLibraryItem[]}
     */
    getSampleQuestions() {
        return [
            Models.createQuestionLibraryItem({
                key: 'customer_legal_name',
                label: 'Customer Legal Name',
                description: 'Official registered name of the customer',
                dataType: 'text',
                defaultValidation: { minLength: 2, maxLength: 100 },
                status: 'Active',
                createdBy: 'user-admin'
            }),
            Models.createQuestionLibraryItem({
                key: 'country_of_residence',
                label: 'Country of Residence',
                description: 'Customer\'s primary country of residence',
                dataType: 'reference',
                defaultValidation: {},
                status: 'Active',
                createdBy: 'user-admin'
            }),
            Models.createQuestionLibraryItem({
                key: 'annual_revenue',
                label: 'Annual Revenue',
                description: 'Total annual revenue',
                dataType: 'number',
                defaultValidation: { min: 0 },
                status: 'Active',
                createdBy: 'user-admin'
            }),
            Models.createQuestionLibraryItem({
                key: 'incorporation_date',
                label: 'Incorporation Date',
                description: 'Date of business incorporation',
                dataType: 'date',
                defaultValidation: {},
                status: 'Active',
                createdBy: 'user-admin'
            })
        ];
    },

    /**
     * Initialize sample data
     */
    init() {
        return {
            productDefinitions: this.getSampleProducts(),
            questionLibrary: this.getSampleQuestions(),
            auditLog: []
        };
    }
};

export default SampleData;
