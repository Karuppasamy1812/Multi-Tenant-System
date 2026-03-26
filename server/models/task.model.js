import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    tenantId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    project:     { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    listId:      { type: mongoose.Schema.Types.ObjectId, required: true },
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    assignees:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status:      { type: String, enum: ['todo', 'in-progress', 'review', 'done'], default: 'todo' },
    priority:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    dueDate:     { type: Date },
    order:       { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Task', taskSchema);
