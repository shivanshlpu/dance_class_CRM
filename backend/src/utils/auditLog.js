const AuditLog = require('../models/AuditLog');

/**
 * Create an audit log entry for any write operation
 * @param {Object} params
 * @param {string} params.userId - The user performing the action
 * @param {string} params.action - 'create' | 'update' | 'delete'
 * @param {string} params.entity - Model name (e.g., 'Student', 'Membership')
 * @param {string} params.entityId - The document ID
 * @param {Object} params.before - Document state before change (null for create)
 * @param {Object} params.after - Document state after change (null for delete)
 */
const createAuditLog = async ({ userId, action, entity, entityId, before = null, after = null }) => {
  try {
    await AuditLog.create({
      userId,
      action,
      entity,
      entityId,
      before,
      after,
    });
  } catch (error) {
    // Never let audit logging break the main operation
    console.error('Audit log error:', error.message);
  }
};

module.exports = createAuditLog;
