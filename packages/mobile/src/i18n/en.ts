export const en = {
  // Home
  'home.title': 'QuipPix',
  'home.tagline': 'Transform your photos into art',
  'home.choosePhoto': 'Choose Photo',
  'home.choosePhotoDesc': 'From your gallery',
  'home.choosePhotoHint': 'Opens your photo library to select an image',
  'home.takePhoto': 'Take Photo',
  'home.takePhotoDesc': 'Use your camera',
  'home.takePhotoHint': 'Opens your camera to take a new photo',
  'home.batchProcess': 'Batch Process',
  'home.batchProcessDesc': 'Select up to 10 photos',
  'home.batchProcessHint': 'Select multiple photos to process at once',

  // Gallery
  'gallery.title': 'Gallery',
  'gallery.clearAll': 'Clear All',
  'gallery.searchPlaceholder': 'Search by style...',
  'gallery.emptyTitle': 'No creations yet',
  'gallery.emptyBody': 'Your generated images will appear here',
  'gallery.favoritesEmptyTitle': 'No favorites yet',
  'gallery.favoritesEmptyBody': 'Tap the heart on any creation to add it here',
  'gallery.sortNewest': 'Newest First',
  'gallery.sortOldest': 'Oldest First',
  'gallery.sortStyle': 'By Style',

  // Settings
  'settings.title': 'Settings',
  'settings.pro': 'QuipPix Pro',
  'settings.upgradeBtn': 'Upgrade to Pro',
  'settings.restorePurchases': 'Restore Purchases',
  'settings.manageSubscription': 'Manage Subscription',
  'settings.export': 'Export',
  'settings.watermark': 'Watermark',
  'settings.watermarkDesc': 'Add a small "Made in QuipPix" watermark to exports',
  'settings.notifications': 'Notifications',
  'settings.dailyReminder': 'Daily Challenge Reminder',
  'settings.dailyReminderDesc': 'Get notified about the daily challenge each morning',
  'settings.activity': 'Activity',
  'settings.yourStats': 'Your Stats',
  'settings.privacy': 'Privacy',
  'settings.privacyNote': 'Your photos are processed securely and automatically deleted from our servers within 1 hour.',
  'settings.deleteAll': 'Delete All Local Data',
  'settings.about': 'About',
  'settings.viewPortfolio': 'View Portfolio',
  'settings.bookShoot': 'Book a Real Shoot',
  'settings.privacyPolicy': 'Privacy Policy',
  'settings.terms': 'Terms of Service',

  // Style Select
  'styleSelect.title': 'Choose a Style',
  'styleSelect.back': 'Back',
  'styleSelect.useStyle': 'Use This Style',
  'styleSelect.requiresPro': 'Requires QuipPix Pro',

  // Result
  'result.done': 'Done',
  'result.save': 'Save',
  'result.photos': 'Photos',
  'result.compare': 'Compare',
  'result.resultView': 'Result',
  'result.card': 'Card',
  'result.share': 'Share',
  'result.post': 'Post',
  'result.remix': 'Remix',
  'result.saved': 'Saved!',
  'result.savedMessage': 'Added to your QuipPix gallery.',

  // Common
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.error': 'Error',
  'common.offline': "You're offline",
  'common.offlineGallery': 'Gallery is available offline',
} as const;

export type TranslationKey = keyof typeof en;
