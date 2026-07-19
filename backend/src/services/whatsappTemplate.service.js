const Template = require('../models/Template');
const moment = require('moment');

/**
 * Generate a personalized message from a template type and student/membership data
 * @param {string} templateType - e.g. 'welcome', 'expiry_5'
 * @param {object} data - Data to inject (student, membership, settings etc)
 * @returns {string} - The formatted message string
 */
const generateMessage = async (templateType, data) => {
  try {
    const template = await Template.findOne({ type: templateType, isActive: true });
    
    if (!template) {
      console.warn(`No active template found for type: ${templateType}`);
      return null;
    }

    let message = template.body;

    if (template.variations && template.variations.length > 0) {
      const randomIndex = Math.floor(Math.random() * template.variations.length);
      message = template.variations[randomIndex];
    }

    // Helper safely formats dates
    const safeDate = (date) => date ? moment(date).format('DD MMM YYYY') : 'N/A';

    // Replacement map mapping placeholders to data values
    const replacements = {
      '{{student_name}}': data.student?.fullName || '',
      '{{father_name}}': data.student?.fatherName || '',
      '{{plan_name}}': data.membership?.planId?.name || data.plan?.name || '',
      '{{batch_name}}': data.student?.batch || '',
      '{{trainer_name}}': data.student?.trainer || '',
      '{{membership_start}}': safeDate(data.membership?.startDate),
      '{{membership_end}}': safeDate(data.membership?.endDate),
      '{{remaining_days}}': data.remainingDays !== undefined ? String(data.remainingDays) : '',
      '{{studio_name}}': data.settings?.studioName || 'DanceFlow Studio',
      '{{phone_number}}': data.student?.mobile || '',
      '{{attendance_count}}': data.attendanceCount !== undefined ? String(data.attendanceCount) : '',
    };

    // Replace all occurrences
    for (const [key, value] of Object.entries(replacements)) {
      // Use regex with global flag to replace all occurrences
      const regex = new RegExp(key, 'g');
      message = message.replace(regex, value);
    }

    return message;
  } catch (error) {
    console.error(`Error generating message for ${templateType}:`, error);
    return null;
  }
};

module.exports = {
  generateMessage
};
