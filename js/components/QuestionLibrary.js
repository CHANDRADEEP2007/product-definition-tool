/**
 * Question Library Component
 */

import state from '../state.js';
import Permissions from '../auth/permissions.js';
import Helpers from '../utils/helpers.js';

const QuestionLibrary = {
    init() {
        this.setupEventListeners();
        this.render();
    },

    setupEventListeners() {
        const createBtn = document.getElementById('createQuestionBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.createQuestion());
            Permissions.toggleElement(createBtn, 'library:create');
        }
    },

    createQuestion() {
        if (!Permissions.can('library:create')) {
            alert('You do not have permission to create library questions');
            return;
        }
        alert('Create question - to be implemented');
    },

    render() {
        const container = document.getElementById('libraryList');
        if (!container) return;

        const questions = state.getQuestionLibrary();
        Helpers.clearElement(container);

        if (questions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📚</div>
                    <p>No questions in library</p>
                </div>
            `;
            return;
        }

        questions.forEach(q => {
            const item = this.createQuestionItem(q);
            container.appendChild(item);
        });
    },

    createQuestionItem(question) {
        const item = document.createElement('div');
        item.className = 'library-item';

        item.innerHTML = `
            <div class="library-item-header">
                <h3 class="library-item-title">${Helpers.escapeHtml(question.label)}</h3>
                <span class="badge badge-${question.status.toLowerCase()}">${question.status}</span>
            </div>
            <div class="library-item-meta">
                <strong>Key:</strong> <code>${question.key}</code> | 
                <strong>Type:</strong> ${question.dataType}
            </div>
            ${question.description ? `<p class="library-item-desc">${Helpers.escapeHtml(question.description)}</p>` : ''}
        `;

        return item;
    }
};

export default QuestionLibrary;
