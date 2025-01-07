// src/app/api/scheduled/update-statuses.js

import { updateGameStatuses } from '../../../utils/updateGameStatuses';

export default async function handler(req, res) {
  try {
    await updateGameStatuses();
    res.status(200).json({ message: 'Statuses updated successfully.' });
  } catch (error) {
    console.error('Error in scheduled update:', error);
    res.status(500).json({ error: 'Internal Server Error.' });
  }
}
