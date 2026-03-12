export const SELECTORS = {
  // Messaging
  messageButtonOnProfile: '[data-control-name="message"], .message-anywhere-button',
  messageModal: '.msg-overlay-conversation-bubble',
  messageInput: '.msg-form__contenteditable[role="textbox"]',
  messageSendButton: 'button.msg-form__send-button',
  messageConfirmation: '.msg-s-event-listitem',

  // Connection
  connectButton: 'button[aria-label^="Connect"]',
  connectModal: 'div[aria-labelledby="send-invite-modal"]',
  addNoteButton: 'button[aria-label="Add a note"]',
  connectionNoteTextarea: 'textarea#custom-message',
  connectionSendButton: 'button[aria-label="Send now"]',
  alreadyConnectedIndicator: 'button[aria-label^="Message"]',

  // Post creation
  startPostButton: '.share-box-feed-entry__trigger',
  postEditorModal: '.share-creation-state',
  postTextarea: '.ql-editor[contenteditable="true"]',
  postPublishButton: 'button.share-actions__primary-action',

  // Profile
  profileHeading: 'h1.text-heading-xlarge',
  profileSubtitle: '.text-body-medium.break-words',
  profileCompany: '[aria-label*="Current company"] span.visually-hidden + span',

  // Restriction detection
  restrictionWarning: '[data-test-modal-id="ip-restriction-modal"], .restriction-modal',
  weeklyLimitWarning: '.artdeco-inline-feedback--error',
} as const
