import { DiaryEntry, WorkoutEntry, MediaEntry, BookEntry, HabitEntry, LifeOSData } from '../types';
import { getMountainDateString } from './dateUtils';

let cachedSpreadsheetId: string | null = null;
let cachedSheetIds: { [sheetName: string]: number } = {};

/**
 * Make an authenticated fetch request to Google APIs via server proxy
 */
async function googleFetch(url: string, accessToken: string, options: RequestInit = {}): Promise<any> {
  const proxyUrl = `/api/google-proxy?url=${encodeURIComponent(url)}`;
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(proxyUrl, { ...options, headers });
  if (!response.ok) {
    const errText = await response.text();
    console.error(`Google API Error on ${url}:`, errText);
    throw new Error(`Google API Error: ${response.status} ${response.statusText} - ${errText}`);
  }

  if (response.status === 204) {
    return null;
  }
  return response.json();
}

/**
 * Search Google Drive for 'Life OS Database'
 * If not found, create it with Diary, Workouts, Media, Books sheets
 */
export async function getOrCreateSpreadsheet(accessToken: string): Promise<string> {
  if (cachedSpreadsheetId) {
    return cachedSpreadsheetId;
  }

  // 1. Search for the file
  const query = "name='Life OS Database' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false";
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`;
  const searchResult = await googleFetch(searchUrl, accessToken);

  let spreadsheetId = "";
  let needsInitialization = false;

  if (searchResult.files && searchResult.files.length > 0) {
    spreadsheetId = searchResult.files[0].id;
    cachedSpreadsheetId = spreadsheetId;
    await fetchSheetIds(spreadsheetId, accessToken);
    
    // Check if any required sheets are missing
    const required = ['Diary', 'Workouts', 'Media', 'Books', 'Habits'];
    const missing = required.filter(name => cachedSheetIds[name] === undefined);
    if (missing.length > 0) {
      needsInitialization = true;
    }
  } else {
    // 2. Create the spreadsheet
    const createUrl = 'https://www.googleapis.com/drive/v3/files';
    const createBody = {
      name: 'Life OS Database',
      mimeType: 'application/vnd.google-apps.spreadsheet',
    };
    const createdFile = await googleFetch(createUrl, accessToken, {
      method: 'POST',
      body: JSON.stringify(createBody),
    });

    spreadsheetId = createdFile.id;
    cachedSpreadsheetId = spreadsheetId;
    needsInitialization = true;
    await fetchSheetIds(spreadsheetId, accessToken);
  }

  if (needsInitialization) {
    // 3. Initialize/repair sheets (Diary, Workouts, Media, Books, Habits)
    const required = ['Diary', 'Workouts', 'Media', 'Books', 'Habits'];
    const requests: any[] = [];
    
    // Check if we have Sheet1 (or another default single sheet) to rename to the first missing required sheet
    const existingSheetNames = Object.keys(cachedSheetIds);
    let defaultSheetToRename: string | null = null;
    
    if (existingSheetNames.length === 1 && existingSheetNames[0] === 'Sheet1') {
      defaultSheetToRename = 'Sheet1';
    } else if (existingSheetNames.length === 1 && !required.includes(existingSheetNames[0])) {
      defaultSheetToRename = existingSheetNames[0];
    }

    const sheetsToCreate = [...required];

    if (defaultSheetToRename && cachedSheetIds['Diary'] === undefined) {
      // Rename Sheet1 to Diary
      const defaultId = cachedSheetIds[defaultSheetToRename];
      requests.push({
        updateSheetProperties: {
          properties: {
            sheetId: defaultId,
            title: 'Diary',
          },
          fields: 'title',
        },
      });
      // Remove Diary from sheets to create
      const index = sheetsToCreate.indexOf('Diary');
      if (index > -1) sheetsToCreate.splice(index, 1);
    }

    // Add any remaining required sheets that do not exist
    for (const sheetName of sheetsToCreate) {
      if (cachedSheetIds[sheetName] === undefined) {
        requests.push({
          addSheet: {
            properties: {
              title: sheetName,
            },
          },
        });
      }
    }

    if (requests.length > 0) {
      const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
      await googleFetch(batchUpdateUrl, accessToken, {
        method: 'POST',
        body: JSON.stringify({ requests }),
      });
    }

    // Fetch sheet IDs again to populate the map
    await fetchSheetIds(spreadsheetId, accessToken);

    // 4. Set Headers for all required sheets
    const valuesUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
    const valuesUpdateBody = {
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: 'Diary!A1:G1',
          values: [['Date', 'Mood', 'Summary', 'Gratitude', 'Workout Linked', 'Media Linked', 'Book Linked']],
        },
        {
          range: 'Workouts!A1:G1',
          values: [['Date', 'ID', 'Type', 'Day', 'Duration (mins)', 'Intensity', 'Notes/Routine']],
        },
        {
          range: 'Media!A1:G1',
          values: [['Date Watched', 'ID', 'Title', 'Type', 'Rating (1-5)', 'Status', 'Review/Thoughts']],
        },
        {
          range: 'Books!A1:I1',
          values: [['Date Logged', 'ID', 'Title', 'Author', 'Format', 'Progress (%)', 'Status', 'Key Takeaways', 'Date Finished']],
        },
        {
          range: 'Habits!A1:F1',
          values: [['Date', 'Sleep (Hours)', 'Water (Liters)', 'Meditation (Yes/No)', 'Mindful Eating (Yes/No)', 'Screen Time (Mins)']],
        },
      ],
    };

    await googleFetch(valuesUpdateUrl, accessToken, {
      method: 'POST',
      body: JSON.stringify(valuesUpdateBody),
    });
  }

  return spreadsheetId;
}

/**
 * Fetch the exact sheet IDs for all tabs to enable row deletion
 */
async function fetchSheetIds(spreadsheetId: string, accessToken: string): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const spreadsheet = await googleFetch(url, accessToken);

  if (spreadsheet.sheets) {
    cachedSheetIds = {};
    for (const s of spreadsheet.sheets) {
      if (s.properties && s.properties.title) {
        cachedSheetIds[s.properties.title] = s.properties.sheetId;
      }
    }
  }
}

/**
 * Read all data from the spreadsheet in a single batchGet request
 */
export async function fetchLifeOSData(accessToken: string): Promise<LifeOSData> {
  const spreadsheetId = await getOrCreateSpreadsheet(accessToken);
  const ranges = ['Diary!A2:G1000', 'Workouts!A2:G1000', 'Media!A2:G1000', 'Books!A2:I1000', 'Habits!A2:F1000'];
  const encodedRanges = ranges.map(r => encodeURIComponent(r));
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=${encodedRanges.join('&ranges=')}`;

  const response = await googleFetch(url, accessToken);
  const valueRanges = response.valueRanges || [];

  const diaryRows = valueRanges[0]?.values || [];
  const workoutRows = valueRanges[1]?.values || [];
  const mediaRows = valueRanges[2]?.values || [];
  const bookRows = valueRanges[3]?.values || [];
  const habitRows = valueRanges[4]?.values || [];

  // Parse Diary Rows
  const diary: DiaryEntry[] = diaryRows.map((row: any[], i: number) => ({
    date: row[0] || '',
    mood: Number(row[1]) || 3,
    summary: row[2] || '',
    gratitude: row[3] || '',
    workoutLinked: row[4] || '',
    mediaLinked: row[5] || '',
    bookLinked: row[6] || '',
    rowIndex: i + 2, // 1-based, index 0 is row A2
  }));

  // Parse Workouts Rows (Support 6-column backwards compatibility and new 7-column formats)
  const workouts: WorkoutEntry[] = workoutRows.map((row: any[], i: number) => {
    const isNewFormat = row.length >= 7;
    return {
      date: row[0] || '',
      id: row[1] || '',
      type: row[2] || '',
      day: isNewFormat ? (row[3] || '') : '',
      durationMinutes: isNewFormat ? (Number(row[4]) || 0) : (Number(row[3]) || 0),
      intensity: (isNewFormat ? (row[5] || 'Medium') : (row[4] || 'Medium')) as 'Low' | 'Medium' | 'High',
      notes: isNewFormat ? (row[6] || '') : (row[5] || ''),
      rowIndex: i + 2,
    };
  });

  // Parse Media Rows
  const media: MediaEntry[] = mediaRows.map((row: any[], i: number) => ({
    dateWatched: row[0] || '',
    id: row[1] || '',
    title: row[2] || '',
    type: (row[3] || 'Movie') as 'Movie' | 'TV Show',
    rating: Number(row[4]) || 3,
    status: (row[5] || 'Completed') as 'To Watch' | 'Watching' | 'Completed',
    review: row[6] || '',
    rowIndex: i + 2,
  }));

  // Parse Books Rows
  const books: BookEntry[] = bookRows.map((row: any[], i: number) => ({
    dateLogged: row[0] || '',
    id: row[1] || '',
    title: row[2] || '',
    author: row[3] || '',
    format: (row[4] || 'Physical') as 'Audiobook' | 'Kindle' | 'Physical' | 'E-book',
    progress: Number(row[5]) || 0,
    status: (row[6] || 'Reading') as 'To Read' | 'Reading' | 'Completed',
    keyTakeaways: row[7] || '',
    dateFinished: row[8] || '',
    rowIndex: i + 2,
  }));

  // Parse Habits Rows
  const habits: HabitEntry[] = habitRows.map((row: any[], i: number) => ({
    date: row[0] || '',
    sleepHours: Number(row[1]) || 0,
    waterLiters: Number(row[2]) || 0,
    meditation: (row[3] || '').trim().toLowerCase() === 'yes',
    mindfulEating: (row[4] || '').trim().toLowerCase() === 'yes',
    screenTimeMins: Number(row[5]) || 0,
    rowIndex: i + 2,
  }));

  return { diary, workouts, media, books, habits };
}

/**
 * Add a new diary entry
 */
export async function addDiaryEntry(accessToken: string, entry: Omit<DiaryEntry, 'rowIndex'>): Promise<void> {
  const spreadsheetId = await getOrCreateSpreadsheet(accessToken);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent('Diary!A2')}:append?valueInputOption=USER_ENTERED`;
  const body = {
    values: [[
      entry.date,
      entry.mood,
      entry.summary,
      entry.gratitude,
      entry.workoutLinked,
      entry.mediaLinked,
      entry.bookLinked,
    ]],
  };

  await googleFetch(url, accessToken, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Update an existing diary entry (since it's keyed by rowIndex)
 */
export async function updateDiaryEntry(accessToken: string, entry: DiaryEntry): Promise<void> {
  if (!entry.rowIndex) throw new Error('Cannot update entry without row index');
  const spreadsheetId = await getOrCreateSpreadsheet(accessToken);
  const range = `Diary!A${entry.rowIndex}:G${entry.rowIndex}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const body = {
    values: [[
      entry.date,
      entry.mood,
      entry.summary,
      entry.gratitude,
      entry.workoutLinked,
      entry.mediaLinked,
      entry.bookLinked,
    ]],
  };

  await googleFetch(url, accessToken, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * Add a workout entry
 */
export async function addWorkoutEntry(accessToken: string, entry: Omit<WorkoutEntry, 'rowIndex'>): Promise<void> {
  const spreadsheetId = await getOrCreateSpreadsheet(accessToken);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent('Workouts!A2')}:append?valueInputOption=USER_ENTERED`;
  const body = {
    values: [[
      entry.date,
      entry.id,
      entry.type,
      entry.day || '',
      entry.durationMinutes,
      entry.intensity,
      entry.notes,
    ]],
  };

  await googleFetch(url, accessToken, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Update a workout entry
 */
export async function updateWorkoutEntry(accessToken: string, entry: WorkoutEntry): Promise<void> {
  if (!entry.rowIndex) throw new Error('Cannot update workout without row index');
  const spreadsheetId = await getOrCreateSpreadsheet(accessToken);
  const range = `Workouts!A${entry.rowIndex}:G${entry.rowIndex}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const body = {
    values: [[
      entry.date,
      entry.id,
      entry.type,
      entry.day || '',
      entry.durationMinutes,
      entry.intensity,
      entry.notes,
    ]],
  };

  await googleFetch(url, accessToken, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * Add media entry
 */
export async function addMediaEntry(accessToken: string, entry: Omit<MediaEntry, 'rowIndex'>): Promise<void> {
  const spreadsheetId = await getOrCreateSpreadsheet(accessToken);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent('Media!A2')}:append?valueInputOption=USER_ENTERED`;
  const body = {
    values: [[
      entry.dateWatched,
      entry.id,
      entry.title,
      entry.type,
      entry.rating,
      entry.status,
      entry.review,
    ]],
  };

  await googleFetch(url, accessToken, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Update media entry
 */
export async function updateMediaEntry(accessToken: string, entry: MediaEntry): Promise<void> {
  if (!entry.rowIndex) throw new Error('Cannot update media without row index');
  const spreadsheetId = await getOrCreateSpreadsheet(accessToken);
  const range = `Media!A${entry.rowIndex}:G${entry.rowIndex}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const body = {
    values: [[
      entry.dateWatched,
      entry.id,
      entry.title,
      entry.type,
      entry.rating,
      entry.status,
      entry.review,
    ]],
  };

  await googleFetch(url, accessToken, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * Add book entry
 */
export async function addBookEntry(accessToken: string, entry: Omit<BookEntry, 'rowIndex'>): Promise<void> {
  const spreadsheetId = await getOrCreateSpreadsheet(accessToken);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent('Books!A2')}:append?valueInputOption=USER_ENTERED`;
  const body = {
    values: [[
      entry.dateLogged,
      entry.id,
      entry.title,
      entry.author,
      entry.format,
      entry.progress,
      entry.status,
      entry.keyTakeaways,
      entry.dateFinished,
    ]],
  };

  await googleFetch(url, accessToken, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Update book entry
 */
export async function updateBookEntry(accessToken: string, entry: BookEntry): Promise<void> {
  if (!entry.rowIndex) throw new Error('Cannot update book without row index');
  const spreadsheetId = await getOrCreateSpreadsheet(accessToken);
  const range = `Books!A${entry.rowIndex}:I${entry.rowIndex}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const body = {
    values: [[
      entry.dateLogged,
      entry.id,
      entry.title,
      entry.author,
      entry.format,
      entry.progress,
      entry.status,
      entry.keyTakeaways,
      entry.dateFinished,
    ]],
  };

  await googleFetch(url, accessToken, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * Delete a row from a specific sheet and shift remaining rows up
 */
export async function deleteRow(accessToken: string, sheetName: string, rowIndex: number): Promise<void> {
  const spreadsheetId = await getOrCreateSpreadsheet(accessToken);
  const sheetId = cachedSheetIds[sheetName];

  if (sheetId === undefined) {
    throw new Error(`Sheet ID not found for tab name: ${sheetName}`);
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  const body = {
    requests: [
      {
        deleteDimension: {
          range: {
            sheetId: sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex - 1, // 0-based index
            endIndex: rowIndex,       // exclusive
          },
        },
      },
    ],
  };

  await googleFetch(url, accessToken, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Forcefully remake the Life OS Database by renaming existing ones and creating a fresh one.
 */
export async function forceRemakeSpreadsheet(accessToken: string): Promise<string> {
  // Search for any existing Life OS Database files
  const query = "name='Life OS Database' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false";
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`;
  const searchResult = await googleFetch(searchUrl, accessToken);

  if (searchResult.files && searchResult.files.length > 0) {
    for (const file of searchResult.files) {
      const renameUrl = `https://www.googleapis.com/drive/v3/files/${file.id}`;
      const backupName = `Life OS Database (Backup - ${getMountainDateString()})`;
      await googleFetch(renameUrl, accessToken, {
        method: 'PATCH',
        body: JSON.stringify({ name: backupName }),
      });
    }
  }

  // Clear cache variables
  cachedSpreadsheetId = null;
  cachedSheetIds = {};

  // Create a brand new spreadsheet and return its ID
  return getOrCreateSpreadsheet(accessToken);
}

/**
 * Add a habit entry
 */
export async function addHabitEntry(accessToken: string, entry: Omit<HabitEntry, 'rowIndex'>): Promise<void> {
  const spreadsheetId = await getOrCreateSpreadsheet(accessToken);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent('Habits!A2')}:append?valueInputOption=USER_ENTERED`;
  const body = {
    values: [[
      entry.date,
      entry.sleepHours,
      entry.waterLiters,
      entry.meditation ? 'Yes' : 'No',
      entry.mindfulEating ? 'Yes' : 'No',
      entry.screenTimeMins,
    ]],
  };

  await googleFetch(url, accessToken, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Update a habit entry
 */
export async function updateHabitEntry(accessToken: string, entry: HabitEntry): Promise<void> {
  if (!entry.rowIndex) throw new Error('Cannot update habit without row index');
  const spreadsheetId = await getOrCreateSpreadsheet(accessToken);
  const range = `Habits!A${entry.rowIndex}:F${entry.rowIndex}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const body = {
    values: [[
      entry.date,
      entry.sleepHours,
      entry.waterLiters,
      entry.meditation ? 'Yes' : 'No',
      entry.mindfulEating ? 'Yes' : 'No',
      entry.screenTimeMins,
    ]],
  };

  await googleFetch(url, accessToken, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

