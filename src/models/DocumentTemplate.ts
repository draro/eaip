import mongoose from 'mongoose';

const DocumentTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  section: {
    type: String,
    required: true,
    enum: ['GEN', 'ENR', 'AD'],
  },
  subsection: {
    type: String,
  },
  content: {
    type: String,
    required: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
  },
  createdBy: {
    id: String,
    name: String,
    email: String,
  },
}, { timestamps: true });

const DocumentTemplate = mongoose.models.DocumentTemplate || mongoose.model('DocumentTemplate', DocumentTemplateSchema);

export default DocumentTemplate;