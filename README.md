# Product Definition Developer Tool

A web-based visual tool that enables product owners to design product definitions as configuration, not code.

## Features

✨ **Phase 1 MVP Features:**
- Drag-and-drop visual designer
- Create and manage product definitions
- Define sections and fields with multiple data types
- Question library for reusable components
- Export schemas as JSON/YAML
- Role-based access control (Admin, Editor, Viewer)
- Version management
- Local storage persistence

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Edge, Safari)
- No build tools or server required!

### Installation

1. Clone or download this repository
2. Open `index.html` in your web browser

That's it! The application runs entirely in the browser.

### Demo Accounts

The application comes with three demo accounts:

| Username | Password | Role | Permissions |
|----------|----------|------|-------------|
| `admin` | admin123 | Admin | Full access to all features |
| `editor` | editor123 | Editor | Create/edit products, view library |
| `viewer` | viewer123 | Viewer | Read-only access |

## Usage

### Creating a Product Definition

1. Login with one of the demo accounts
2. Click **"New Product"** button
3. Enter product name and code
4. Drag elements from the left toolbox onto the canvas:
   - **Section** - Organize fields into logical groups
   - **Field Types** - Add different types of fields (text, number, date, etc.)
5. Click on any field to edit its properties in the right panel
6. Click **"Save"** to save your work

### Exporting Schemas

1. Open a product definition in the designer
2. Click **"Export"** button
3. Choose JSON or YAML format
4. The schema file will download automatically

### Question Library

1. Click on **"Question Library"** in the navigation
2. Browse reusable question templates
3. Use these questions across multiple products for consistency

## Architecture

### Technology Stack

- **HTML5** - Semantic structure
- **Vanilla CSS** - Custom design system with premium dark theme
- **Vanilla JavaScript (ES6+)** - Modular architecture with ES modules
- **Local Storage** - Client-side data persistence

### Project Structure

```
product-definition-tool/
├── index.html                 # Main HTML entry point
├── styles/
│   ├── index.css             # Design system & layout
│   └── components.css        # Component styles
├── js/
│   ├── app.js                # Main application controller
│   ├── models.js             # Data models & factories
│   ├── state.js              # State management
│   ├── auth/
│   │   ├── auth.js           # Authentication
│   │   └── permissions.js    # RBAC system
│   ├── components/
│   │   ├── ProductList.js    # Product list view
│   │   ├── Designer.js       # Visual designer canvas
│   │   ├── QuestionLibrary.js# Question library
│   │   └── ...               # Other components
│   ├── core/
│   │   └── ruleEngine.js     # Rule evaluation
│   ├── export/
│   │   └── schemaGenerator.js# JSON/YAML export
│   ├── utils/
│   │   ├── storage.js        # Local storage wrapper
│   │   ├── validation.js     # Validation utilities
│   │   └── helpers.js        # Helper functions
│   └── data/
│       └── sampleData.js     # Demo data
└── README.md
```

### Data Models

**Core Entities:**
- `ProductDefinition` - Top-level product configuration
- `Section` - Logical grouping of fields
- `Field` - Individual data fields with validation
- `Rule` - Conditional logic and validations
- `QuestionLibraryItem` - Reusable question templates

**Supported Data Types:**
- Text (with length/pattern validation)
- Number (with min/max constraints)
- Boolean
- Date / DateTime
- Enumeration (dropdown)
- Multi-select
- Reference (external lookup)
- File

## Roadmap

### Phase 2 (Future)
- Enhanced rule builder with complex conditions
- Full question library CRUD
- Version comparison diff view
- API endpoints for schema retrieval
- Advanced field validations

### Phase 3 (Future)
- UI form renderer from schemas
- Backend integration
- SSO authentication
- Multi-language support
- Workflow approvals

## Development

### Making Changes

The application uses ES6 modules. Simply edit the files and refresh your browser - no build step required!

### Adding New Features

1. Create new component in `js/components/`
2. Import and initialize in `js/app.js`
3. Add UI elements in `index.html`
4. Style in `styles/components.css`

### Storage

All data is stored in browser's Local Storage. To clear data:
```javascript
localStorage.clear();
```

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

Requires ES6 module support and modern CSS features.

## License

MIT License - Free to use and modify

## Contributing

Contributions welcome! Please follow the existing code style and architecture patterns.

---

**Built with ❤️ for Product Owners and Solution Teams**
