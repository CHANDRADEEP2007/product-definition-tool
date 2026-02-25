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
     * @param {Object} productDefinition - Full product context to pull fields and options from
     * @param {Function} onSave - Callback when rules are saved
     */
    render(container, field, productDefinition, onSave) {
        this.container = container;
        this.field = field;
        this.productDefinition = productDefinition;
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
            list.innerHTML = '<p class="text-muted text-sm">No rules defined for this question.</p>';
            return;
        }

        this.field.rules.forEach((rule, index) => {
            const ruleEl = document.createElement('div');
            ruleEl.className = 'rule-item';

            // Build action text
            const actionsText = rule.actions && rule.actions.length > 0
                ? rule.actions.map(a => `make ${Helpers.escapeHtml(a.target_question_id)} ${a.value ? '' : 'Not '}${Helpers.escapeHtml(a.property)}`).join(', ')
                : 'None';

            // Format constraint: If User [operator] [option] in [source question]
            const opDisplay = rule.trigger.operator.replace(/_/g, ' '); // selects_any_except -> selects any except

            ruleEl.innerHTML = `
                <div class="rule-header">
                    <span class="rule-type">Rule #${index + 1}</span>
                    <button class="btn-icon btn-sm text-danger" data-index="${index}" title="Delete Rule">🗑️</button>
                </div>
                <div class="rule-content">
                    <div class="condition-group" style="padding: 12px; background: var(--color-bg-tertiary); border-radius: var(--radius-sm); margin-bottom: 8px;">
                        <span class="text-secondary">If</span> <strong>User</strong> 
                        <span class="text-primary">${Helpers.escapeHtml(opDisplay)}</span> 
                        <span class="badge badge-draft">"${Helpers.escapeHtml(rule.trigger.option_value)}"</span>
                        <span class="text-secondary">in</span> <strong>${Helpers.escapeHtml(rule.trigger.source_question_id)}</strong>
                    </div>
                    <div class="action-group" style="padding: 12px; background: var(--color-bg-primary); border-radius: var(--radius-sm);">
                        <strong>Then</strong> <span class="text-primary">${actionsText}</span>
                    </div>
                </div>
            `;

            // Delete button
            const btn = ruleEl.querySelector('button');
            if (btn) {
                btn.addEventListener('click', (e) => {
                    const idx = parseInt(e.currentTarget.dataset.index);
                    this.deleteRule(idx);
                });
            }

            list.appendChild(ruleEl);
        });
    },

    /**
     * Add a new rule wizard flow
     */
    async addRule() {
        // Find valid active optionlist questions for source dropdown (excluding self)
        const validSourceQuestions = (this.productDefinition?.fields || [])
            .filter(f => f.dataType === 'optionlist' && f.status !== 'Deprecated')
            .map(f => ({ value: f.key || f.id, label: f.label || f.key || f.id }));

        if (validSourceQuestions.length === 0) {
            alert('No active Multiple Choice questions found in this product to act as a trigger source.');
            return;
        }

        // --- STEP 1: Define Trigger Source & Operator ---
        const triggerForm = await ModalDialog.form('Add Rule - Step 1/3: Trigger', [
            {
                name: 'operator',
                label: 'If User...',
                type: 'select',
                required: true,
                options: [
                    { value: 'selects', label: 'selects' },
                    { value: 'deselects', label: 'deselects' },
                    { value: 'selects_any_except', label: 'selects any except' }
                ]
            },
            {
                name: 'source_question_id',
                label: 'In Question',
                type: 'select',
                required: true,
                options: validSourceQuestions
            }
        ]);
        if (!triggerForm) return;

        // Self-Reference Check (Backend backup, but enforcing UI here)
        if (triggerForm.source_question_id === (this.field.key || this.field.id)) {
            alert('Cannot create a rule that evaluates its own field value (Self-Reference).');
            return;
        }

        // --- STEP 2: Pick Option ---
        // Find the selected source field to get its options options
        const sourceField = this.productDefinition.fields.find(f => (f.key || f.id) === triggerForm.source_question_id);
        const sourceOptionsList = (sourceField?.options || []).map(o => ({ value: o.code || o.label, label: o.label || o.code }));

        if (sourceOptionsList.length === 0) {
            alert(`The selected source question "${triggerForm.source_question_id}" has no configured options to trigger against.`);
            return;
        }

        const optionForm = await ModalDialog.form('Add Rule - Step 2/3: Option Value', [
            {
                name: 'option_value',
                label: 'Target Option',
                type: 'select',
                required: true,
                options: sourceOptionsList
            }
        ]);
        if (!optionForm) return;

        // --- STEP 3: Define Target Action ---
        // Find valid target questions (excluding source question to prevent circular via UI, and excluding deleted)
        // Note: The UI explicitly excludes the source _trigger_ question.
        const validTargetQuestions = (this.productDefinition?.fields || [])
            .filter(f => f.status !== 'Deprecated' && (f.key || f.id) !== triggerForm.source_question_id)
            .map(f => ({ value: f.key || f.id, label: f.label || f.key || f.id }));

        if (validTargetQuestions.length === 0) {
            alert('No valid target questions available to mutate.');
            return;
        }

        const actionForm = await ModalDialog.form('Add Rule - Step 3/3: Action (Then)', [
            {
                name: 'target_question_id',
                label: 'Target Question (Cannot be trigger)',
                type: 'select',
                required: true,
                options: validTargetQuestions
            },
            {
                name: 'property',
                label: 'Property to Change',
                type: 'select',
                required: true,
                options: [
                    { value: 'visibility', label: 'Visibility' },
                    { value: 'required', label: 'Required' },
                    { value: 'editable', label: 'Editable' }
                ]
            },
            {
                name: 'value',
                label: 'Target State',
                type: 'select',
                required: true,
                options: [
                    { value: 'true', label: 'True (Make property apply)' },
                    { value: 'false', label: 'False (Remove property)' }
                ]
            }
        ]);
        if (!actionForm) return;

        // Construct full Rule to match PRD constraint schema
        const newRule = {
            id: `rule_${Date.now()}`,
            trigger: {
                subject: 'user',
                operator: triggerForm.operator,
                source_question_id: triggerForm.source_question_id,
                option_value: optionForm.option_value
            },
            actions: [
                {
                    target_question_id: actionForm.target_question_id,
                    property: actionForm.property,
                    value: actionForm.value === 'true'
                }
            ]
        };

        this.field.rules.push(newRule);
        this.onSave(); // Trigger save to cascade state update
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
