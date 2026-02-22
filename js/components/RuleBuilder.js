/**
 * Rule Builder Component
 */

import ModalDialog from './ModalDialog.js';
import Helpers from '../utils/helpers.js';

const RuleBuilder = {
    /**
     * Render the rule builder for a field
     * @param {HTMLElement} container
     * @param {Object} field
     * @param {Function} onSave - Callback when rules are saved
     */
    render(container, field, onSave) {
        this.container = container;
        this.field = field;
        this.onSave = onSave;

        // Initialize rules if not present
        if (!this.field.rules) {
            this.field.rules = [];
        }

        this.renderUI();
    },

    /**
     * Render the main UI
     */
    renderUI() {
        Helpers.clearElement(this.container);

        const wrapper = document.createElement('div');
        wrapper.className = 'rule-builder';

        wrapper.innerHTML = `
            <div class="rule-builder-header">
                <h4>Logic Rules</h4>
                <button class="btn btn-secondary btn-sm" id="addRuleBtn">
                    <span>+</span> Add Rule
                </button>
            </div>
            <div class="rules-list" id="rulesList"></div>
        `;

        this.container.appendChild(wrapper);

        this.renderRulesList();

        // Event listeners
        wrapper.querySelector('#addRuleBtn').addEventListener('click', () => this.addRule());
    },

    /**
     * Render the list of rules
     */
    renderRulesList() {
        const list = document.getElementById('rulesList');
        if (!list) return;

        Helpers.clearElement(list);

        if (this.field.rules.length === 0) {
            list.innerHTML = '<p class="text-muted text-sm">No rules defined.</p>';
            return;
        }

        this.field.rules.forEach((rule, index) => {
            const ruleEl = document.createElement('div');
            ruleEl.className = 'rule-item';

            // Determine action label based on type
            let actionLabel = rule.action;
            if (rule.action === 'select_any_except') actionLabel = 'Select Any Except';

            ruleEl.innerHTML = `
                <div class="rule-header">
                    <span class="rule-type">Rule #${index + 1}</span>
                    <button class="btn-icon btn-sm text-danger" data-index="${index}" title="Delete Rule">🗑️</button>
                </div>
                <div class="rule-content">
                    <div class="condition-group">
                        <strong>IF</strong> ${Helpers.escapeHtml(rule.condition.fieldKey)} 
                        <span class="badge badge-draft">${rule.condition.operator}</span> 
                        "${Helpers.escapeHtml(rule.condition.value)}"
                    </div>
                    <div class="action-group">
                        <strong>THEN</strong> <span class="text-primary">${actionLabel}</span> 
                        "${Helpers.escapeHtml(rule.value)}"
                    </div>
                </div>
            `;

            // Delete button
            ruleEl.querySelector('button').addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index);
                this.deleteRule(idx);
            });

            list.appendChild(ruleEl);
        });
    },

    /**
     * Add a new rule
     */
    async addRule() {
        // 1. Select Trigger Field
        // For simplicity, we'll ask for the Field Key manually or select from existing fields if we had access to them.
        // Ideally, we should pass the full product definition to RuleBuilder to list other fields.
        // For now, we'll use a simple input for Field Key.

        const triggerFieldKey = await ModalDialog.input(
            'Add Rule - Step 1/3',
            'Enter the Key of the field that triggers this rule:',
            '',
            { required: true, placeholder: 'e.g. country' }
        );
        if (!triggerFieldKey) return;

        // 2. Define Condition
        const conditionForm = await ModalDialog.form('Add Rule - Step 2/3: Condition', [
            {
                name: 'operator',
                label: 'Operator',
                type: 'select',
                required: true,
                options: [
                    { value: 'equals', label: 'Equals' },
                    { value: 'not_equals', label: 'Does not equal' },
                    { value: 'contains', label: 'Contains' }
                ]
            },
            {
                name: 'value',
                label: 'Value',
                type: 'text',
                required: true,
                placeholder: 'Value to match'
            }
        ]);
        if (!conditionForm) return;

        // 3. Define Action
        // Action options depend on current field type
        let actionOptions = [];

        if (this.field.dataType === 'optionlist') {
            if (this.field.multiSelect) {
                actionOptions = [
                    { value: 'select', label: 'Select (Add)' },
                    { value: 'deselect', label: 'Deselect (Remove)' }
                ];
            } else {
                actionOptions = [
                    { value: 'select', label: 'Select (Set Value)' },
                    { value: 'select_any_except', label: 'Select Any Except' }
                ];
            }
        } else {
            // Default actions for other types
            actionOptions = [
                { value: 'set_value', label: 'Set Value' },
                { value: 'clear', label: 'Clear Value' }
            ];
        }

        const actionForm = await ModalDialog.form('Add Rule - Step 3/3: Action', [
            {
                name: 'action',
                label: 'Action',
                type: 'select',
                required: true,
                options: actionOptions
            },
            {
                name: 'value',
                label: 'Value',
                type: 'text',
                required: true,
                placeholder: 'Value to apply'
            }
        ]);
        if (!actionForm) return;

        // Construct Rule
        const newRule = {
            condition: {
                fieldKey: triggerFieldKey,
                operator: conditionForm.operator,
                value: conditionForm.value
            },
            action: actionForm.action,
            value: actionForm.value
        };

        this.field.rules.push(newRule);
        this.onSave(); // Trigger save
        this.renderRulesList();
    },

    /**
     * Delete a rule
     * @param {number} index
     */
    async deleteRule(index) {
        const confirmed = await ModalDialog.confirm(
            'Delete Rule',
            'Are you sure you want to delete this rule?',
            { danger: true }
        );

        if (confirmed) {
            this.field.rules.splice(index, 1);
            this.onSave();
            this.renderRulesList();
        }
    }
};

export default RuleBuilder;
