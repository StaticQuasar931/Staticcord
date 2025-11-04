import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-functions.js';
import { getApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { createModal } from '../ui/modal.ts';
import { showToast } from '../ui/toast.ts';
import { getCurrentUser } from '../auth/session.ts';

export function openReportModal({ scope, messageId }) {
  const reasons = ['Spam', 'Harassment', 'NSFW', 'Other'];
  const modal = createModal({
    title: 'Report message',
    body: `
      <label for="report-reason">Reason</label>
      <select id="report-reason">
        ${reasons.map((reason) => `<option value="${reason}">${reason}</option>`).join('')}
      </select>
      <label for="report-notes">Notes</label>
      <textarea id="report-notes" rows="3" placeholder="Add any additional context"></textarea>
    `,
    actions: [
      { label: 'Cancel', onSelect: () => {} },
      { label: 'Submit', onSelect: () => submitReport(scope, messageId) }
    ]
  });
  modal.root.querySelector('#report-reason').focus();
}

async function submitReport(scope, messageId) {
  const user = getCurrentUser();
  if (!user) {
    showToast('You must be signed in to report messages');
    return false;
  }
  const reason = document.getElementById('report-reason').value;
  const notes = document.getElementById('report-notes').value;
  try {
    const functions = getFunctions(getApp());
    const callable = httpsCallable(functions, 'reportRouter');
    await callable({
      scopeType: scope.type,
      scopeId: scope.id,
      serverId: scope.serverId,
      messageId,
      reason,
      notes
    });
    showToast('Report submitted');
  } catch (error) {
    console.error(error);
    showToast('Failed to submit report');
    return false;
  }
}
