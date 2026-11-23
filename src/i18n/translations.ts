import {
  AppLanguage,
  PillColor,
  PillShape,
  SkipReason,
  TimePeriod,
} from '../types/medication';

export interface LanguageOption {
  code: AppLanguage;
  nativeLabel: string;
  shortLabel: string;
  locale: string;
  dir: 'ltr' | 'rtl';
  mapsLanguage: string;
  mapsRegion: string;
  use24Hour: boolean;
  useMetric: boolean;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: 'en',
    nativeLabel: 'English',
    shortLabel: 'EN',
    locale: 'en-US',
    dir: 'ltr',
    mapsLanguage: 'en',
    mapsRegion: 'US',
    use24Hour: false,
    useMetric: false,
  },
  {
    code: 'he',
    nativeLabel: 'עברית',
    shortLabel: 'עב',
    locale: 'he-IL',
    dir: 'rtl',
    mapsLanguage: 'iw',
    mapsRegion: 'IL',
    use24Hour: true,
    useMetric: true,
  },
  {
    code: 'pt',
    nativeLabel: 'Português',
    shortLabel: 'PT',
    locale: 'pt-BR',
    dir: 'ltr',
    mapsLanguage: 'pt-BR',
    mapsRegion: 'BR',
    use24Hour: true,
    useMetric: true,
  },
];

export const LANGUAGE_META: Record<AppLanguage, LanguageOption> = {
  en: LANGUAGE_OPTIONS[0],
  he: LANGUAGE_OPTIONS[1],
  pt: LANGUAGE_OPTIONS[2],
};

export interface SeedMedicationLocalized {
  name: string;
  dosage: string;
  quantityLabel: string;
  purpose: string;
  instructions: string;
}

export const SEED_MED_TRANSLATIONS: Record<
  Exclude<AppLanguage, 'en'>,
  Record<string, SeedMedicationLocalized>
> = {
  he: {
    'med-lisinopril': {
      name: 'ליזינופריל',
      dosage: '10 מ״ג',
      quantityLabel: 'טבליה אחת',
      purpose: 'לחץ דם',
      instructions: 'ליטול בבוקר עם כוס מים מלאה',
    },
    'med-metformin': {
      name: 'מטפורמין',
      dosage: '500 מ״ג',
      quantityLabel: 'טבליה אחת',
      purpose: 'איזון סוכר בדם',
      instructions: 'ליטול עם ארוחת בוקר וארוחת ערב להקלה על הקיבה',
    },
    'med-vitamin-d': {
      name: 'ויטמין D3',
      dosage: '1000 יחב״ל',
      quantityLabel: 'כמוסה רכה אחת',
      purpose: 'חיזוק העצמות',
      instructions: 'ליטול עם ארוחת צהריים לספיגה מיטבית',
    },
    'med-atorvastatin': {
      name: 'אטורבסטטין',
      dosage: '20 מ״ג',
      quantityLabel: 'טבליה אחת',
      purpose: 'כולסטרול',
      instructions: 'ליטול לפני השינה, עם או בלי אוכל',
    },
  },
  pt: {
    'med-lisinopril': {
      name: 'Lisinopril',
      dosage: '10 mg',
      quantityLabel: '1 comprimido',
      purpose: 'Pressão arterial',
      instructions: 'Tomar pela manhã com um copo cheio de água',
    },
    'med-metformin': {
      name: 'Metformina',
      dosage: '500 mg',
      quantityLabel: '1 comprimido',
      purpose: 'Açúcar no sangue',
      instructions: 'Tomar com o café da manhã e o jantar para proteger o estômago',
    },
    'med-vitamin-d': {
      name: 'Vitamina D3',
      dosage: '1000 UI',
      quantityLabel: '1 cápsula mole',
      purpose: 'Saúde dos ossos',
      instructions: 'Tomar com o almoço para melhor absorção',
    },
    'med-atorvastatin': {
      name: 'Atorvastatina',
      dosage: '20 mg',
      quantityLabel: '1 comprimido',
      purpose: 'Colesterol',
      instructions: 'Tomar antes de dormir, com ou sem alimentos',
    },
  },
};

export interface TranslationDict {
  meta: {
    appTitle: string;
    languageLabel: string;
    chooseLanguageAria: string;
  };
  nav: {
    today: string;
    adherence: string;
    medications: string;
    nearby: string;
    alerts: string;
    shortToday: string;
    shortAdherence: string;
    shortMedications: string;
    shortNearby: string;
    shortAlerts: string;
    addMedicine: string;
    mainNavAria: string;
    mobileNavAria: string;
  };
  offline: {
    banner: string;
  };
  mapsQuota: {
    prefix: string;
    linkText: string;
    suffix: string;
  };
  periods: Record<TimePeriod, { title: string; range: string }>;
  pills: {
    colors: Record<PillColor, { label: string; short: string }>;
    shapes: Record<PillShape, string>;
    pillAria: (color: string, shape: string) => string;
  };
  skipReasons: Record<SkipReason, string>;
  toasts: {
    taken: (name: string) => string;
    reset: (name: string, time: string) => string;
    snoozed: (name: string, mins: number) => string;
    skipped: (name: string) => string;
    updated: (name: string) => string;
    added: (name: string) => string;
    resumed: (name: string) => string;
    paused: (name: string) => string;
    removed: (name: string) => string;
    refilled: (amount: number, name: string) => string;
    notificationsEnabled: string;
    addMedFirst: string;
    savedPharmacy: (name: string) => string;
    notificationTitle: (name: string, dosage: string) => string;
  };
  today: {
    todaySchedule: string;
    dailySchedule: string;
    returnToToday: string;
    chooseDayAria: string;
    todayShort: string;
    nextMedDueAria: string;
    actionNeededOverdue: string;
    readyToTakeNow: string;
    nextScheduledMed: string;
    markAsTaken: string;
    remindIn: (mins: number) => string;
    allDoneTitle: string;
    allDoneHeadline: string;
    allDoneBody: (taken: number, total: number) => string;
    emptyTitle: string;
    emptyBody: string;
    addFirstMed: string;
    takenOfTotal: (taken: number, total: number) => string;
    statusTakenAt: (time: string) => string;
    statusTaken: string;
    statusSkippedWithReason: (reason: string) => string;
    statusSkipped: string;
    statusSnoozedUntil: (time: string) => string;
    statusDueNow: string;
    statusLateHours: (hrs: number, mins: number) => string;
    statusLateMins: (mins: number) => string;
    statusMissed: string;
    statusUpcoming: string;
    undo: string;
    take: string;
    options: string;
    moreOptionsAria: (name: string) => string;
    snoozeOrSkipTitle: string;
    todaysProgress: string;
    daySummary: string;
    takenWord: string;
    noDosesScheduled: string;
    everyDoseTaken: string;
    remainingDoses: (count: number) => string;
    timelyAlertsTitle: string;
    timelyAlertsBody: string;
    previewReminderAlert: string;
    refillSoonTitle: string;
    refillSoonBody: string;
    pillsLeft: (count: number) => string;
    refillBtn: string;
  };
  adherence: {
    eyebrow: string;
    title: string;
    selectRangeAria: string;
    daysLabel: (days: number) => string;
    dayRateLabel: (days: number) => string;
    strongRoutine: string;
    steadyProgress: string;
    needsAttention: string;
    takenSummary: (taken: number, total: number, days: number) => string;
    streakLabel: (days: number) => string;
    takenOnTime: string;
    within45Min: string;
    takenLate: string;
    over45MinLate: string;
    missedSkipped: string;
    skippedMissedBreakdown: (skipped: number, missed: number) => string;
    dailyCalendarTitle: string;
    dailyCalendarSubtitle: string;
    legendAllTaken: string;
    legendPartial: string;
    legendMissed: string;
    noDoses: string;
    all: string;
    missed: string;
    partial: string;
    dayAria: (date: string, taken: number, total: number) => string;
    selectedDayDetails: string;
    takenTime: (time: string) => string;
    skippedReason: (reason: string) => string;
    noteFallback: string;
    upcoming: string;
    missedStatus: string;
    byMedication: (days: number) => string;
    byMedicationSubtitle: string;
    shareTitle: string;
    shareBody: (days: number) => string;
    csvDownloaded: string;
    downloadCsv: (days: number) => string;
    summaryCopied: string;
    copyDoctorSummary: string;
    printReport: string;
  };
  chart: {
    weekly: string;
    biweekly: string;
    monthly: string;
    heading: (days: number) => string;
    ariaLabel: (rangeLabel: string) => string;
    periodAria: string;
    averageSummary: (days: number, takenPct: number, missedPct: number) => string;
    takenPctLabel: string;
    missedPctLabel: string;
    takenWord: string;
    missedWord: string;
    noScheduledYet: string;
    thisWeek: string;
    previousWeek: string;
    weekNumber: (n: number) => string;
    dailyBreakdownAria: string;
    weeklyBreakdownAria: string;
    dayBarAria: (date: string, takenPct: number, missedPct: number) => string;
  };
  medications: {
    eyebrow: string;
    title: (activeCount: number) => string;
    addMedicine: string;
    paused: string;
    reminderTimes: string;
    instructions: string;
    supplyOnHand: string;
    pillsCount: (count: number) => string;
    refillSoonSuffix: string;
    confirmRemove: (name: string) => string;
    yesRemove: string;
    cancel: string;
    refill30: string;
    edit: string;
    pause: string;
    resume: string;
    removeAria: (name: string) => string;
    removeTitle: string;
    emptyTitle: string;
    emptyBody: string;
    pausedSectionTitle: (count: number) => string;
  };
  form: {
    editTitle: string;
    addTitle: string;
    closeAria: string;
    errNameRequired: string;
    errTimeRequired: string;
    defaultDosage: string;
    defaultQty: string;
    defaultPurpose: string;
    defaultInstructions: string;
    previewFallbackName: string;
    medicineName: string;
    medicineNamePlaceholder: string;
    strengthDosage: string;
    strengthPlaceholder: string;
    amountPerDose: string;
    amountPlaceholder: string;
    whatItHelpsWith: string;
    purposePlaceholder: string;
    instructionsLabel: string;
    instructionsPlaceholder: string;
    reminderTimesLabel: string;
    presetMorning: string;
    presetMidday: string;
    presetEvening: string;
    presetBedtime: string;
    customTimeAria: string;
    addCustomTime: string;
    removeTimeAria: (time: string) => string;
    pillShape: string;
    pillColor: string;
    pillsOnHand: string;
    refillAlertBelow: string;
    cancel: string;
    saveChanges: string;
    saveMedicine: string;
  };
  reminder: {
    sampleTitle: string;
    dueTitle: string;
    replayChimeAria: string;
    replayChimeTitle: string;
    closeAria: string;
    scheduledFor: (time: string) => string;
    howToTakeIt: string;
    defaultInstruction: string;
    forPurpose: (purpose: string) => string;
    iTookItNow: string;
    remindIn: (mins: number) => string;
    skipThisDose: string;
    whySkipping: string;
    backToReminder: string;
  };
  settings: {
    eyebrow: string;
    title: string;
    chimeTitle: string;
    chimeDesc: string;
    soundOn: string;
    muted: string;
    chimeToneLabel: string;
    chimeBell: string;
    chimeBellDesc: string;
    chimeWarm: string;
    chimeWarmDesc: string;
    chimeClear: string;
    chimeClearDesc: string;
    snoozeDuration: string;
    minutesLabel: (mins: number) => string;
    deviceNotifications: string;
    notifGranted: string;
    notifDenied: string;
    notifUnsupported: string;
    notifDefault: string;
    enableAlerts: string;
    enabled: string;
    testFullReminder: string;
    readingComfortTitle: string;
    readingComfortDesc: string;
    textSize: string;
    textStandard: string;
    textLarge: string;
    textXLarge: string;
    highContrastTitle: string;
    highContrastDesc: string;
    on: string;
    off: string;
    languageTitle: string;
    languageDesc: string;
    caregiverTitle: string;
    caregiverDesc: string;
    checkinCopied: string;
    copyTodaysUpdate: string;
    caregiverName: string;
    relationship: string;
    phoneNumber: string;
    pharmacyName: string;
    pharmacyPhone: string;
    callCaregiver: (firstName: string) => string;
    caregiverFallback: string;
    saved: string;
    saveContacts: string;
    checkinHeader: (taken: number, total: number) => string;
    checkinTakenAt: (time: string) => string;
    checkinSkipped: string;
    checkinStillDue: string;
    checkinScheduled: (time: string) => string;
  };
  nearby: {
    eyebrow: string;
    title: string;
    showingArea: string;
    defaultArea: string;
    yourCurrentLocation: string;
    currentMapArea: string;
    searchAria: string;
    searchPlaceholder: string;
    suggestionsAria: string;
    locating: string;
    useMyLocation: string;
    filterTypeAria: string;
    catAll: string;
    catPharmacies: string;
    catClinics: string;
    catHospitals: string;
    labelPharmacy: string;
    labelClinic: string;
    labelHospital: string;
    healthcareFacility: string;
    openNow: string;
    closedNow: string;
    radiusAria: string;
    radiusLabels: [string, string, string];
    searchThisArea: string;
    emergencyNotice: string;
    listAria: string;
    nearbyPlaces: (count: number) => string;
    sortedByDistance: string;
    searching: string;
    tryAgain: string;
    findingPlaces: string;
    noFacilitiesTitle: string;
    noFacilitiesOpenNow: string;
    noFacilitiesGeneral: string;
    wheelchairAccessible: string;
    call: string;
    directions: string;
    savedPharmacy: string;
    saveAsMyPharmacy: string;
    myPharmacy: string;
    setAsMyPharmacy: string;
    errQuota: string;
    errLoad: string;
    errMoveAddress: string;
    errNoGeolocation: string;
    errPermissionDenied: string;
    errLocationFailed: string;
    notConfiguredBody: string;
    yourLocationAria: string;
    distanceUnit: string;
  };
  pwa: {
    installedTitle: string;
    installedDesc: string;
    installTitle: string;
    installDesc: string;
    appInstalled: string;
    downloadApp: string;
    guideTitle: string;
    closeGuideAria: string;
    guideIntro: string;
    iosHeading: string;
    iosStep1Prefix: string;
    iosStep1Share: string;
    iosStep1Suffix: string;
    iosStep2Prefix: string;
    iosStep2Action: string;
    iosStep3Prefix: string;
    iosStep3Action: string;
    iosStep3Suffix: string;
    androidHeading: string;
    androidStep1Prefix: string;
    androidStep1Menu: string;
    androidStep1Suffix: string;
    androidStep2Prefix: string;
    androidStep2Action1: string;
    androidStep2Or: string;
    androidStep2Action2: string;
    androidStep3Prefix: string;
    androidStep3Action: string;
    appLinkCopied: string;
    copyLinkForPhone: string;
    done: string;
  };
  report: {
    title: string;
    generated: (date: string) => string;
    period: (days: number) => string;
    overall: (pct: number, taken: number, total: number) => string;
    breakdown: (onTime: number, late: number, skipped: number, missed: number) => string;
    streak: (days: number) => string;
    medBreakdown: string;
    medLine: (
      name: string,
      dosage: string,
      times: string,
      rate: number,
      taken: number,
      total: number,
      remaining: number
    ) => string;
    todayStatus: string;
    takenAt: (time: string) => string;
    skipped: (reason: string) => string;
    noReason: string;
    overdue: string;
    upcoming: string;
    csvHeaders: string[];
    csvTakenOnTime: string;
    csvTakenLate: string;
    csvTaken: string;
    csvSkipped: string;
    csvSnoozed: string;
    csvSnoozedUntil: (time: string) => string;
    csvUpcoming: string;
    csvMissed: string;
  };
}

export const TRANSLATIONS: Record<AppLanguage, TranslationDict> = {
  en: {
    meta: {
      appTitle: 'SteadyDose — Medication Reminders & Adherence',
      languageLabel: 'Language',
      chooseLanguageAria: 'Choose app language',
    },
    nav: {
      today: 'Today',
      adherence: 'Adherence',
      medications: 'Medications',
      nearby: 'Nearby Care',
      alerts: 'Care & Alerts',
      shortToday: 'Today',
      shortAdherence: 'History',
      shortMedications: 'Medicines',
      shortNearby: 'Nearby',
      shortAlerts: 'Alerts',
      addMedicine: 'Add Medicine',
      mainNavAria: 'Main navigation',
      mobileNavAria: 'Mobile navigation',
    },
    offline: {
      banner:
        'Offline Mode — Your medication schedule and history remain available on this device.',
    },
    mapsQuota: {
      prefix: 'Google Maps Platform quota reached. If you are the app owner, visit',
      linkText: 'maps developer site',
      suffix: 'for instructions to update your account.',
    },
    periods: {
      morning: { title: 'Morning', range: 'Before noon' },
      afternoon: { title: 'Afternoon', range: '12:00 PM – 5:00 PM' },
      evening: { title: 'Evening', range: '5:00 PM – 8:30 PM' },
      bedtime: { title: 'Bedtime', range: '8:30 PM – Midnight' },
    },
    pills: {
      colors: {
        white: { label: 'White', short: 'White' },
        sky: { label: 'Soft Blue', short: 'Blue' },
        butter: { label: 'Pale Yellow', short: 'Yellow' },
        coral: { label: 'Warm Peach', short: 'Peach' },
        sage: { label: 'Mint Green', short: 'Green' },
        amber: { label: 'Golden Amber', short: 'Amber' },
      },
      shapes: {
        round: 'Round',
        oval: 'Oval',
        capsule: 'Capsule',
        square: 'Square',
      },
      pillAria: (color, shape) => `${color} ${shape} pill`,
    },
    skipReasons: {
      Forgot: 'Forgot',
      'Not feeling well': 'Not feeling well',
      'Ran out of pills': 'Ran out of pills',
      'Doctor advised': 'Doctor advised',
    },
    toasts: {
      taken: (name) => `Recorded ${name} as taken.`,
      reset: (name, time) => `Reset ${name} for ${time}.`,
      snoozed: (name, mins) => `Snoozed ${name} for ${mins} minutes.`,
      skipped: (name) => `Marked ${name} as skipped.`,
      updated: (name) => `Updated ${name}.`,
      added: (name) => `Added ${name} to your schedule.`,
      resumed: (name) => `Resumed ${name}.`,
      paused: (name) => `Paused reminders for ${name}.`,
      removed: (name) => `Removed ${name}.`,
      refilled: (amount, name) => `Added ${amount} pills to ${name}.`,
      notificationsEnabled: 'Device medication reminders enabled.',
      addMedFirst: 'Add a medication first to preview a reminder.',
      savedPharmacy: (name) => `Saved ${name} as your pharmacy.`,
      notificationTitle: (name, dosage) => `Time for ${name} ${dosage}`,
    },
    today: {
      todaySchedule: 'Today’s Schedule',
      dailySchedule: 'Daily Schedule',
      returnToToday: 'Return to Today',
      chooseDayAria: 'Choose a day',
      todayShort: 'Today',
      nextMedDueAria: 'Next medication due',
      actionNeededOverdue: 'Action Needed · Overdue Dose',
      readyToTakeNow: 'Ready to Take Now',
      nextScheduledMed: 'Next Scheduled Medicine',
      markAsTaken: 'Mark as Taken',
      remindIn: (mins) => `Remind in ${mins} min`,
      allDoneTitle: 'All Done for Today',
      allDoneHeadline: 'Every scheduled dose is accounted for',
      allDoneBody: (taken, total) =>
        `You took ${taken} of ${total} scheduled doses today. Great job staying consistent.`,
      emptyTitle: 'No medications scheduled for this day',
      emptyBody:
        'Add your daily prescriptions or vitamins to receive clear, timely reminders and track your progress.',
      addFirstMed: 'Add Your First Medicine',
      takenOfTotal: (taken, total) => `${taken}/${total} taken`,
      statusTakenAt: (time) => `Taken at ${time}`,
      statusTaken: 'Taken',
      statusSkippedWithReason: (reason) => `Skipped · ${reason}`,
      statusSkipped: 'Skipped',
      statusSnoozedUntil: (time) => `Snoozed until ${time}`,
      statusDueNow: 'Due now',
      statusLateHours: (hrs, mins) =>
        mins > 0 ? `Late by ${hrs} hr ${mins} min` : `Late by ${hrs} hr`,
      statusLateMins: (mins) => `Late by ${mins} min`,
      statusMissed: 'Missed',
      statusUpcoming: 'Upcoming',
      undo: 'Undo',
      take: 'Take',
      options: 'Options',
      moreOptionsAria: (name) => `More options for ${name}`,
      snoozeOrSkipTitle: 'Snooze or Skip',
      todaysProgress: 'Today’s Progress',
      daySummary: 'Day Summary',
      takenWord: 'taken',
      noDosesScheduled: 'No doses scheduled.',
      everyDoseTaken: 'Every dose has been taken on schedule.',
      remainingDoses: (count) =>
        `${count} dose${count === 1 ? '' : 's'} remaining for this day.`,
      timelyAlertsTitle: 'Timely Reminder Alerts',
      timelyAlertsBody:
        'Reminders chime automatically at your scheduled times with clear pill details and one-tap confirmation.',
      previewReminderAlert: 'Preview Reminder Alert',
      refillSoonTitle: 'Refill Soon',
      refillSoonBody: 'These bottles are getting low.',
      pillsLeft: (count) => `${count} pills left`,
      refillBtn: '+30 Refill',
    },
    adherence: {
      eyebrow: 'Adherence & History',
      title: 'Your Consistency Over Time',
      selectRangeAria: 'Select time range',
      daysLabel: (days) => `${days} Days`,
      dayRateLabel: (days) => `${days}-day rate`,
      strongRoutine: 'Strong Routine',
      steadyProgress: 'Steady Progress',
      needsAttention: 'Needs Attention',
      takenSummary: (taken, total, days) =>
        `${taken} of ${total} scheduled doses taken in the past ${days} days.`,
      streakLabel: (days) =>
        `Current full-day streak: ${days} day${days === 1 ? '' : 's'}`,
      takenOnTime: 'Taken On Time',
      within45Min: 'Within 45 min',
      takenLate: 'Taken Late',
      over45MinLate: 'Over 45 min late',
      missedSkipped: 'Missed / Skipped',
      skippedMissedBreakdown: (skipped, missed) =>
        `${skipped} skipped · ${missed} missed`,
      dailyCalendarTitle: 'Daily Log Calendar',
      dailyCalendarSubtitle: 'Tap any day to see or update individual doses.',
      legendAllTaken: 'All taken',
      legendPartial: 'Partial',
      legendMissed: 'Missed',
      noDoses: 'No doses',
      all: 'All',
      missed: 'Missed',
      partial: 'Partial',
      dayAria: (date, taken, total) => `${date}: ${taken} of ${total} taken`,
      selectedDayDetails: 'Selected Day Details',
      takenTime: (time) => `Taken ${time}`,
      skippedReason: (reason) => `Skipped (${reason})`,
      noteFallback: 'Note',
      upcoming: 'Upcoming',
      missedStatus: 'Missed',
      byMedication: (days) => `By Medication (${days} Days)`,
      byMedicationSubtitle:
        'Sorted with medicines that may need an easier reminder time first.',
      shareTitle: 'Share with Doctor or Family',
      shareBody: (days) =>
        `Export your ${days}-day adherence log as a CSV spreadsheet for your healthcare provider, copy a text summary, or print a clean report.`,
      csvDownloaded: 'CSV Downloaded',
      downloadCsv: (days) => `Download CSV (${days} Days)`,
      summaryCopied: 'Summary Copied',
      copyDoctorSummary: 'Copy Doctor Summary',
      printReport: 'Print Report',
    },
    chart: {
      weekly: 'Weekly',
      biweekly: 'Bi-weekly',
      monthly: 'Monthly',
      heading: (days) => `Past ${days} Days · Taken vs. Missed`,
      ariaLabel: (rangeLabel) =>
        `${rangeLabel} taken versus missed medication bar chart`,
      periodAria: 'Chart time period',
      averageSummary: (days, takenPct, missedPct) =>
        `${days}-day average: ${takenPct}% taken · ${missedPct}% missed or skipped`,
      takenPctLabel: 'Taken (%)',
      missedPctLabel: 'Missed (%)',
      takenWord: 'Taken',
      missedWord: 'Missed',
      noScheduledYet: 'No scheduled doses due yet.',
      thisWeek: 'This Week',
      previousWeek: 'Previous Week',
      weekNumber: (n) => `Week ${n}`,
      dailyBreakdownAria: 'Daily percentage breakdown for past week',
      weeklyBreakdownAria: 'Weekly summary breakdown',
      dayBarAria: (date, takenPct, missedPct) =>
        `${date}: ${takenPct}% taken, ${missedPct}% missed`,
    },
    medications: {
      eyebrow: 'Medicine Cabinet',
      title: (activeCount) => `My Medications (${activeCount} Active)`,
      addMedicine: 'Add Medicine',
      paused: 'Paused',
      reminderTimes: 'Reminder times',
      instructions: 'Instructions',
      supplyOnHand: 'Supply on hand',
      pillsCount: (count) => `${count} pills`,
      refillSoonSuffix: ' · Refill soon',
      confirmRemove: (name) => `Remove ${name} from your schedule?`,
      yesRemove: 'Yes, Remove',
      cancel: 'Cancel',
      refill30: '+30 Refill',
      edit: 'Edit',
      pause: 'Pause',
      resume: 'Resume',
      removeAria: (name) => `Remove ${name}`,
      removeTitle: 'Remove medicine',
      emptyTitle: 'No active medications',
      emptyBody:
        'Add a medication to start receiving reminders and tracking your supply.',
      pausedSectionTitle: (count) => `Paused Medications (${count})`,
    },
    form: {
      editTitle: 'Edit Medicine',
      addTitle: 'Add a New Medicine',
      closeAria: 'Close form',
      errNameRequired: 'Please enter the medicine name.',
      errTimeRequired: 'Please choose at least one reminder time.',
      defaultDosage: 'Standard dose',
      defaultQty: '1 tablet',
      defaultPurpose: 'Daily health',
      defaultInstructions: 'Take with a full glass of water',
      previewFallbackName: 'Medicine Name',
      medicineName: 'Medicine Name',
      medicineNamePlaceholder: 'e.g., Lisinopril',
      strengthDosage: 'Strength / Dosage',
      strengthPlaceholder: 'e.g., 10 mg',
      amountPerDose: 'Amount per Dose',
      amountPlaceholder: 'e.g., 1 tablet',
      whatItHelpsWith: 'What It Helps With',
      purposePlaceholder: 'e.g., Blood pressure',
      instructionsLabel: 'Instructions',
      instructionsPlaceholder: 'e.g., Take with breakfast and water',
      reminderTimesLabel: 'Reminder Times',
      presetMorning: 'Morning',
      presetMidday: 'Midday',
      presetEvening: 'Evening',
      presetBedtime: 'Bedtime',
      customTimeAria: 'Custom reminder time',
      addCustomTime: 'Add Custom Time',
      removeTimeAria: (time) => `Remove ${time}`,
      pillShape: 'Pill Shape',
      pillColor: 'Pill Color',
      pillsOnHand: 'Pills on Hand',
      refillAlertBelow: 'Refill Alert Below',
      cancel: 'Cancel',
      saveChanges: 'Save Changes',
      saveMedicine: 'Save Medicine',
    },
    reminder: {
      sampleTitle: 'Sample Medication Reminder',
      dueTitle: 'Time for Your Medicine',
      replayChimeAria: 'Play reminder chime again',
      replayChimeTitle: 'Play chime',
      closeAria: 'Close reminder',
      scheduledFor: (time) => `Scheduled for ${time}`,
      howToTakeIt: 'How to take it',
      defaultInstruction: 'Take with a full glass of water.',
      forPurpose: (purpose) => `For: ${purpose}`,
      iTookItNow: 'I Took It Now',
      remindIn: (mins) => `Remind in ${mins} min`,
      skipThisDose: 'Skip This Dose',
      whySkipping: 'Why are you skipping this dose?',
      backToReminder: 'Back to reminder',
    },
    settings: {
      eyebrow: 'Care, Alerts & Comfort',
      title: 'Reminders & Reading Settings',
      chimeTitle: 'Reminder Chime & Alerts',
      chimeDesc:
        'Play a pleasant sound and show a clear full-screen alert when a dose is due.',
      soundOn: 'Sound On',
      muted: 'Muted',
      chimeToneLabel: 'Chime Tone (tap to preview)',
      chimeBell: 'Gentle Bell',
      chimeBellDesc: 'Soft two-note chime',
      chimeWarm: 'Warm Triad',
      chimeWarmDesc: 'Calm rising chord',
      chimeClear: 'Clear Tone',
      chimeClearDesc: 'Brighter, easier to hear',
      snoozeDuration: 'Snooze Duration',
      minutesLabel: (mins) => `${mins} minutes`,
      deviceNotifications: 'Device Notifications',
      notifGranted:
        'Device alerts are turned on for scheduled medication times.',
      notifDenied:
        'Notifications are blocked in your browser settings. In-app alerts still work.',
      notifUnsupported: 'Your browser uses in-app reminders and chimes.',
      notifDefault: 'Allow alerts even when this tab is in the background.',
      enableAlerts: 'Enable Alerts',
      enabled: 'Enabled',
      testFullReminder: 'Test Full Reminder Screen Now',
      readingComfortTitle: 'Reading Comfort & Accessibility',
      readingComfortDesc:
        'Adjust text size and border contrast for effortless reading.',
      textSize: 'Text Size',
      textStandard: 'Standard',
      textLarge: 'Large Text',
      textXLarge: 'Extra Large',
      highContrastTitle: 'Extra High Contrast Borders',
      highContrastDesc:
        'Strengthens card outlines and foreground text contrast.',
      on: 'On',
      off: 'Off',
      languageTitle: 'App Language',
      languageDesc:
        'Switch the interface between English, Hebrew, and Portuguese.',
      caregiverTitle: 'Family Caregiver Check-In',
      caregiverDesc:
        'Keep a family member updated with one tap, and store your pharmacy number handy for refills.',
      checkinCopied: 'Today’s Check-In Copied',
      copyTodaysUpdate: 'Copy Today’s Update',
      caregiverName: 'Caregiver Name',
      relationship: 'Relationship',
      phoneNumber: 'Phone Number',
      pharmacyName: 'Pharmacy Name',
      pharmacyPhone: 'Pharmacy Phone',
      callCaregiver: (firstName) => `Call ${firstName}`,
      caregiverFallback: 'Caregiver',
      saved: 'Saved',
      saveContacts: 'Save Contacts',
      checkinHeader: (taken, total) =>
        `Medication check-in for today: ${taken} of ${total} doses taken.`,
      checkinTakenAt: (time) => `Taken at ${time}`,
      checkinSkipped: 'Skipped',
      checkinStillDue: 'Still due',
      checkinScheduled: (time) => `Scheduled ${time}`,
    },
    nearby: {
      eyebrow: 'Local Healthcare Locator',
      title: 'Nearby Pharmacies, Clinics & Hospitals',
      showingArea: 'Showing area:',
      defaultArea: 'San Francisco, CA (default area)',
      yourCurrentLocation: 'Your current location',
      currentMapArea: 'Current map area',
      searchAria: 'Search by city, ZIP code, or street address',
      searchPlaceholder: 'Enter city, ZIP code, or address...',
      suggestionsAria: 'Address suggestions',
      locating: 'Locating...',
      useMyLocation: 'Use My Location',
      filterTypeAria: 'Filter by healthcare facility type',
      catAll: 'All Care',
      catPharmacies: 'Pharmacies',
      catClinics: 'Clinics',
      catHospitals: 'Hospitals',
      labelPharmacy: 'Pharmacy',
      labelClinic: 'Clinic',
      labelHospital: 'Hospital',
      healthcareFacility: 'Healthcare Facility',
      openNow: 'Open now',
      closedNow: 'Closed now',
      radiusAria: 'Search distance radius',
      radiusLabels: ['2 mi', '5 mi', '10 mi'],
      searchThisArea: 'Search This Area',
      emergencyNotice: 'For emergencies, dial 911 or local emergency services.',
      listAria: 'Nearby healthcare facilities list',
      nearbyPlaces: (count) => `Nearby Places (${count})`,
      sortedByDistance: 'Sorted by distance · Tap any place to view on map',
      searching: 'Searching...',
      tryAgain: 'Try Again',
      findingPlaces: 'Finding nearby pharmacies, clinics, and hospitals...',
      noFacilitiesTitle: 'No matching facilities found',
      noFacilitiesOpenNow:
        'Try turning off the "Open Now" filter or widening your search radius.',
      noFacilitiesGeneral:
        'Try expanding the distance radius or searching a nearby city.',
      wheelchairAccessible: 'Wheelchair accessible entrance',
      call: 'Call',
      directions: 'Directions',
      savedPharmacy: 'Saved Pharmacy',
      saveAsMyPharmacy: 'Save as My Pharmacy',
      myPharmacy: 'My Pharmacy',
      setAsMyPharmacy: 'Set as My Pharmacy',
      errQuota:
        'Google Maps Platform quota limit reached. Please see the banner above for account options.',
      errLoad:
        'Unable to load nearby locations right now. Please check your connection and try again.',
      errMoveAddress: 'Could not move to that address. Please try another.',
      errNoGeolocation:
        'Location services are not available in this browser. Try searching your city or ZIP code above.',
      errPermissionDenied:
        'Location permission was declined. You can type your city, address, or ZIP code above instead.',
      errLocationFailed:
        'Could not determine your location right now. Try entering your address or ZIP code above.',
      notConfiguredBody:
        'Google Maps Platform is not configured yet. Please complete Google Maps setup to view live nearby pharmacies, clinics, and hospitals on an interactive map.',
      yourLocationAria: 'Your location',
      distanceUnit: 'mi',
    },
    pwa: {
      installedTitle: 'Installed on This Device',
      installedDesc:
        'SteadyDose is already saved to your home screen for quick, offline access.',
      installTitle: 'Install on Smartphone',
      installDesc:
        'Add SteadyDose to your phone’s home screen for one-tap access and offline medication tracking.',
      appInstalled: 'App Installed',
      downloadApp: 'Download App',
      guideTitle: 'Install SteadyDose on Your Phone',
      closeGuideAria: 'Close installation instructions',
      guideIntro:
        'SteadyDose installs directly from your phone’s web browser—no app store password needed.',
      iosHeading: 'On iPhone or iPad (Safari)',
      iosStep1Prefix: 'Tap the',
      iosStep1Share: 'Share',
      iosStep1Suffix: 'button at the bottom of Safari.',
      iosStep2Prefix: 'Scroll down and tap',
      iosStep2Action: 'Add to Home Screen',
      iosStep3Prefix: 'Tap',
      iosStep3Action: 'Add',
      iosStep3Suffix: 'in the top corner to place SteadyDose on your home screen.',
      androidHeading: 'On Android (Chrome)',
      androidStep1Prefix: 'Tap the',
      androidStep1Menu: 'Menu',
      androidStep1Suffix: 'button in the top-right corner of Chrome.',
      androidStep2Prefix: 'Tap',
      androidStep2Action1: 'Install app',
      androidStep2Or: 'or',
      androidStep2Action2: 'Add to Home screen',
      androidStep3Prefix: 'Confirm by tapping',
      androidStep3Action: 'Install',
      appLinkCopied: 'App Link Copied',
      copyLinkForPhone: 'Copy Link for Phone',
      done: 'Done',
    },
    report: {
      title: 'SteadyDose Medication Adherence Summary',
      generated: (date) => `Generated: ${date}`,
      period: (days) => `Period: Last ${days} days`,
      overall: (pct, taken, total) =>
        `Overall Adherence: ${pct}% (${taken} of ${total} doses taken)`,
      breakdown: (onTime, late, skipped, missed) =>
        `On-time doses: ${onTime} · Late doses: ${late} · Skipped: ${skipped} · Missed: ${missed}`,
      streak: (days) => `Current full-day streak: ${days} day(s)`,
      medBreakdown: 'Medication Breakdown:',
      medLine: (name, dosage, times, rate, taken, total, remaining) =>
        `- ${name} ${dosage} (${times}): ${rate}% (${taken}/${total} taken) · ${remaining} pills remaining`,
      todayStatus: "Today's Status:",
      takenAt: (time) => `Taken at ${time}`,
      skipped: (reason) => `Skipped (${reason})`,
      noReason: 'No reason',
      overdue: 'Overdue',
      upcoming: 'Upcoming',
      csvHeaders: [
        'Date',
        'Scheduled Time',
        'Medication',
        'Dosage',
        'Amount',
        'Purpose',
        'Status',
        'Taken At',
        'Notes',
      ],
      csvTakenOnTime: 'Taken (On Time)',
      csvTakenLate: 'Taken (Late)',
      csvTaken: 'Taken',
      csvSkipped: 'Skipped',
      csvSnoozed: 'Snoozed',
      csvSnoozedUntil: (time) => `Snoozed until ${time}`,
      csvUpcoming: 'Upcoming',
      csvMissed: 'Missed',
    },
  },

  he: {
    meta: {
      appTitle: 'SteadyDose — תזכורות ומעקב נטילת תרופות',
      languageLabel: 'שפה',
      chooseLanguageAria: 'בחירת שפת האפליקציה',
    },
    nav: {
      today: 'היום',
      adherence: 'מעקב והיסטוריה',
      medications: 'תרופות',
      nearby: 'שירותים קרובים',
      alerts: 'התראות והגדרות',
      shortToday: 'היום',
      shortAdherence: 'מעקב',
      shortMedications: 'תרופות',
      shortNearby: 'קרוב',
      shortAlerts: 'הגדרות',
      addMedicine: 'הוספת תרופה',
      mainNavAria: 'ניווט ראשי',
      mobileNavAria: 'ניווט נייד',
    },
    offline: {
      banner:
        'מצב לא מקוון — לוח התרופות וההיסטוריה שלך נשארים זמינים במכשיר זה.',
    },
    mapsQuota: {
      prefix: 'הגעת למכסת Google Maps Platform. אם הינך בעל האפליקציה, בקר ב-',
      linkText: 'אתר המפתחים של מפות Google',
      suffix: 'להנחיות לעדכון החשבון.',
    },
    periods: {
      morning: { title: 'בוקר', range: 'לפני הצהריים' },
      afternoon: { title: 'צהריים', range: '12:00 – 17:00' },
      evening: { title: 'ערב', range: '17:00 – 20:30' },
      bedtime: { title: 'לפני שינה', range: '20:30 – חצות' },
    },
    pills: {
      colors: {
        white: { label: 'לבן', short: 'לבן' },
        sky: { label: 'תכלת', short: 'תכלת' },
        butter: { label: 'צהוב בהיר', short: 'צהוב' },
        coral: { label: 'אפרסק', short: 'אפרסק' },
        sage: { label: 'ירוק מנטה', short: 'ירוק' },
        amber: { label: 'ענבר זהוב', short: 'ענבר' },
      },
      shapes: {
        round: 'עגול',
        oval: 'אליפטי',
        capsule: 'כמוסה',
        square: 'מרובע',
      },
      pillAria: (color, shape) => `גלולה בצבע ${color}, צורה: ${shape}`,
    },
    skipReasons: {
      Forgot: 'שכחתי',
      'Not feeling well': 'לא מרגיש/ה טוב',
      'Ran out of pills': 'נגמרו התרופות',
      'Doctor advised': 'בהנחיית רופא',
    },
    toasts: {
      taken: (name) => `${name} סומנה כניטלה.`,
      reset: (name, time) => `הסטטוס של ${name} לשעה ${time} אופס.`,
      snoozed: (name, mins) => `התזכורת ל-${name} נדחתה ב-${mins} דקות.`,
      skipped: (name) => `${name} סומנה כדילוג.`,
      updated: (name) => `${name} עודכנה.`,
      added: (name) => `${name} נוספה ללוח התרופות.`,
      resumed: (name) => `התזכורות ל-${name} חודשו.`,
      paused: (name) => `התזכורות ל-${name} הושהו.`,
      removed: (name) => `${name} הוסרה.`,
      refilled: (amount, name) => `נוספו ${amount} טבליות ל-${name}.`,
      notificationsEnabled: 'התראות התרופות במכשיר הופעלו.',
      addMedFirst: 'יש להוסיף תרופה תחילה כדי לצפות בתצוגה מקדימה של תזכורת.',
      savedPharmacy: (name) => `${name} נשמר כבית המרקחת שלך.`,
      notificationTitle: (name, dosage) => `הגיע הזמן ל-${name} ${dosage}`,
    },
    today: {
      todaySchedule: 'לוח התרופות להיום',
      dailySchedule: 'לוח יומי',
      returnToToday: 'חזרה להיום',
      chooseDayAria: 'בחירת יום',
      todayShort: 'היום',
      nextMedDueAria: 'התרופה הבאה לנטילה',
      actionNeededOverdue: 'נדרשת תשומת לב · מנה באיחור',
      readyToTakeNow: 'מוכן לנטילה עכשיו',
      nextScheduledMed: 'התרופה הבאה בלוח הזמנים',
      markAsTaken: 'סימון כניטלה',
      remindIn: (mins) => `תזכורת בעוד ${mins} דק׳`,
      allDoneTitle: 'הכול בוצע להיום',
      allDoneHeadline: 'כל המנות המתוכננות להיום טופלו',
      allDoneBody: (taken, total) =>
        `נטלת ${taken} מתוך ${total} מנות מתוכננות היום. כל הכבוד על ההתמדה.`,
      emptyTitle: 'אין תרופות מתוכננות ליום זה',
      emptyBody:
        'הוסיפו את התרופות או הוויטמינים היומיים שלכם לקבלת תזכורות ברורות ובזמן ולמעקב נוח.',
      addFirstMed: 'הוספת התרופה הראשונה',
      takenOfTotal: (taken, total) => `${taken}/${total} ניטלו`,
      statusTakenAt: (time) => `ניטלה בשעה ${time}`,
      statusTaken: 'ניטלה',
      statusSkippedWithReason: (reason) => `דולגה · ${reason}`,
      statusSkipped: 'דולגה',
      statusSnoozedUntil: (time) => `נדחתה עד ${time}`,
      statusDueNow: 'לנטילה עכשיו',
      statusLateHours: (hrs, mins) =>
        mins > 0
          ? `באיחור של ${hrs} שע׳ ו-${mins} דק׳`
          : `באיחור של ${hrs} שע׳`,
      statusLateMins: (mins) => `באיחור של ${mins} דק׳`,
      statusMissed: 'הוחמצה',
      statusUpcoming: 'מתוכננת',
      undo: 'ביטול',
      take: 'נטלתי',
      options: 'אפשרויות',
      moreOptionsAria: (name) => `אפשרויות נוספות עבור ${name}`,
      snoozeOrSkipTitle: 'דחייה או דילוג',
      todaysProgress: 'ההתקדמות להיום',
      daySummary: 'סיכום היום',
      takenWord: 'ניטלו',
      noDosesScheduled: 'אין מנות מתוכננות.',
      everyDoseTaken: 'כל המנות ניטלו בזמן.',
      remainingDoses: (count) =>
        count === 1 ? 'נותרה מנה אחת ליום זה.' : `נותרו ${count} מנות ליום זה.`,
      timelyAlertsTitle: 'תזכורות בזמן אמת',
      timelyAlertsBody:
        'התזכורות מצלצלות אוטומטית בשעות שנקבעו עם פרטי הגלולה ואישור בלחיצה אחת.',
      previewReminderAlert: 'תצוגה מקדימה של תזכורת',
      refillSoonTitle: 'חידוש מלאי בקרוב',
      refillSoonBody: 'המלאי בתרופות אלו עומד להסתיים.',
      pillsLeft: (count) => `נותרו ${count} יחידות`,
      refillBtn: 'מילוי +30',
    },
    adherence: {
      eyebrow: 'מעקב והיסטוריה',
      title: 'ההתמדה שלך לאורך זמן',
      selectRangeAria: 'בחירת טווח זמן',
      daysLabel: (days) => `${days} ימים`,
      dayRateLabel: (days) => `ממוצע ${days} ימים`,
      strongRoutine: 'שגרה מצוינת',
      steadyProgress: 'התקדמות יציבה',
      needsAttention: 'דורש תשומת לב',
      takenSummary: (taken, total, days) =>
        `ניטלו ${taken} מתוך ${total} מנות מתוכננות ב-${days} הימים האחרונים.`,
      streakLabel: (days) =>
        days === 1
          ? 'רצף ימים מלאים נוכחי: יום אחד'
          : `רצף ימים מלאים נוכחי: ${days} ימים`,
      takenOnTime: 'ניטלו בזמן',
      within45Min: 'בתוך 45 דק׳',
      takenLate: 'ניטלו באיחור',
      over45MinLate: 'מעל 45 דק׳ איחור',
      missedSkipped: 'הוחמצו / דולגו',
      skippedMissedBreakdown: (skipped, missed) =>
        `${skipped} דולגו · ${missed} הוחמצו`,
      dailyCalendarTitle: 'יומן יומי',
      dailyCalendarSubtitle: 'לחצו על כל יום לצפייה או עדכון של מנות בודדות.',
      legendAllTaken: 'הכול ניטל',
      legendPartial: 'חלקי',
      legendMissed: 'הוחמץ',
      noDoses: 'ללא מנות',
      all: 'הכול',
      missed: 'הוחמץ',
      partial: 'חלקי',
      dayAria: (date, taken, total) => `${date}: ניטלו ${taken} מתוך ${total}`,
      selectedDayDetails: 'פירוט היום שנבחר',
      takenTime: (time) => `ניטלה ${time}`,
      skippedReason: (reason) => `דולגה (${reason})`,
      noteFallback: 'הערה',
      upcoming: 'מתוכננת',
      missedStatus: 'הוחמצה',
      byMedication: (days) => `לפי תרופה (${days} ימים)`,
      byMedicationSubtitle:
        'ממוין כך שתרופות שאולי זקוקות לשעת תזכורת נוחה יותר מופיעות ראשונות.',
      shareTitle: 'שיתוף עם רופא או משפחה',
      shareBody: (days) =>
        `ייצאו את יומן המעקב של ${days} הימים האחרונים כקובץ CSV לרופא, העתיקו סיכום טקסט או הדפיסו דוח מסודר.`,
      csvDownloaded: 'קובץ CSV הורד',
      downloadCsv: (days) => `הורדת CSV (${days} ימים)`,
      summaryCopied: 'הסיכום הועתק',
      copyDoctorSummary: 'העתקת סיכום לרופא',
      printReport: 'הדפסת דוח',
    },
    chart: {
      weekly: 'שבועי',
      biweekly: 'דו-שבועי',
      monthly: 'חודשי',
      heading: (days) => `${days} הימים האחרונים · ניטלו מול הוחמצו`,
      ariaLabel: (rangeLabel) =>
        `תרשים עמודות ${rangeLabel} של מנות שניטלו מול מנות שהוחמצו`,
      periodAria: 'טווח זמן לתרשים',
      averageSummary: (days, takenPct, missedPct) =>
        `ממוצע ל-${days} ימים: ${takenPct}% ניטלו · ${missedPct}% הוחמצו או דולגו`,
      takenPctLabel: 'ניטלו (%)',
      missedPctLabel: 'הוחמצו (%)',
      takenWord: 'ניטלו',
      missedWord: 'הוחמצו',
      noScheduledYet: 'טרם הגיע מועד המנות להיום.',
      thisWeek: 'השבוע',
      previousWeek: 'שבוע שעבר',
      weekNumber: (n) => `שבוע ${n}`,
      dailyBreakdownAria: 'פירוט אחוזים יומי לשבוע האחרון',
      weeklyBreakdownAria: 'סיכום לפי שבועות',
      dayBarAria: (date, takenPct, missedPct) =>
        `${date}: ${takenPct}% ניטלו, ${missedPct}% הוחמצו`,
    },
    medications: {
      eyebrow: 'ארון התרופות',
      title: (activeCount) => `התרופות שלי (${activeCount} פעילות)`,
      addMedicine: 'הוספת תרופה',
      paused: 'מושהה',
      reminderTimes: 'שעות תזכורת',
      instructions: 'הוראות נטילה',
      supplyOnHand: 'מלאי זמין',
      pillsCount: (count) => `${count} יחידות`,
      refillSoonSuffix: ' · לחדש בקרוב',
      confirmRemove: (name) => `להסיר את ${name} מלוח התרופות שלך?`,
      yesRemove: 'כן, הסר',
      cancel: 'ביטול',
      refill30: 'מילוי +30',
      edit: 'עריכה',
      pause: 'השהיה',
      resume: 'חידוש',
      removeAria: (name) => `הסרת ${name}`,
      removeTitle: 'הסרת תרופה',
      emptyTitle: 'אין תרופות פעילות',
      emptyBody: 'הוסיפו תרופה כדי להתחיל לקבל תזכורות ולעקוב אחר המלאי.',
      pausedSectionTitle: (count) => `תרופות מושהות (${count})`,
    },
    form: {
      editTitle: 'עריכת תרופה',
      addTitle: 'הוספת תרופה חדשה',
      closeAria: 'סגירת הטופס',
      errNameRequired: 'נא להזין את שם התרופה.',
      errTimeRequired: 'נא לבחור לפחות שעת תזכורת אחת.',
      defaultDosage: 'מינון רגיל',
      defaultQty: 'טבליה אחת',
      defaultPurpose: 'בריאות יומיומית',
      defaultInstructions: 'ליטול עם כוס מים מלאה',
      previewFallbackName: 'שם התרופה',
      medicineName: 'שם התרופה',
      medicineNamePlaceholder: 'לדוגמה: ליזינופריל',
      strengthDosage: 'חוזק / מינון',
      strengthPlaceholder: 'לדוגמה: 10 מ״ג',
      amountPerDose: 'כמות למנה',
      amountPlaceholder: 'לדוגמה: טבליה אחת',
      whatItHelpsWith: 'מטרת התרופה',
      purposePlaceholder: 'לדוגמה: לחץ דם',
      instructionsLabel: 'הוראות נטילה',
      instructionsPlaceholder: 'לדוגמה: ליטול עם ארוחת בוקר ומים',
      reminderTimesLabel: 'שעות תזכורת',
      presetMorning: 'בוקר',
      presetMidday: 'צהריים',
      presetEvening: 'ערב',
      presetBedtime: 'לפני שינה',
      customTimeAria: 'שעת תזכורת מותאמת אישית',
      addCustomTime: 'הוספת שעה',
      removeTimeAria: (time) => `הסרת השעה ${time}`,
      pillShape: 'צורת הגלולה',
      pillColor: 'צבע הגלולה',
      pillsOnHand: 'כמות במלאי',
      refillAlertBelow: 'התראת מלאי מתחת ל-',
      cancel: 'ביטול',
      saveChanges: 'שמירת שינויים',
      saveMedicine: 'שמירת תרופה',
    },
    reminder: {
      sampleTitle: 'תזכורת תרופה לדוגמה',
      dueTitle: 'הגיע הזמן לתרופה שלך',
      replayChimeAria: 'השמעת צליל התזכורת שוב',
      replayChimeTitle: 'השמעת צליל',
      closeAria: 'סגירת תזכורת',
      scheduledFor: (time) => `מתוכננת לשעה ${time}`,
      howToTakeIt: 'אופן הנטילה',
      defaultInstruction: 'ליטול עם כוס מים מלאה.',
      forPurpose: (purpose) => `עבור: ${purpose}`,
      iTookItNow: 'נטלתי עכשיו',
      remindIn: (mins) => `תזכורת בעוד ${mins} דק׳`,
      skipThisDose: 'דילוג על מנה זו',
      whySkipping: 'מדוע הינך מדלג/ת על מנה זו?',
      backToReminder: 'חזרה לתזכורת',
    },
    settings: {
      eyebrow: 'טיפול, התראות ונוחות',
      title: 'הגדרות תזכורות וקריאה',
      chimeTitle: 'צליל תזכורת והתראות',
      chimeDesc:
        'השמעת צליל נעים והצגת התראה ברורה על מסך מלא כאשר מגיע מועד מנה.',
      soundOn: 'צליל פעיל',
      muted: 'מושתק',
      chimeToneLabel: 'צליל התזכורת (לחצו להאזנה)',
      chimeBell: 'פעמון עדין',
      chimeBellDesc: 'צליל רך בן שני תווים',
      chimeWarm: 'אקורד חם',
      chimeWarmDesc: 'צליל רגוע ועולה',
      chimeClear: 'צליל ברור',
      chimeClearDesc: 'בהיר וקל יותר לשמיעה',
      snoozeDuration: 'משך נודניק',
      minutesLabel: (mins) => `${mins} דקות`,
      deviceNotifications: 'התראות מכשיר',
      notifGranted: 'התראות המכשיר מופעלות עבור שעות נטילת התרופות.',
      notifDenied:
        'ההתראות חסומות בהגדרות הדפדפן. התראות בתוך האפליקציה עדיין פועלות.',
      notifUnsupported: 'הדפדפן שלך משתמש בתזכורות וצלילים בתוך האפליקציה.',
      notifDefault: 'אפשרו התראות גם כאשר לשונית זו ברקע.',
      enableAlerts: 'הפעלת התראות',
      enabled: 'מופעל',
      testFullReminder: 'בדיקת מסך התזכורת המלא כעת',
      readingComfortTitle: 'נוחות קריאה ונגישות',
      readingComfortDesc: 'התאימו את גודל הטקסט וניגודיות המסגרות לקריאה נוחה.',
      textSize: 'גודל טקסט',
      textStandard: 'רגיל',
      textLarge: 'טקסט גדול',
      textXLarge: 'גדול במיוחד',
      highContrastTitle: 'מסגרות בניגודיות גבוהה',
      highContrastDesc: 'מחזק את קווי הכרטיסים וניגודיות הטקסט.',
      on: 'פעיל',
      off: 'כבוי',
      languageTitle: 'שפת האפליקציה',
      languageDesc: 'מעבר נוח בין אנגלית, עברית ופורטוגזית.',
      caregiverTitle: 'עדכון לבן משפחה או מטפל',
      caregiverDesc:
        'עדכנו בן משפחה בלחיצה אחת ושמרו את מספר בית המרקחת שלכם בהישג יד.',
      checkinCopied: 'העדכון להיום הועתק',
      copyTodaysUpdate: 'העתקת עדכון להיום',
      caregiverName: 'שם המטפל/ת או בן המשפחה',
      relationship: 'קרבה',
      phoneNumber: 'מספר טלפון',
      pharmacyName: 'שם בית המרקחת',
      pharmacyPhone: 'טלפון בית המרקחת',
      callCaregiver: (firstName) => `התקשרות ל-${firstName}`,
      caregiverFallback: 'מטפל',
      saved: 'נשמר',
      saveContacts: 'שמירת אנשי קשר',
      checkinHeader: (taken, total) =>
        `עדכון תרופות להיום: ניטלו ${taken} מתוך ${total} מנות.`,
      checkinTakenAt: (time) => `ניטלה בשעה ${time}`,
      checkinSkipped: 'דולגה',
      checkinStillDue: 'עדיין לנטילה',
      checkinScheduled: (time) => `מתוכננת ל-${time}`,
    },
    nearby: {
      eyebrow: 'איתור שירותי בריאות',
      title: 'בתי מרקחת, מרפאות ובתי חולים קרובים',
      showingArea: 'אזור מוצג:',
      defaultArea: 'סן פרנסיסקו (אזור ברירת מחדל)',
      yourCurrentLocation: 'המיקום הנוכחי שלך',
      currentMapArea: 'אזור המפה הנוכחי',
      searchAria: 'חיפוש לפי עיר, מיקוד או כתובת',
      searchPlaceholder: 'הקלידו עיר, מיקוד או כתובת...',
      suggestionsAria: 'הצעות כתובת',
      locating: 'מאתר...',
      useMyLocation: 'השתמש במיקום שלי',
      filterTypeAria: 'סינון לפי סוג מוסד רפואי',
      catAll: 'הכול',
      catPharmacies: 'בתי מרקחת',
      catClinics: 'מרפאות',
      catHospitals: 'בתי חולים',
      labelPharmacy: 'בית מרקחת',
      labelClinic: 'מרפאה',
      labelHospital: 'בית חולים',
      healthcareFacility: 'מוסד רפואי',
      openNow: 'פתוח עכשיו',
      closedNow: 'סגור עכשיו',
      radiusAria: 'רדיוס חיפוש',
      radiusLabels: ['3 ק״מ', '8 ק״מ', '16 ק״מ'],
      searchThisArea: 'חפש באזור זה',
      emergencyNotice: 'במקרה חירום, חייגו 101 או לשירותי החירום המקומיים.',
      listAria: 'רשימת מוסדות רפואיים קרובים',
      nearbyPlaces: (count) => `מקומות קרובים (${count})`,
      sortedByDistance: 'ממוין לפי מרחק · לחצו על מקום להצגה במפה',
      searching: 'מחפש...',
      tryAgain: 'נסו שוב',
      findingPlaces: 'מחפש בתי מרקחת, מרפאות ובתי חולים קרובים...',
      noFacilitiesTitle: 'לא נמצאו מקומות מתאימים',
      noFacilitiesOpenNow:
        'נסו לכבות את המסנן "פתוח עכשיו" או להרחיב את רדיוס החיפוש.',
      noFacilitiesGeneral: 'נסו להרחיב את מרחק החיפוש או לחפש עיר סמוכה.',
      wheelchairAccessible: 'כניסה נגישה לכיסא גלגלים',
      call: 'חיוג',
      directions: 'ניווט',
      savedPharmacy: 'בית המרקחת השמור',
      saveAsMyPharmacy: 'שמירה כבית המרקחת שלי',
      myPharmacy: 'בית המרקחת שלי',
      setAsMyPharmacy: 'הגדרה כבית המרקחת שלי',
      errQuota:
        'הגעת למכסת Google Maps Platform. ראו את ההודעה בראש העמוד לאפשרויות החשבון.',
      errLoad:
        'לא ניתן לטעון מיקומים קרובים כרגע. בדקו את החיבור ונסו שוב.',
      errMoveAddress: 'לא ניתן לעבור לכתובת זו. נסו כתובת אחרת.',
      errNoGeolocation:
        'שירותי מיקום אינם זמינים בדפדפן זה. נסו לחפש עיר או כתובת למעלה.',
      errPermissionDenied:
        'הרשאת המיקום נדחתה. ניתן להקליד עיר או כתובת בשדה החיפוש למעלה.',
      errLocationFailed:
        'לא ניתן לאתר את מיקומך כרגע. נסו להזין כתובת או עיר למעלה.',
      notConfiguredBody:
        'Google Maps Platform עדיין אינו מוגדר. השלימו את ההגדרה כדי לצפות בבתי מרקחת, מרפאות ובתי חולים קרובים על המפה.',
      yourLocationAria: 'המיקום שלך',
      distanceUnit: 'ק״מ',
    },
    pwa: {
      installedTitle: 'מותקן במכשיר זה',
      installedDesc:
        'SteadyDose כבר שמורה במסך הבית שלך לגישה מהירה גם ללא חיבור לאינטרנט.',
      installTitle: 'התקנה בטלפון הנייד',
      installDesc:
        'הוסיפו את SteadyDose למסך הבית של הטלפון לגישה בלחיצה אחת ומעקב תרופות לא מקוון.',
      appInstalled: 'האפליקציה הותקנה',
      downloadApp: 'הורדת האפליקציה',
      guideTitle: 'התקנת SteadyDose בטלפון שלך',
      closeGuideAria: 'סגירת הוראות ההתקנה',
      guideIntro:
        'SteadyDose מותקנת ישירות מהדפדפן בטלפון — ללא צורך בסיסמה לחנות האפליקציות.',
      iosHeading: 'באייפון או אייפד (Safari)',
      iosStep1Prefix: 'לחצו על כפתור',
      iosStep1Share: 'השיתוף',
      iosStep1Suffix: 'בתחתית דפדפן Safari.',
      iosStep2Prefix: 'גללו מטה ולחצו על',
      iosStep2Action: 'הוספה למסך הבית',
      iosStep3Prefix: 'לחצו על',
      iosStep3Action: 'הוספה',
      iosStep3Suffix: 'בפינה העליונה כדי להציב את SteadyDose במסך הבית.',
      androidHeading: 'באנדרואיד (Chrome)',
      androidStep1Prefix: 'לחצו על כפתור',
      androidStep1Menu: 'התפריט',
      androidStep1Suffix: 'בפינה העליונה של Chrome.',
      androidStep2Prefix: 'לחצו על',
      androidStep2Action1: 'התקנת האפליקציה',
      androidStep2Or: 'או',
      androidStep2Action2: 'הוספה למסך הבית',
      androidStep3Prefix: 'אשרו בלחיצה על',
      androidStep3Action: 'התקנה',
      appLinkCopied: 'הקישור הועתק',
      copyLinkForPhone: 'העתקת קישור לטלפון',
      done: 'סיום',
    },
    report: {
      title: 'SteadyDose — סיכום מעקב נטילת תרופות',
      generated: (date) => `תאריך הפקה: ${date}`,
      period: (days) => `תקופה: ${days} הימים האחרונים`,
      overall: (pct, taken, total) =>
        `התמדה כוללת: ${pct}% (ניטלו ${taken} מתוך ${total} מנות)`,
      breakdown: (onTime, late, skipped, missed) =>
        `מנות בזמן: ${onTime} · באיחור: ${late} · דולגו: ${skipped} · הוחמצו: ${missed}`,
      streak: (days) => `רצף ימים מלאים נוכחי: ${days}`,
      medBreakdown: 'פירוט לפי תרופה:',
      medLine: (name, dosage, times, rate, taken, total, remaining) =>
        `- ${name} ${dosage} (${times}): ${rate}% (${taken}/${total} ניטלו) · נותרו ${remaining} יחידות`,
      todayStatus: 'סטטוס להיום:',
      takenAt: (time) => `ניטלה בשעה ${time}`,
      skipped: (reason) => `דולגה (${reason})`,
      noReason: 'ללא סיבה',
      overdue: 'באיחור',
      upcoming: 'מתוכננת',
      csvHeaders: [
        'תאריך',
        'שעה מתוכננת',
        'תרופה',
        'מינון',
        'כמות',
        'מטרה',
        'סטטוס',
        'שעת נטילה',
        'הערות',
      ],
      csvTakenOnTime: 'ניטלה (בזמן)',
      csvTakenLate: 'ניטלה (באיחור)',
      csvTaken: 'ניטלה',
      csvSkipped: 'דולגה',
      csvSnoozed: 'נדחתה',
      csvSnoozedUntil: (time) => `נדחתה עד ${time}`,
      csvUpcoming: 'מתוכננת',
      csvMissed: 'הוחמצה',
    },
  },

  pt: {
    meta: {
      appTitle: 'SteadyDose — Lembretes e Controle de Medicamentos',
      languageLabel: 'Idioma',
      chooseLanguageAria: 'Escolher idioma do aplicativo',
    },
    nav: {
      today: 'Hoje',
      adherence: 'Adesão',
      medications: 'Medicamentos',
      nearby: 'Locais Próximos',
      alerts: 'Alertas e Ajustes',
      shortToday: 'Hoje',
      shortAdherence: 'Histórico',
      shortMedications: 'Remédios',
      shortNearby: 'Próximos',
      shortAlerts: 'Alertas',
      addMedicine: 'Adicionar Remédio',
      mainNavAria: 'Navegação principal',
      mobileNavAria: 'Navegação móvel',
    },
    offline: {
      banner:
        'Modo Offline — Seus horários e histórico de medicamentos continuam disponíveis neste dispositivo.',
    },
    mapsQuota: {
      prefix:
        'Cota do Google Maps Platform atingida. Se você é o proprietário do app, visite o',
      linkText: 'site de desenvolvedores do Maps',
      suffix: 'para instruções de atualização da conta.',
    },
    periods: {
      morning: { title: 'Manhã', range: 'Antes do meio-dia' },
      afternoon: { title: 'Tarde', range: '12:00 – 17:00' },
      evening: { title: 'Noite', range: '17:00 – 20:30' },
      bedtime: { title: 'Antes de Dormir', range: '20:30 – Meia-noite' },
    },
    pills: {
      colors: {
        white: { label: 'Branco', short: 'Branco' },
        sky: { label: 'Azul Claro', short: 'Azul' },
        butter: { label: 'Amarelo Claro', short: 'Amarelo' },
        coral: { label: 'Pêssego', short: 'Pêssego' },
        sage: { label: 'Verde Menta', short: 'Verde' },
        amber: { label: 'Âmbar Dourado', short: 'Âmbar' },
      },
      shapes: {
        round: 'Redondo',
        oval: 'Oval',
        capsule: 'Cápsula',
        square: 'Quadrado',
      },
      pillAria: (color, shape) => `Comprimido ${shape} na cor ${color}`,
    },
    skipReasons: {
      Forgot: 'Esqueci',
      'Not feeling well': 'Não estou me sentindo bem',
      'Ran out of pills': 'Os comprimidos acabaram',
      'Doctor advised': 'Orientação médica',
    },
    toasts: {
      taken: (name) => `${name} registrado como tomado.`,
      reset: (name, time) => `${name} das ${time} redefinido.`,
      snoozed: (name, mins) => `Lembrete de ${name} adiado por ${mins} minutos.`,
      skipped: (name) => `${name} marcado como pulado.`,
      updated: (name) => `${name} atualizado.`,
      added: (name) => `${name} adicionado à sua rotina.`,
      resumed: (name) => `Lembretes de ${name} retomados.`,
      paused: (name) => `Lembretes de ${name} pausados.`,
      removed: (name) => `${name} removido.`,
      refilled: (amount, name) => `${amount} unidades adicionadas a ${name}.`,
      notificationsEnabled: 'Notificações de medicamentos ativadas.',
      addMedFirst: 'Adicione um medicamento primeiro para testar o lembrete.',
      savedPharmacy: (name) => `${name} salvo como sua farmácia.`,
      notificationTitle: (name, dosage) => `Hora de tomar ${name} ${dosage}`,
    },
    today: {
      todaySchedule: 'Agenda de Hoje',
      dailySchedule: 'Agenda Diária',
      returnToToday: 'Voltar para Hoje',
      chooseDayAria: 'Escolher um dia',
      todayShort: 'Hoje',
      nextMedDueAria: 'Próximo medicamento',
      actionNeededOverdue: 'Atenção · Dose em Atraso',
      readyToTakeNow: 'Pronto para Tomar Agora',
      nextScheduledMed: 'Próximo Medicamento Agendado',
      markAsTaken: 'Marcar como Tomado',
      remindIn: (mins) => `Lembrar em ${mins} min`,
      allDoneTitle: 'Tudo Pronto por Hoje',
      allDoneHeadline: 'Todas as doses agendadas foram registradas',
      allDoneBody: (taken, total) =>
        `Você tomou ${taken} de ${total} doses agendadas hoje. Excelente consistência.`,
      emptyTitle: 'Nenhum medicamento agendado para este dia',
      emptyBody:
        'Adicione seus medicamentos ou vitaminas diárias para receber lembretes claros no horário certo.',
      addFirstMed: 'Adicionar Primeiro Medicamento',
      takenOfTotal: (taken, total) => `${taken}/${total} tomadas`,
      statusTakenAt: (time) => `Tomado às ${time}`,
      statusTaken: 'Tomado',
      statusSkippedWithReason: (reason) => `Pulado · ${reason}`,
      statusSkipped: 'Pulado',
      statusSnoozedUntil: (time) => `Adiado até ${time}`,
      statusDueNow: 'Na hora de tomar',
      statusLateHours: (hrs, mins) =>
        mins > 0
          ? `Atrasado ${hrs} h ${mins} min`
          : `Atrasado ${hrs} h`,
      statusLateMins: (mins) => `Atrasado ${mins} min`,
      statusMissed: 'Perdida',
      statusUpcoming: 'Próxima',
      undo: 'Desfazer',
      take: 'Tomar',
      options: 'Opções',
      moreOptionsAria: (name) => `Mais opções para ${name}`,
      snoozeOrSkipTitle: 'Adiar ou Pular',
      todaysProgress: 'Progresso de Hoje',
      daySummary: 'Resumo do Dia',
      takenWord: 'tomadas',
      noDosesScheduled: 'Nenhuma dose agendada.',
      everyDoseTaken: 'Todas as doses foram tomadas no horário.',
      remainingDoses: (count) =>
        count === 1
          ? 'Falta 1 dose para este dia.'
          : `Faltam ${count} doses para este dia.`,
      timelyAlertsTitle: 'Alertas no Horário Certo',
      timelyAlertsBody:
        'Os lembretes tocam automaticamente nos horários definidos com detalhes do comprimido e confirmação em um toque.',
      previewReminderAlert: 'Testar Alerta de Lembrete',
      refillSoonTitle: 'Repor em Breve',
      refillSoonBody: 'Estes medicamentos estão com estoque baixo.',
      pillsLeft: (count) => `Restam ${count} unidades`,
      refillBtn: '+30 Repor',
    },
    adherence: {
      eyebrow: 'Adesão e Histórico',
      title: 'Sua Consistência ao Longo do Tempo',
      selectRangeAria: 'Selecionar período',
      daysLabel: (days) => `${days} Dias`,
      dayRateLabel: (days) => `taxa de ${days}d`,
      strongRoutine: 'Rotina Excelente',
      steadyProgress: 'Progresso Constante',
      needsAttention: 'Requer Atenção',
      takenSummary: (taken, total, days) =>
        `${taken} de ${total} doses agendadas tomadas nos últimos ${days} dias.`,
      streakLabel: (days) =>
        `Sequência atual de dias completos: ${days} dia${days === 1 ? '' : 's'}`,
      takenOnTime: 'No Horário',
      within45Min: 'Até 45 min',
      takenLate: 'Com Atraso',
      over45MinLate: 'Mais de 45 min',
      missedSkipped: 'Perdidas / Puladas',
      skippedMissedBreakdown: (skipped, missed) =>
        `${skipped} puladas · ${missed} perdidas`,
      dailyCalendarTitle: 'Calendário Diário',
      dailyCalendarSubtitle:
        'Toque em qualquer dia para ver ou atualizar doses individuais.',
      legendAllTaken: 'Todas tomadas',
      legendPartial: 'Parcial',
      legendMissed: 'Perdida',
      noDoses: 'Sem doses',
      all: 'Todas',
      missed: 'Perdida',
      partial: 'Parcial',
      dayAria: (date, taken, total) => `${date}: ${taken} de ${total} tomadas`,
      selectedDayDetails: 'Detalhes do Dia Selecionado',
      takenTime: (time) => `Tomado às ${time}`,
      skippedReason: (reason) => `Pulado (${reason})`,
      noteFallback: 'Nota',
      upcoming: 'Próxima',
      missedStatus: 'Perdida',
      byMedication: (days) => `Por Medicamento (${days} Dias)`,
      byMedicationSubtitle:
        'Ordenado com os medicamentos que podem precisar de um horário mais prático primeiro.',
      shareTitle: 'Compartilhar com Médico ou Família',
      shareBody: (days) =>
        `Exporte seu histórico de ${days} dias em planilha CSV para o profissional de saúde, copie um resumo ou imprima um relatório limpo.`,
      csvDownloaded: 'CSV Baixado',
      downloadCsv: (days) => `Baixar CSV (${days} Dias)`,
      summaryCopied: 'Resumo Copiado',
      copyDoctorSummary: 'Copiar Resumo Médico',
      printReport: 'Imprimir Relatório',
    },
    chart: {
      weekly: 'Semanal',
      biweekly: 'Quinzenal',
      monthly: 'Mensal',
      heading: (days) => `Últimos ${days} Dias · Tomadas vs. Perdidas`,
      ariaLabel: (rangeLabel) =>
        `Gráfico ${rangeLabel} de doses tomadas versus perdidas`,
      periodAria: 'Período do gráfico',
      averageSummary: (days, takenPct, missedPct) =>
        `Média de ${days} dias: ${takenPct}% tomadas · ${missedPct}% perdidas ou puladas`,
      takenPctLabel: 'Tomadas (%)',
      missedPctLabel: 'Perdidas (%)',
      takenWord: 'Tomadas',
      missedWord: 'Perdidas',
      noScheduledYet: 'Nenhuma dose vencida até o momento.',
      thisWeek: 'Esta Semana',
      previousWeek: 'Semana Anterior',
      weekNumber: (n) => `Semana ${n}`,
      dailyBreakdownAria: 'Porcentagem diária da última semana',
      weeklyBreakdownAria: 'Resumo semanal',
      dayBarAria: (date, takenPct, missedPct) =>
        `${date}: ${takenPct}% tomadas, ${missedPct}% perdidas`,
    },
    medications: {
      eyebrow: 'Caixa de Remédios',
      title: (activeCount) => `Meus Medicamentos (${activeCount} Ativos)`,
      addMedicine: 'Adicionar Remédio',
      paused: 'Pausado',
      reminderTimes: 'Horários dos lembretes',
      instructions: 'Instruções',
      supplyOnHand: 'Estoque disponível',
      pillsCount: (count) => `${count} unidades`,
      refillSoonSuffix: ' · Repor em breve',
      confirmRemove: (name) => `Remover ${name} da sua agenda?`,
      yesRemove: 'Sim, Remover',
      cancel: 'Cancelar',
      refill30: '+30 Repor',
      edit: 'Editar',
      pause: 'Pausar',
      resume: 'Retomar',
      removeAria: (name) => `Remover ${name}`,
      removeTitle: 'Remover medicamento',
      emptyTitle: 'Nenhum medicamento ativo',
      emptyBody:
        'Adicione um medicamento para começar a receber lembretes e acompanhar o estoque.',
      pausedSectionTitle: (count) => `Medicamentos Pausados (${count})`,
    },
    form: {
      editTitle: 'Editar Medicamento',
      addTitle: 'Adicionar Novo Medicamento',
      closeAria: 'Fechar formulário',
      errNameRequired: 'Por favor, informe o nome do medicamento.',
      errTimeRequired: 'Por favor, escolha pelo menos um horário de lembrete.',
      defaultDosage: 'Dose padrão',
      defaultQty: '1 comprimido',
      defaultPurpose: 'Saúde diária',
      defaultInstructions: 'Tomar com um copo cheio de água',
      previewFallbackName: 'Nome do Medicamento',
      medicineName: 'Nome do Medicamento',
      medicineNamePlaceholder: 'ex.: Lisinopril',
      strengthDosage: 'Dosagem / Concentração',
      strengthPlaceholder: 'ex.: 10 mg',
      amountPerDose: 'Quantidade por Dose',
      amountPlaceholder: 'ex.: 1 comprimido',
      whatItHelpsWith: 'Para que Serve',
      purposePlaceholder: 'ex.: Pressão arterial',
      instructionsLabel: 'Instruções',
      instructionsPlaceholder: 'ex.: Tomar com o café da manhã e água',
      reminderTimesLabel: 'Horários de Lembrete',
      presetMorning: 'Manhã',
      presetMidday: 'Almoço',
      presetEvening: 'Noite',
      presetBedtime: 'Dormir',
      customTimeAria: 'Horário personalizado',
      addCustomTime: 'Adicionar Horário',
      removeTimeAria: (time) => `Remover ${time}`,
      pillShape: 'Formato do Comprimido',
      pillColor: 'Cor do Comprimido',
      pillsOnHand: 'Unidades em Estoque',
      refillAlertBelow: 'Avisar Reposição Abaixo de',
      cancel: 'Cancelar',
      saveChanges: 'Salvar Alterações',
      saveMedicine: 'Salvar Medicamento',
    },
    reminder: {
      sampleTitle: 'Exemplo de Lembrete de Medicamento',
      dueTitle: 'Hora do Seu Medicamento',
      replayChimeAria: 'Tocar som do lembrete novamente',
      replayChimeTitle: 'Tocar som',
      closeAria: 'Fechar lembrete',
      scheduledFor: (time) => `Agendado para ${time}`,
      howToTakeIt: 'Como tomar',
      defaultInstruction: 'Tomar com um copo cheio de água.',
      forPurpose: (purpose) => `Para: ${purpose}`,
      iTookItNow: 'Já Tomei Agora',
      remindIn: (mins) => `Lembrar em ${mins} min`,
      skipThisDose: 'Pular Esta Dose',
      whySkipping: 'Por que você está pulando esta dose?',
      backToReminder: 'Voltar ao lembrete',
    },
    settings: {
      eyebrow: 'Cuidados, Alertas e Conforto',
      title: 'Configurações de Lembretes e Leitura',
      chimeTitle: 'Som e Alertas de Lembrete',
      chimeDesc:
        'Toca um som agradável e exibe um alerta claro em tela cheia na hora da dose.',
      soundOn: 'Som Ligado',
      muted: 'Silenciado',
      chimeToneLabel: 'Toque do Lembrete (toque para ouvir)',
      chimeBell: 'Sino Suave',
      chimeBellDesc: 'Toque delicado de duas notas',
      chimeWarm: 'Acorde Calmo',
      chimeWarmDesc: 'Melodia suave ascendente',
      chimeClear: 'Tom Nítido',
      chimeClearDesc: 'Mais claro e fácil de ouvir',
      snoozeDuration: 'Tempo de Soneca',
      minutesLabel: (mins) => `${mins} minutos`,
      deviceNotifications: 'Notificações do Dispositivo',
      notifGranted:
        'Os alertas do dispositivo estão ativados para seus horários de medicação.',
      notifDenied:
        'As notificações estão bloqueadas no navegador. Os alertas no app continuam funcionando.',
      notifUnsupported:
        'Seu navegador utiliza lembretes e sons dentro do aplicativo.',
      notifDefault: 'Permita alertas mesmo com esta aba em segundo plano.',
      enableAlerts: 'Ativar Alertas',
      enabled: 'Ativado',
      testFullReminder: 'Testar Tela de Lembrete Agora',
      readingComfortTitle: 'Conforto de Leitura e Acessibilidade',
      readingComfortDesc:
        'Ajuste o tamanho do texto e o contraste das bordas para uma leitura confortável.',
      textSize: 'Tamanho do Texto',
      textStandard: 'Padrão',
      textLarge: 'Texto Grande',
      textXLarge: 'Extra Grande',
      highContrastTitle: 'Bordas de Alto Contraste',
      highContrastDesc:
        'Reforça os contornos dos cartões e o contraste do texto.',
      on: 'Ligado',
      off: 'Desligado',
      languageTitle: 'Idioma do Aplicativo',
      languageDesc:
        'Alterne a interface entre Inglês, Hebraico e Português.',
      caregiverTitle: 'Acompanhamento Familiar',
      caregiverDesc:
        'Atualize um familiar com um toque e mantenha o telefone da sua farmácia sempre à mão.',
      checkinCopied: 'Resumo de Hoje Copiado',
      copyTodaysUpdate: 'Copiar Resumo de Hoje',
      caregiverName: 'Nome do Cuidador / Familiar',
      relationship: 'Parentesco',
      phoneNumber: 'Telefone',
      pharmacyName: 'Nome da Farmácia',
      pharmacyPhone: 'Telefone da Farmácia',
      callCaregiver: (firstName) => `Ligar para ${firstName}`,
      caregiverFallback: 'Cuidador',
      saved: 'Salvo',
      saveContacts: 'Salvar Contatos',
      checkinHeader: (taken, total) =>
        `Resumo de medicamentos de hoje: ${taken} de ${total} doses tomadas.`,
      checkinTakenAt: (time) => `Tomado às ${time}`,
      checkinSkipped: 'Pulado',
      checkinStillDue: 'Pendente',
      checkinScheduled: (time) => `Agendado ${time}`,
    },
    nearby: {
      eyebrow: 'Localizador de Saúde',
      title: 'Farmácias, Clínicas e Hospitais Próximos',
      showingArea: 'Área exibida:',
      defaultArea: 'São Francisco, CA (área padrão)',
      yourCurrentLocation: 'Sua localização atual',
      currentMapArea: 'Área atual do mapa',
      searchAria: 'Pesquisar por cidade, CEP ou endereço',
      searchPlaceholder: 'Digite cidade, CEP ou endereço...',
      suggestionsAria: 'Sugestões de endereço',
      locating: 'Localizando...',
      useMyLocation: 'Usar Minha Localização',
      filterTypeAria: 'Filtrar por tipo de serviço de saúde',
      catAll: 'Todos',
      catPharmacies: 'Farmácias',
      catClinics: 'Clínicas',
      catHospitals: 'Hospitais',
      labelPharmacy: 'Farmácia',
      labelClinic: 'Clínica',
      labelHospital: 'Hospital',
      healthcareFacility: 'Estabelecimento de Saúde',
      openNow: 'Aberto agora',
      closedNow: 'Fechado agora',
      radiusAria: 'Raio de busca',
      radiusLabels: ['3 km', '8 km', '16 km'],
      searchThisArea: 'Pesquisar Nesta Área',
      emergencyNotice:
        'Em emergências, ligue 192 (SAMU) ou para o serviço de emergência local.',
      listAria: 'Lista de estabelecimentos de saúde próximos',
      nearbyPlaces: (count) => `Locais Próximos (${count})`,
      sortedByDistance: 'Ordenado por distância · Toque em um local para ver no mapa',
      searching: 'Buscando...',
      tryAgain: 'Tentar Novamente',
      findingPlaces: 'Buscando farmácias, clínicas e hospitais próximos...',
      noFacilitiesTitle: 'Nenhum local encontrado',
      noFacilitiesOpenNow:
        'Tente desativar o filtro "Aberto agora" ou aumentar o raio de busca.',
      noFacilitiesGeneral:
        'Tente ampliar o raio de distância ou pesquisar uma cidade próxima.',
      wheelchairAccessible: 'Entrada acessível para cadeirantes',
      call: 'Ligar',
      directions: 'Rotas',
      savedPharmacy: 'Farmácia Salva',
      saveAsMyPharmacy: 'Salvar como Minha Farmácia',
      myPharmacy: 'Minha Farmácia',
      setAsMyPharmacy: 'Definir como Minha Farmácia',
      errQuota:
        'Limite de cota do Google Maps Platform atingido. Veja o aviso no topo para opções da conta.',
      errLoad:
        'Não foi possível carregar os locais próximos agora. Verifique sua conexão e tente novamente.',
      errMoveAddress:
        'Não foi possível ir para esse endereço. Tente outro.',
      errNoGeolocation:
        'Serviços de localização não disponíveis neste navegador. Pesquise sua cidade ou CEP acima.',
      errPermissionDenied:
        'A permissão de localização foi recusada. Você pode digitar sua cidade, endereço ou CEP acima.',
      errLocationFailed:
        'Não foi possível obter sua localização agora. Digite seu endereço ou cidade acima.',
      notConfiguredBody:
        'O Google Maps Platform ainda não está configurado. Conclua a configuração para visualizar farmácias, clínicas e hospitais próximos no mapa.',
      yourLocationAria: 'Sua localização',
      distanceUnit: 'km',
    },
    pwa: {
      installedTitle: 'Instalado Neste Dispositivo',
      installedDesc:
        'O SteadyDose já está salvo na sua tela inicial para acesso rápido e offline.',
      installTitle: 'Instalar no Celular',
      installDesc:
        'Adicione o SteadyDose à tela inicial do celular para acesso em um toque e acompanhamento offline.',
      appInstalled: 'App Instalado',
      downloadApp: 'Baixar Aplicativo',
      guideTitle: 'Instalar o SteadyDose no Celular',
      closeGuideAria: 'Fechar instruções de instalação',
      guideIntro:
        'O SteadyDose é instalado diretamente pelo navegador do celular — sem precisar de senha da loja de aplicativos.',
      iosHeading: 'No iPhone ou iPad (Safari)',
      iosStep1Prefix: 'Toque no botão',
      iosStep1Share: 'Compartilhar',
      iosStep1Suffix: 'na parte inferior do Safari.',
      iosStep2Prefix: 'Role para baixo e toque em',
      iosStep2Action: 'Adicionar à Tela de Início',
      iosStep3Prefix: 'Toque em',
      iosStep3Action: 'Adicionar',
      iosStep3Suffix: 'no canto superior para colocar o SteadyDose na tela inicial.',
      androidHeading: 'No Android (Chrome)',
      androidStep1Prefix: 'Toque no botão',
      androidStep1Menu: 'Menu',
      androidStep1Suffix: 'no canto superior direito do Chrome.',
      androidStep2Prefix: 'Toque em',
      androidStep2Action1: 'Instalar aplicativo',
      androidStep2Or: 'ou',
      androidStep2Action2: 'Adicionar à tela inicial',
      androidStep3Prefix: 'Confirme tocando em',
      androidStep3Action: 'Instalar',
      appLinkCopied: 'Link do App Copiado',
      copyLinkForPhone: 'Copiar Link para Celular',
      done: 'Concluir',
    },
    report: {
      title: 'SteadyDose — Resumo de Adesão aos Medicamentos',
      generated: (date) => `Gerado em: ${date}`,
      period: (days) => `Período: Últimos ${days} dias`,
      overall: (pct, taken, total) =>
        `Adesão Geral: ${pct}% (${taken} de ${total} doses tomadas)`,
      breakdown: (onTime, late, skipped, missed) =>
        `No horário: ${onTime} · Com atraso: ${late} · Puladas: ${skipped} · Perdidas: ${missed}`,
      streak: (days) => `Sequência atual de dias completos: ${days} dia(s)`,
      medBreakdown: 'Resumo por Medicamento:',
      medLine: (name, dosage, times, rate, taken, total, remaining) =>
        `- ${name} ${dosage} (${times}): ${rate}% (${taken}/${total} tomadas) · ${remaining} unidades restantes`,
      todayStatus: 'Status de Hoje:',
      takenAt: (time) => `Tomado às ${time}`,
      skipped: (reason) => `Pulado (${reason})`,
      noReason: 'Sem motivo',
      overdue: 'Em atraso',
      upcoming: 'Próxima',
      csvHeaders: [
        'Data',
        'Horário Agendado',
        'Medicamento',
        'Dosagem',
        'Quantidade',
        'Finalidade',
        'Status',
        'Tomado às',
        'Observações',
      ],
      csvTakenOnTime: 'Tomado (No Horário)',
      csvTakenLate: 'Tomado (Com Atraso)',
      csvTaken: 'Tomado',
      csvSkipped: 'Pulado',
      csvSnoozed: 'Adiado',
      csvSnoozedUntil: (time) => `Adiado até ${time}`,
      csvUpcoming: 'Próxima',
      csvMissed: 'Perdida',
    },
  },
};
